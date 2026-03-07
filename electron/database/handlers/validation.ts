/**
 * Lightweight input validation helpers for IPC handlers.
 * Validates at the system boundary before data reaches the database.
 */

export function requireString(value: unknown, fieldName: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${fieldName} is required and must be a non-empty string`);
  }
  return value.trim();
}

export function requireNonNegative(value: unknown, fieldName: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    throw new Error(`${fieldName} must be a non-negative number`);
  }
  return value;
}

export function requirePositiveInt(value: unknown, fieldName: string): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0) {
    throw new Error(`${fieldName} must be a positive integer`);
  }
  return value;
}

export function optionalString(value: unknown): string | undefined {
  if (value === null || value === undefined || value === '') return undefined;
  if (typeof value !== 'string') return undefined;
  return value.trim();
}

export function optionalNonNegative(value: unknown): number | undefined {
  if (value === null || value === undefined) return undefined;
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) return undefined;
  return value;
}

/**
 * Validates a ship create/update payload.
 * Throws on invalid required fields.
 */
export function validateShipInput(data: Record<string, unknown>, isUpdate = false) {
  if (!isUpdate) {
    requireString(data.manufacturer, 'manufacturer');
    requireString(data.model, 'model');
  } else {
    // For updates, if these fields are present they must be valid
    if (data.manufacturer !== undefined) requireString(data.manufacturer, 'manufacturer');
    if (data.model !== undefined) requireString(data.model, 'model');
  }
  if (data.acquiredPrice !== undefined && data.acquiredPrice !== null) {
    requireNonNegative(data.acquiredPrice, 'acquiredPrice');
  }
}

/**
 * Validates a location create/update payload.
 */
export function validateLocationInput(data: Record<string, unknown>, isUpdate = false) {
  if (!isUpdate) {
    requireString(data.name, 'name');
  } else {
    if (data.name !== undefined) requireString(data.name, 'name');
  }
}

/**
 * Validates a transaction create/update payload.
 */
export function validateTransactionInput(data: Record<string, unknown>, isUpdate = false) {
  if (!isUpdate) {
    if (typeof data.amount !== 'number' || !Number.isFinite(data.amount as number)) {
      throw new Error('amount is required and must be a valid number');
    }
    requireString(data.category, 'category');
  } else {
    if (data.amount !== undefined && (typeof data.amount !== 'number' || !Number.isFinite(data.amount as number))) {
      throw new Error('amount must be a valid number');
    }
    if (data.category !== undefined) requireString(data.category, 'category');
  }
}

/**
 * Validates a cargo run create/update payload.
 */
export function validateCargoRunInput(data: Record<string, unknown>, isUpdate = false) {
  if (!isUpdate) {
    requireString(data.commodity, 'commodity');
    requirePositiveInt(data.quantity, 'quantity');
    requireNonNegative(data.buyPrice, 'buyPrice');
  } else {
    if (data.commodity !== undefined) requireString(data.commodity, 'commodity');
    if (data.quantity !== undefined) requirePositiveInt(data.quantity, 'quantity');
    if (data.buyPrice !== undefined) requireNonNegative(data.buyPrice, 'buyPrice');
  }
}

/**
 * Validates a mission create/update payload.
 */
export function validateMissionInput(data: Record<string, unknown>, isUpdate = false) {
  if (!isUpdate) {
    requireString(data.title, 'title');
  } else {
    if (data.title !== undefined) requireString(data.title, 'title');
  }
  if (data.reward !== undefined && data.reward !== null) {
    requireNonNegative(data.reward, 'reward');
  }
}
