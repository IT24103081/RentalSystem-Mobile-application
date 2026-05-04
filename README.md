# Rental System MERN Starter

## Project structure

- `frontend` - React + Vite app
- `backend` - Express + MongoDB API

## Prerequisites

- Node.js 18+ (recommended)
- npm 9+
- MongoDB connection string

## Installation

Install dependencies in all required locations.

```bash
# root (for concurrent start script)
npm install

# backend dependencies
cd backend
npm install

# frontend dependencies
cd ../frontend
npm install
```

## Environment setup

Create these files before running the app:

- `backend/.env`
- `frontend/.env`

Suggested values:

```env
# backend/.env
MONGODB_URI=your_mongodb_connection_string
PORT=5001
JWT_SECRET=your_jwt_secret
```

```env
# frontend/.env
VITE_API_URL=http://localhost:5001
```

## Run the project

### Option 1: Run backend and frontend together (from root)

```bash
npm start
```

Note: The root `package.json` only defines `start`, not `dev`.
Use `npm start` at the project root.

This uses the root script and starts:

- Backend: `npm run dev --prefix backend`
- Frontend: `npm run dev --prefix frontend`

### Option 2: Run each service separately

Backend:

```bash
cd backend
npm run dev
```

Frontend:

```bash
cd frontend
npm run dev
```

## Local URLs

- Health route: `http://localhost:5001/api/health`
- Frontend URL: `http://localhost:5173`

## Expo Go preview

The web app can be opened inside Expo Go through a small React Native shell in `mobile/`.

1. Set `EXPO_PUBLIC_WEB_APP_URL` in `mobile/.env` to your computer's LAN URL, for example `http://192.168.1.42:5173`.
2. Start the backend and frontend from the root with `npm start`.
3. In another terminal, go to `mobile/`, install dependencies, and run `npm start`.
4. Open Expo Go and it will load the site directly.

If the phone cannot reach the site, check that both devices are on the same Wi-Fi network and that Windows Firewall allows port `5173`.

If port 5173 is already in use, stop the conflicting process first. The Expo shell depends on the frontend staying on 5173.

## Troubleshooting: Port already in use (Windows PowerShell)

If backend port `5001` is already in use:

```powershell
Get-NetTCPConnection -LocalPort 5001 -ErrorAction SilentlyContinue
```

Then stop the process using that PID:

```powershell
Stop-Process -Id <PID> -Force
```

Run the project again:

```bash
npm start
```
## add button
// <button onclick="createInvoice()">Create Invoice</button>

 ## color
 // <button style={{ backgroundColor: "green", color: "white" }}>