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

If port 5173 is already in use, Vite will automatically use the next available port (for example, 5174 or 5175).

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