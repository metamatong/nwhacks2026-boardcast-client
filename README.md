<p align="center">
  <a href="#">
    <img src="images/BoardcastLogoTextWhite.png" width="220" alt="Boardcast Logo">
  </a>
</p>

<h2 align="center">Real-Time Whiteboard Streaming & AI Classroom Companion</h2>

<div align="center">

[![Django](https://img.shields.io/badge/Django-5.0-092E20?logo=django&logoColor=white)](https://www.djangoproject.com/)
[![Next.js](https://img.shields.io/badge/Next.js-14+-000000?logo=next.js&logoColor=white)](https://nextjs.org/)
[![WebRTC](https://img.shields.io/badge/WebRTC-RealTime-blue)](https://webrtc.org/)
[![Status](https://img.shields.io/badge/Status-Active-brightgreen.svg)](#)
[![GitHub Stars](https://img.shields.io/github/stars/metamatong/nwhacks2026-boardcast-client?style=social)](#)

</div>

🎓 _Built to make fast-paced lectures easier to follow — live and after class._

⭐ _Like Boardcast? Star us on GitHub to support development and help others discover it!_

---

## 🧩 Problem Statement

In fast-paced lectures, the whiteboard changes quickly and students are forced to choose between **listening and copying**.  
That tradeoff causes missed explanations, assignment details, and subtle exam hints.

Remote students face an even bigger problem — they often can’t clearly see the board at all.

**Theme — Accessibility & Learning**  
Boardcast removes this friction by making the classroom whiteboard:

- Followable **in real time**
- Reviewable **after class**
- Intelligent enough to surface **important moments automatically**

No logins. No installs. No smart boards. Just a room code.

---

## 🧠 Overview

**Boardcast** is a no-login classroom companion that turns any physical whiteboard into a **live, collaborative digital page**.

Students enter a room code and instantly receive:

- 📺 Live whiteboard video with low latency
- 📝 Auto-captured note flows
- 🧠 Real-time AI highlights for exam hints and key points

It works in-class, remotely, and for revision later.S

---

## ⚙️ Features

### 🎥 Live Whiteboard Streaming

- WebRTC-based real-time video delivery
- SFU architecture for scalability
- Optimized for low latency and minimal buffering

### 🗒️ Auto-Captured Note Flows

- Continuous capture of whiteboard content
- Review past board states without phone photos
- Export notes after class

### 🧠 AI-Powered Audio Intelligence

- Real-time speech-to-text transcription
- Automatic detection of:
  - Exam hints
  - Quiz-worthy statements
  - Emphasized reminders
- Instant push notifications to students

### 🔑 Join by Room Code

- No accounts or installs required
- Works instantly on any device

---

## 🧩 How It Works

### 🧱 Backend & Realtime Core

- Django 5 + DRF — rooms, sessions, APIs
- Django Channels + Daphne — WebSocket signaling
- Redis — channel layer & Celery broker
- PostgreSQL (NeonDB) with SQLite fallback

### 📡 WebRTC Media Plane

- Janus SFU (VideoRoom plugin) routes all media
- Django creates Janus rooms via HTTP API
- Django relays SDP + ICE candidates
- STUN + TURN for NAT traversal

### 🧠 Async Media & AI Pipeline

1. Audio chunks POSTed to `/api/media/audio-chunks/`
2. Queued in Celery
3. Processed by:
   - ElevenLabs Scribe v2 (STT)
   - Gemini 2.5 Flash (highlight detection)
4. Broadcast to clients via WebSockets

---

## 🛠️ Tech Stack

**Backend**  
Django, DRF, Channels, Daphne, Celery, Redis

**Realtime**  
WebRTC, Janus SFU, STUN/TURN

**AI & CV**  
ElevenLabs, Gemini, OpenCV, YOLOv8, PyTorch

**Frontend**  
React 19, Next.js, Tailwind, WebSockets

**Infrastructure**  
Fly.io, Docker, AWS S3, PostgreSQL

---

## 🚀 Getting Started

Boardcast is a multi-service real-time system.  
For local development, you will run:

- Django API + WebSocket server
- Redis
- Celery worker
- Janus SFU
- Next.js frontend

---

## 🧩 Prerequisites

### Install:

- **Node.js 18+**
- **Python 3.11+**
- **Docker & Docker Compose**
- **Redis**
- **PostgreSQL** (or SQLite for dev)

### API Keys:

- **ElevenLabs API key**
- **Google Gemini API key**

---

## ⚙️ Backend Setup (Django)

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Create backend/.env:

```bash
DJANGO_SECRET_KEY=dev-secret
DEBUG=True

DATABASE_URL=postgresql://user:password@localhost:5432/boardcast
REDIS_URL=redis://localhost:6379/0

ELEVENLABS_API_KEY=your-elevenlabs-key
GEMINI_API_KEY=your-gemini-key

JANUS_ADMIN_URL=http://localhost:7088/admin
JANUS_API_URL=http://localhost:8088/janus
```

### Run migrations:

```bash
python manage.py migrate
```

## Start Django:

```bash
python manage.py runserver
```

## ⚡ Start Redis

```bash
redis-server
```

## 🧠 Start Celery Worker

### New terminal:

```bash
cd backend
source venv/bin/activate
celery -A boardcast worker -l info
```

### 📡 Start Janus SFU

```bash
docker compose up janus
```

### Janus runs at:

```bash
http://localhost:8088/janus
```

## 🌐 Frontend Setup (Next.js)

```bash
cd frontend
npm install
```

### Start frontend:

```bash
npm run dev
```

### 🖥️ Open the App

```bash
http://localhost:3000
```

## 🔮 What’s Next

- Live whiteboard digitization in core flow

- High-precision, user-tunable highlight detection

- Session replay with timestamped AI highlights

- Reliability & observability hardening

- Aggregated student interaction heatmaps
