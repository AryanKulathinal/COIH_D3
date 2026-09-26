# Setup the COIH project from scratch

Run the full setup sequence for the COIH project:

1. Check if MongoDB is running (`pgrep mongod`). If not, tell the user to start it.
2. Install server dependencies: `cd server && npm install --ignore-scripts`
3. Install client dependencies: `cd client && npm install`
4. Seed the database: `cd server && node src/seed.js`
5. Start the server: `cd server && node src/index.js` (background)
6. Start the client: `cd client && npx vite` (background)
7. Verify both are running by hitting `http://localhost:3001/health` and `http://localhost:5173`
8. Report the URLs and whether it's running in DEMO or LIVE mode

If the user has set ANTHROPIC_API_KEY in their environment, tell them to add it to `server/.env`.
