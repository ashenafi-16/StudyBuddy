<div align="center">
  
# 📚 StudyBuddy
### *Study Smarter, Together.*

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-study--buddy-00D4AA?style=for-the-badge)](https://study-buddy-pied-five.vercel.app)



</div>

---

## 🎬 Platform Demo
> **Landing → Dashboard → Groups → Chat → Planner → Pomodoro → Resources → Profile**

<div align="center">
  <img src="frontend/public/demo/studybuddy_demo.webp" alt="StudyBuddy Demo" width="100%" style="border-radius: 12px;" />
</div>

---

## 🚀 Production Environment
Check out the live platform and the API:
- **Frontend Application**: [study-buddy-pied-five.vercel.app](https://study-buddy-pied-five.vercel.app/)
- **Backend API Server**: [studybuddy-backend-aen2.onrender.com](https://studybuddy-backend-aen2.onrender.com)

---

## ⚡ Quick Start (Local)
```bash
# 1. Clone
git clone https://github.com/ashenafi-16/StudyBuddy.git && cd StudyBuddy

# 2. Backend (Terminal 1)
cd backend && python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate && python manage.py seed_plans
python manage.py runserver

# 3. Frontend (Terminal 2)
cd ../frontend && npm install && npm run dev
```

---

## ✨ Core Features
- 🏠 **Smart Dashboard**: Study stats, quick actions, and personal progress at a glance.
- 💬 **Real-Time Chat**: WebSocket-powered instant messaging with user search and presence.
- 👥 **Study Groups**: Create and join groups for focused collaboration.
- 📅 **Study Planner**: FullCalendar integration for scheduling and tracking sessions.
- ⏱️ **Sync Pomodoro**: Group-synced focus timers with session alerts.
- 📂 **Resource Hub**: Shared library for uploading and organizing study materials.
- 👤 **Pro Profiles**: Activity heatmaps, streaks, and achievement badges.

---

## 🛠️ Tech Stack
| Tier | Technologies |
|:---|:---|
| **Frontend** | React 19, TypeScript, Vite 7, Tailwind CSS v4, Zustand |
| **Backend** | Django 5.2, DRF, Channels (WebSockets), Celery (Workers) |
| **Database** | PostgreSQL, Redis (Upstash) |
| **Services** | Cloudinary (Media), Chapa (Payments), Resend (Email) |

---

## 🐳 Docker Deployment
```bash
docker-compose up --build
# Backend: http://localhost:8000 | Frontend: http://localhost:3000
```

---

## 📁 Structure
```text
StudyBuddy/
├── backend/      # Django REST API, WebSockets, Celery
├── frontend/     # React Application (TypeScript)
├── docker/       # Configuration for Docker & Compose
└── k8s/          # Kubernetes Manifests
```

---

<div align="center">
Built with ❤️ by [Ashenafi Mulugeta](https://github.com/ashenafi-16)
</div>
