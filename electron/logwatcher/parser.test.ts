import { describe, it, expect } from 'vitest';
import { parseLine, splitShipModel, MANUFACTURER_NAMES } from './parser';

describe('parseLine — sessions', () => {
  it('detects Log started line', () => {
    const e = parseLine('<2026-04-24T01:54:52.538Z> Log started on Fri Apr 24 01:54:52 2026');
    expect(e).toMatchObject({ kind: 'session-start' });
    expect(e!.at.toISOString()).toBe('2026-04-24T01:54:52.538Z');
  });

  it('detects SystemQuit with reason', () => {
    const e = parseLine(
      '<2026-04-24T03:18:54.901Z> [Notice] <SystemQuit> CSystem::Quit invoked with - cause=30016, reason=Quit via console command, exitCode=0'
    );
    expect(e).toMatchObject({ kind: 'session-end', reason: 'Quit via console command' });
  });
});

describe('parseLine — character', () => {
  it('extracts geid / accountId / name', () => {
    const e = parseLine(
      '<2026-04-24T01:55:03.478Z> [Notice] <AccountLoginCharacterStatus_Character> Character: createdAt 1774491502324 - updatedAt 1774491504832 - geid 5798842954408 - accountId 5815078 - name Skryking - state STATE_CURRENT [Team_GameServices][Login]'
    );
    expect(e).toMatchObject({
      kind: 'character',
      geid: '5798842954408',
      accountId: '5815078',
      name: 'Skryking',
    });
  });
});

describe('parseLine — version', () => {
  it('extracts Branch', () => {
    expect(parseLine('<2026-04-24T01:54:52.972Z> Branch: sc-alpha-4.7.0')).toMatchObject({
      kind: 'version',
      branch: 'sc-alpha-4.7.0',
    });
  });

  it('extracts FileVersion', () => {
    expect(parseLine('<2026-04-24T01:54:52.538Z> FileVersion: 4.7.178.8917')).toMatchObject({
      kind: 'version',
      fileVersion: '4.7.178.8917',
    });
  });

  it('extracts Changelist', () => {
    expect(parseLine('<2026-04-24T01:54:52.972Z> Changelist: 11674325')).toMatchObject({
      kind: 'version',
      changelist: '11674325',
    });
  });
});

describe('parseLine — ships', () => {
  it('detects Crusader Starlifter with variant', () => {
    const e = parseLine(
      '<2026-04-24T01:58:11.708Z> [Notice] <Local Route Guard - Server Rerouted> [ItemNavigation][CL][52460] | NOT AUTH | CRUS_Starlifter_M2_9738036576194[9738036576194]|CSCItemNavigation::PostInitialize'
    );
    expect(e).toMatchObject({
      kind: 'ship',
      manufacturerCode: 'CRUS',
      model: 'Starlifter_M2',
      geid: '9738036576194',
    });
  });

  it('detects RSI Perseus (no variant)', () => {
    const e = parseLine(
      '<2026-04-24T01:59:14.165Z> [Notice] <Local Route Guard - Server Rerouted> [ItemNavigation][CL][52460] | NOT AUTH | RSI_Perseus_9950302662131[9950302662131]|CSCItemNavigation'
    );
    expect(e).toMatchObject({ kind: 'ship', manufacturerCode: 'RSI', model: 'Perseus' });
  });

  it('ignores NULL ENTITY lines', () => {
    expect(
      parseLine(
        '<2026-04-24T01:56:08.870Z> [Notice] <Local Route Guard - Server Rerouted> [CL][52460] | NULL ENTITY|CSCItemNavigation'
      )
    ).toBeNull();
  });

  it('ignores unknown manufacturer prefixes', () => {
    expect(
      parseLine(
        '<2026-04-24T01:59:14.165Z> [Notice] <Local Route Guard> [CL][52460] | NOT AUTH | ZZZZ_Fake_1234567890123[1234567890123]|'
      )
    ).toBeNull();
  });
});

describe('parseLine — location', () => {
  it('detects LocationManager-Area18', () => {
    const e = parseLine(
      '<2026-04-24T01:56:17.410Z> [Error] <CEntityComponentLocationManager::PostInitialize::<lambda_2>::operator ()> LocationManager: LocationManager-Area18 - Class(LocationManager)'
    );
    expect(e).toMatchObject({ kind: 'location', name: 'Area18' });
  });
});

describe('parseLine — noise rejection', () => {
  it('returns null for empty strings', () => {
    expect(parseLine('')).toBeNull();
  });

  it('returns null for unrelated log lines', () => {
    expect(parseLine('<2026-04-24T01:54:52.538Z> Host CPU: Intel(R) Core(TM) Ultra 9 285K')).toBeNull();
  });
});

describe('splitShipModel', () => {
  it('separates variant code from model', () => {
    expect(splitShipModel('Starlifter_M2')).toEqual({ model: 'Starlifter', variant: 'M2' });
    expect(splitShipModel('Spirit_C1')).toEqual({ model: 'Spirit', variant: 'C1' });
  });

  it('returns no variant when none present', () => {
    expect(splitShipModel('Perseus')).toEqual({ model: 'Perseus', variant: null });
  });

  it('treats compact names like 315p as model-only', () => {
    expect(splitShipModel('315p')).toEqual({ model: '315p', variant: null });
  });
});

describe('MANUFACTURER_NAMES', () => {
  it('covers the prefixes seen in logs', () => {
    expect(MANUFACTURER_NAMES.CRUS).toBe('Crusader Industries');
    expect(MANUFACTURER_NAMES.RSI).toBe('Roberts Space Industries');
    expect(MANUFACTURER_NAMES.ORIG).toBe('Origin Jumpworks');
  });
});
