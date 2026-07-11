# 🌙 Sleepless

> **Your services should never fall asleep.**

**Sleepless** is a lightweight, self-hosted cron monitoring service that keeps your free-tier web services awake by periodically pinging them on a schedule.

Perfect for platforms like **Render**, **Heroku**, or any backend that sleeps after inactivity — Sleepless ensures your APIs stay warm and responsive.

Built with **Spring Boot 4**, **PostgreSQL**, **React (Vite)**, and fully **Dockerized** for easy deployment.

---

## ✨ Why Sleepless?

Free-tier hosting platforms often shut down inactive services, causing slow cold starts, increased response times, and sleeping APIs.

Sleepless solves this automatically by sending scheduled requests to your services and validating their responses.

- ✅ Self-hosted
- ✅ Lightweight
- ✅ No external uptime services required
- ✅ Beautiful UI

---
    
## 🚀 Features

- Schedule HTTP pings using Spring cron expressions
- Supports GET and POST requests
- Custom request body support
- JSON response structure validation
- Success & failure tracking
- Dockerized deployment
- One-click Render deployment via `render.yaml`

---

## ☁️ Deploy to Render

Use the public repository: [github.com/Manjeetjay/Sleepless](https://github.com/Manjeetjay/Sleepless)

**Steps:**

1. Create a **New Blueprint** on Render, or deploy frontend/backend individually
2. Connect the repository
3. Select **Deploy using render.yaml**
4. Set up the Environment Variables (database URL, user, pass) on Render.
5. Click **Create Web Service**

Render will build and deploy both the backend and frontend automatically.

## 📜 License

This project is licensed under the **MIT License**.
