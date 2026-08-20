# Task Manager — Full-Stack MERN Application

A production-ready, full-stack Task Management application built with the MERN stack. Features JWT authentication, Cloudinary file uploads, live weather context via OpenWeatherMap, and automated email notifications via Nodemailer.

---

## ✨ Features

| Feature | Details |
|---|---|
| 🔐 **Auth** | JWT-based register/login, bcrypt password hashing, protected routes |
| 📋 **Task CRUD** | Create, read, update, delete with full field support |
| 🔍 **Filtering** | Filter by status, priority, date range, full-text search |
| 📄 **Pagination** | Page-based with sort control (newest, due date, priority) |
| 🌤️ **Live Weather** | Per-task weather badge via OpenWeatherMap API |
| 📎 **File Upload** | Attach images/docs to tasks via Cloudinary |
| 📧 **Email Alerts** | Task creation + completion emails via Nodemailer (Gmail) |
| 🎨 **Premium UI** | Glassmorphism dark dashboard, skeleton loaders, toast notifications |

---

## 🏗️ Architecture

```
task-management-mern/
├── backend/          ← Node.js + Express REST API
│   ├── config/       ← DB & Cloudinary setup
│   ├── controllers/  ← Business logic
│   ├── middleware/   ← JWT guard, file upload, error handler
│   ├── models/       ← Mongoose schemas (User, Task)
│   ├── routes/       ← Express route definitions
│   └── utils/        ← Email & weather services
└── frontend/         ← React + Vite SPA
    └── src/
        ├── components/ ← Navbar, TaskCard, Modal, WeatherBadge
        ├── context/    ← AuthContext (JWT state)
        ├── pages/      ← Login, Register, Dashboard
        └── services/   ← Axios instance + interceptors
```

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js v18+ and npm
- A MongoDB Atlas cluster (or local MongoDB)
- API keys for Cloudinary, OpenWeatherMap, and a Gmail App Password

### 1. Clone and set up the backend

```bash
cd backend
npm install
cp .env.example .env
# Fill in your credentials in .env
npm run dev
```

The API server will start on `http://localhost:5000`.

### 2. Set up and start the frontend

```bash
cd frontend
npm install
npm run dev
```

The React app will start on `http://localhost:5173`.
> In development, Vite proxies all `/api/*` requests to `localhost:5000` — no CORS issues.

---

## 🔑 Environment Variables

### Backend (`backend/.env`)

| Variable | Description |
|---|---|
| `PORT` | Server port (default: 5000) |
| `MONGO_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Long random secret for signing tokens |
| `JWT_EXPIRES_IN` | Token lifetime (default: `7d`) |
| `CLOUDINARY_CLOUD_NAME` | From your Cloudinary dashboard |
| `CLOUDINARY_API_KEY` | From your Cloudinary dashboard |
| `CLOUDINARY_API_SECRET` | From your Cloudinary dashboard |
| `OPENWEATHER_API_KEY` | From openweathermap.org (free tier) |
| `EMAIL_FROM` | Your Gmail address |
| `EMAIL_PASS` | Gmail App Password (not your account password) |
| `CLIENT_URL` | Frontend URL for CORS (e.g. `http://localhost:5173`) |

> Copy `backend/.env.example` to `backend/.env` and fill in values.

### Frontend (`frontend/.env`)

| Variable | Description |
|---|---|
| `VITE_API_URL` | Backend API URL for **production** only |

> In **development**, leave this unset — Vite's proxy handles it automatically.  
> In **production**, set it to your deployed backend: `https://your-api.onrender.com/api`

---

## 📡 API Reference

### Auth
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Register a new user |
| `POST` | `/api/auth/login` | Public | Login, returns JWT |
| `GET` | `/api/auth/me` | Private | Get current user profile |

### Tasks
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/tasks` | Private | List tasks (filters + pagination) |
| `POST` | `/api/tasks` | Private | Create task (multipart/form-data) |
| `GET` | `/api/tasks/:id` | Private | Get single task |
| `PUT` | `/api/tasks/:id` | Private | Update task |
| `DELETE` | `/api/tasks/:id` | Private | Delete task |

#### GET /api/tasks — Query Parameters

| Param | Type | Example | Description |
|---|---|---|---|
| `page` | number | `1` | Page number |
| `limit` | number | `9` | Items per page (max 50) |
| `status` | string | `PENDING` | Filter by status |
| `priority` | string | `HIGH` | Filter by priority |
| `search` | string | `meeting` | Search title/description |
| `startDate` | ISO date | `2024-01-01` | Due date from |
| `endDate` | ISO date | `2024-12-31` | Due date to |
| `sortBy` | string | `dueDate` | Sort field |
| `order` | string | `asc` | Sort direction |

---

## 🚀 Deployment

### Backend → Render / Railway

1. Push `backend/` to a GitHub repo.
2. Create a new Web Service on [Render](https://render.com) pointing to that repo.
3. Set **Build Command**: `npm install`
4. Set **Start Command**: `node server.js`
5. Add all environment variables from `.env.example` in the Render dashboard.

### Frontend → Vercel

1. Push `frontend/` to a GitHub repo (or the root with `frontend/` subdirectory).
2. Import on [Vercel](https://vercel.com) and set the root directory to `frontend`.
3. Add the environment variable:
   - `VITE_API_URL` = `https://your-render-backend-url.onrender.com/api`
4. Deploy!

---

## ⚖️ Trade-offs & What I'd Improve

- **Weather is cached at creation time** — live weather shown on the card is a snapshot. A real-time refresh per-card would require hitting the OpenWeatherMap API on the frontend for each task with a location, which would be rate-limited. A smarter approach: cache weather per city with a 30-minute TTL in Redis.
- **Email is fire-and-forget** — failures are logged but don't block the task API response. A proper queue (BullMQ + Redis) would guarantee delivery with retries.
- **No file deletion** — when a task with an attachment is deleted, the Cloudinary asset is orphaned. A cleanup job using `cloudinary.uploader.destroy(filePublicId)` would fix this.
- **No refresh token** — the JWT expires in 7 days and the user is simply redirected to login. Implementing a refresh-token rotation pattern would improve UX.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js, Express.js |
| Database | MongoDB + Mongoose |
| Auth | JSON Web Tokens, bcryptjs |
| File Upload | Multer + Cloudinary |
| Email | Nodemailer (Gmail SMTP) |
| Weather | OpenWeatherMap REST API |
| Frontend | React 18, Vite |
| Styling | Tailwind CSS |
| State | React Context + TanStack React Query |
| HTTP | Axios |
