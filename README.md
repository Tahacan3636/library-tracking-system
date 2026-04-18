# Library Check-In/Out Tracking System

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-5.x-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![SQLite](https://img.shields.io/badge/SQLite-3-003B57?logo=sqlite&logoColor=white)](https://www.sqlite.org/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.x-010101?logo=socket.io&logoColor=white)](https://socket.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A QR code-based library check-in/out tracking system. Students can check in and out by scanning a QR code or entering their student ID. Features real-time monitoring, statistics dashboard, and report generation.

> **Demo:** [https://kutuphane-takip.onrender.com](https://kutuphane-takip.onrender.com) *(coming soon)*

---

## Features

- **QR Code Check-In/Out** - Students scan a QR code and the system automatically toggles entry/exit
- **Real-Time Tracking** - Live student counter, sound alerts, and toast notifications via Socket.IO
- **Admin Dashboard** - Statistics, charts (daily/hourly/weekly), student & user management, reports
- **Staff Panel** - Live counter, student list, manual check-out, notifications
- **Reports & Export** - CSV/Excel export, printable HTML reports (save as PDF)
- **Security** - JWT auth, role-based access, bcrypt, Helmet.js, rate limiting, prepared statements
- **PWA Support** - Installable on mobile, offline cache via Service Worker

---

## Tech Stack

| Backend | Frontend |
|---------|----------|
| Node.js + Express.js 5 | HTML5 / CSS3 / Vanilla JS |
| SQLite (better-sqlite3, WAL mode) | Chart.js |
| Socket.IO | Socket.IO Client |
| JWT + bcrypt | Web Audio API |
| Helmet + express-rate-limit | Service Worker (PWA) |
| multer + xlsx + csv-parser | |

---

## Getting Started

### Requirements
- Node.js **v18+**
- npm

### Installation

```bash
git clone https://github.com/Tahacan3636/kutuphane-takip-sistemi.git
cd kutuphane-takip-sistemi
npm install
cp .env.example .env    # Edit .env and change JWT_SECRET
npm run setup           # Create database + seed default data
npm start               # or: npm run dev
```

Open `http://localhost:3000` in your browser.

### Default Credentials

| Username | Password | Role |
|----------|----------|------|
| admin | admin123 | Admin |
| staff | staff123 | Staff |

---

## API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/login` | User login | Public |
| POST | `/api/auth/change-password` | Change password | Authenticated |
| GET/POST/DELETE | `/api/auth/users` | User management | Admin |
| POST | `/api/check-in` | Toggle check-in/out | Public (rate limited) |
| POST | `/api/check-in/manual-exit` | Manual check-out | Staff/Admin |
| GET | `/api/active` | Students currently inside | Staff/Admin |
| GET | `/api/logs` | Check-in/out records | Staff/Admin |
| GET | `/api/stats` | Dashboard statistics | Admin |
| GET/POST/PUT/DELETE | `/api/students` | Student CRUD | Admin |
| POST | `/api/students/import` | Bulk CSV/Excel import | Admin |
| GET | `/api/export/logs` | Download CSV/Excel | Admin |
| GET | `/api/export/report` | Generate HTML report | Admin |
| GET | `/api/qrcode` | Generate QR code | Public |

---

## Project Structure

```
├── config/          # DB, env, Socket.IO config
├── controllers/     # Route handlers (auth, checkin, student, export, log, active)
├── models/          # Database operations (user, student, session)
├── middleware/       # JWT auth, error handler
├── routes/          # Express route definitions
├── services/        # CSV/Excel parsing & generation
├── db/              # Migrations & seed script
├── public/          # Frontend (HTML, CSS, JS, PWA assets)
├── server.js        # App entry point
└── package.json
```

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start production server |
| `npm run dev` | Start with auto-reload (nodemon) |
| `npm run setup` | Create tables + seed data |

---

## Developers

- **Muhammed Taha CAN**
- **Ilhan Sidal KARADENIZ**
- **Furkan YILMAZ**

## License

[MIT](LICENSE)
