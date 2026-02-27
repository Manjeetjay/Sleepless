# Sleepless

Sleepless is a lightweight, self-hosted cron monitoring service designed to keep your free-tier web services (like Render, Heroku) awake by pinging them on a schedule.

Built with Spring Boot 4 and PostgreSQL, Sleepless is fully dockerized and includes configuration to be deployed easily with a single click on Render.

## Features
- Ping any HTTP endpoint (GET, POST, etc.) on a customizable Spring cron schedule.
- Keep your free-tier Render or Supabase services alive to completely avoid cold starts automatically.
- Track success/failure counts for your pings.
- Validate JSON response structures.
- Easy deployment using Render's IaC (`render.yaml`).

## Deploy to Render

Deploying Sleepless to Render is easy since the project includes a `render.yaml` configuration profile.

1. **Fork or Clone** this repository to your own GitHub account.
2. Go to your [Render Dashboard](https://dashboard.render.com).
3. Click on **New** -> **Blueprint**.
4. Connect the repository you just forked or pushed.
5. Render will detect the `render.yaml` file and prompt you for the required Environment Variables.
6. Provide your PostgreSQL database credentials:
   - `SPRING_DATASOURCE_URL` (e.g., `jdbc:postgresql://your-db-host/dbname`)
   - `SPRING_DATASOURCE_USERNAME`
   - `SPRING_DATASOURCE_PASSWORD`
   *(You can spin up a free PostgreSQL database on Neon, Supabase, or Render itself).*
7. Click **Apply**.
8. Wait for the Docker build to finish. Your Sleepless instance is now live!

> **Note:** The `render.yaml` is currently configured to deploy as a Private Service (`pserv`). This requires a paid Render plan. If you are on the free tier, change the `type` to `web` in `render.yaml` before deploying.

## Usage

Sleepless runs as an API. Once deployed, you can add "monitors" using standard HTTP requests.

### Create a Monitor

To keep a service alive, create a monitor that pings its health-check or public API endpoint. Make a `POST` request to `/api/monitors`:

```bash
curl -X POST https://your-sleepless-url/api/monitors \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://service-to-keep-alive.onrender.com/api/health",
    "method": "GET",
    "cronExpression": "0 */14 * * * *"
  }'
```

**Important Note on Cron Expressions:** 
Sleepless uses the **Spring Boot cron format** which requires **6 fields** (Seconds, Minutes, Hours, Day-of-Month, Month, Day-of-Week).
- `0 */14 * * * *` = Every 14 minutes (perfect for Render's 15-minute inactivity timeout)
- `0 0 * * * *` = Every hour
- `0 */5 * * * *` = Every 5 minutes

### Advanced Ping (POST with Body and Expected Response)

You can also send a POST request with a JSON body and have the monitor validate the response structure:

```bash
curl -X POST https://your-sleepless-url/api/monitors \
  -H "Content-Type: application/json" \
  -d '{
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
  }'
```

### Other Endpoints

- **List Monitors:** `GET /api/monitors`
- **Get a Monitor:** `GET /api/monitors/{id}`
- **Update a Monitor:** `PUT /api/monitors/{id}`
- **Delete a Monitor:** `DELETE /api/monitors/{id}`

## Local Development

If you want to run this locally:

1. Clone the repo locally.
2. Create a `.env` file in the root directory:
   ```env
   SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/sleepless
   SPRING_DATASOURCE_USERNAME=postgres
   SPRING_DATASOURCE_PASSWORD=postgres
   ```
3. Run with the Maven wrapper:
   ```bash
   ./mvnw spring-boot:run
   ```
