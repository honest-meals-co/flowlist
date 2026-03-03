# Backup — 2026-03-03

This folder contains a snapshot of the working app taken before the following changes were made:

1. Delete button added to archive cards
2. Inline editing for todos
3. Reset password on login screen
4. Day state machine rebuilt (wound_down replaces locked, forced wind_down on new day)

## State of the app at this backup

- Firebase Realtime Database migration was complete and working
- Data persistence was confirmed working (hats, todos, archives loading correctly)
- Firebase array normalisation fix was in place (toArr() in db.js)

## How to revert

To roll back to this version:

1. Copy `Flowlist.js` → `../components/Flowlist.js`
2. Copy `db.js`      → `../lib/db.js`
3. Copy `firebase.js`→ `../lib/firebase.js`
4. Copy `package.json` → `../package.json`
5. Run `npm install` in the project root
6. Restart the dev server with `npm run dev`
