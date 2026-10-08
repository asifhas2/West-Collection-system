# ♻️ Smart Waste Collection & Reward System

> A full-stack capstone project — Pure C REST backend + React frontend + MongoDB Atlas

![CI/CD](https://github.com/asifhas2/West-Collection-system/actions/workflows/ci.yml/badge.svg)

---

## 🏗️ Architecture

```
React Frontend (Vite + TailwindCSS v4)   ↔   Pure C HTTP Server (port 8080)
        localhost:5173                         ├── data/*.json  (local storage)
                                               └── MongoDB Atlas (cloud sync)
```

---

## 🚀 Getting Started

### Prerequisites
- **GCC** (MinGW on Windows) for backend
- **Node.js 18+** and **npm** for frontend

### 1. Run the Backend

```bat
cd backend
build.bat          # Compiles server.c, router.c, db.c, cJSON.c → server.exe
server.exe         # Starts on http://localhost:8080
```

### 2. Run the Frontend

```bash
cd frontend
npm install
npm run dev        # Vite dev server → http://localhost:5173
```

---

## 📁 Project Structure

```
├── backend/
│   ├── server.c            ← HTTP socket server (port 8080)
│   ├── router.c            ← REST API router & handlers
│   ├── db.c                ← JSON file I/O + MongoDB sync
│   ├── cJSON.c/h           ← Embedded JSON library
│   ├── mongodb_config.h    ← ⚠️ DO NOT COMMIT — use GitHub Secrets
│   ├── build.bat           ← Windows GCC build script
│   └── data/               ← Local JSON flat-file database
│
└── frontend/
    ├── src/
    │   ├── App.jsx          ← Role-based routing
    │   ├── api.js           ← REST API client
    │   ├── context/         ← Auth context & state
    │   ├── components/      ← Navbar, Footer, LeafletMap
    │   └── pages/           ← Portal pages per user role
    ├── package.json
    └── vite.config.js
```

---

## 👥 User Roles

| Role | Portal | Capabilities |
|------|--------|-------------|
| 👤 **User** | UserPortal | Request pickup, track status, earn rewards |
| 🚛 **Collector** | CollectorPortal | View tasks, complete pickups, update routes |
| 🛠️ **Admin** | AdminPortal | Manage users, bins, trucks, routes, reports |

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login with credentials |
| POST | `/api/auth/register` | Register new user |
| GET/POST | `/api/requests` | Waste pickup requests |
| GET/POST | `/api/bins` | Smart bin management |
| GET/POST | `/api/trucks` | Truck fleet |
| GET/POST | `/api/collectors` | Collector staff |
| GET/POST | `/api/routes` | Collection routes |
| POST | `/api/tasks/complete` | Mark task complete |
| GET/POST | `/api/problems` | Problem reporting |
| GET | `/api/reports` | Analytics & reports |

---

## 🔒 GitHub Secrets Required

Add these in **Settings → Secrets → Actions**:

| Secret | Value |
|--------|-------|
| `MONGODB_URI` | Your MongoDB Atlas connection string |
| `MONGODB_USER` | Atlas username |
| `MONGODB_PASS` | Atlas password |
| `MONGODB_CLUSTER` | Atlas cluster hostname |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite 8, TailwindCSS v4 |
| Maps | Leaflet.js + react-leaflet |
| Icons | lucide-react |
| Backend | Pure C (C99), Winsock2/POSIX sockets |
| JSON | cJSON (embedded) |
| Database | MongoDB Atlas + local JSON fallback |
| CI/CD | GitHub Actions |

---

## 📄 License

MIT — Feel free to use and modify for educational purposes.
