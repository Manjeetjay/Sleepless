# 🌙 Sleepless

> **Your services should never fall asleep.**

**Sleepless** is a lightweight, self-hosted cron monitoring service that keeps your free-tier web services awake by periodically pinging them on a schedule.

Perfect for platforms like **Render**, **Heroku**, or any backend that sleeps after inactivity — Sleepless ensures your APIs stay warm and responsive.

Built with **Spring Boot 4**, **PostgreSQL**, and fully **Dockerized** for easy deployment.

---

## ✨ Why Sleepless?

Free-tier hosting platforms often shut down inactive services, causing slow cold starts, increased response times, and sleeping APIs.

Sleepless solves this automatically by sending scheduled requests to your services and validating their responses.

- ✅ Self-hosted
- ✅ Lightweight
- ✅ No external uptime services required

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

1. Create a **New Web Service** on Render
2. Connect the repository
3. Select **Deploy using render.yaml**
4. Add the following environment variables:

```env
SPRING_DATASOURCE_URL=jdbc:postgresql://your-db-host/dbname
SPRING_DATASOURCE_USERNAME=your-db-username
SPRING_DATASOURCE_PASSWORD=your-db-password
SPRING_DATASOURCE_DRIVER_CLASS_NAME=org.postgresql.Driver
```

5. Click **Create Web Service**

Render will build and deploy automatically.

---

## 🧩 How Sleepless Works

```
Monitor Created
      ↓
Cron Scheduler Executes
      ↓
HTTP Request Sent
      ↓
Response Validated
      ↓
Success / Failure Recorded
```

---

## 📡 API Reference

### Create a Monitor

**POST** `/api/monitors`

```json
{
  "url": "https://service-to-keep-alive.com/api/health",
  "method": "GET",
  "requestBody": {},
  "expectedStructure": {
    "status": "good health"
  },
  "cronExpression": "0 */10 * * * *",
  "successCount": 0,
  "failureCount": 0
}
```

---

### Update a Monitor

**PUT** `/api/monitors/{id}`

```json
{
  "url": "https://service-to-keep-alive.com/api/health",
  "method": "GET",
  "requestBody": {},
  "expectedStructure": {
    "status": "good health"
  },
  "cronExpression": "0 */10 * * * *"
}
```

---

### Delete a Monitor

**DELETE** `/api/monitors/{id}`

Deleting a monitor immediately stops its cron job.

---

### List All Monitors

**GET** `/api/monitors`

This endpoint also schedules monitors automatically if not already active.

---

### Get Monitor by ID

**GET** `/api/monitors/{id}`

---

## ⏰ Cron Expression Format

Sleepless uses **Spring Boot cron format** (6 fields):

```
Seconds   Minutes   Hours   Day-of-Month   Month   Day-of-Week
```

| Expression       | Meaning          |
|------------------|------------------|
| `0 */14 * * * *` | Every 14 minutes |
| `0 */5 * * * *`  | Every 5 minutes  |
| `0 0 * * * *`    | Every hour       |

---

## 🔬 Advanced Example — POST Request with Validation

```json
{
    "url": "https://my-api.com/api/auth/login",
    "method": "POST",
    "requestBody": {
      "email": "ping@example.com",
      "password": "dummy"
    },
    "expectedStructure": {
      "token": "",
      "user": {}
    },
    "cronExpression": "0 0 * * * *"
  }
```

> **Note:** Sleepless validates JSON **structure**, not values.

---

## 🧑‍💻 Local Development

**1. Clone the repository**

```bash
git clone https://github.com/Manjeetjay/Sleepless
cd Sleepless
```

**2. Create a `.env` file**

```env
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/sleepless
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=postgres
```

**3. Run the app**

```bash
./mvnw spring-boot:run
```

---

## 🏗️ Tech Stack

| Layer       | Technology        |
|-------------|-------------------|
| Backend     | Spring Boot 4     |
| Database    | PostgreSQL        |
| Scheduler   | Spring Scheduler  |
| JSON        | Jackson           |
| Containers  | Docker            |
| Hosting     | Render            |

---

## 💡 Use Cases

- Prevent cold starts on free-tier hosting
- API uptime monitoring
- Automated health checks
- Synthetic monitoring

---

## 📜 License

This project is licensed under the **MIT License**.