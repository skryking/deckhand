# Deckhand Build Setup

## After Installing Visual Studio Build Tools

1. **Restart your terminal** (or restart your computer)

2. **Navigate to the project**:
   ```
   cd C:\Dev\deckhand
   ```

3. **Rebuild better-sqlite3 for Electron**:
   ```
   npx @electron/rebuild -f -w better-sqlite3
   ```

4. **Start the app**:
   ```
   npm run dev
   ```

## If rebuild fails

Try running these commands:
```
npm cache clean --force
rm -rf node_modules
npm install
npx @electron/rebuild -f -w better-sqlite3
```

## Verify Python and Build Tools are working

```
python --version
```
Should show: Python 3.x.x

The Visual Studio Build Tools should be detected automatically by node-gyp.
