# Server Installation Guide: Zedny LMS

This guide explains how to install and run the Zedny LMS on a fresh Linux server using Docker and Docker Compose.

## 1. Prerequisites

Ensure your server is running a modern Linux distribution (e.g., Ubuntu 22.04 LTS) and has the following installed:

### Install Docker & Docker Compose v2
The modern way to use Docker is with the `docker-ce` package and the `docker-compose-plugin`.

```bash
# Add Docker's official GPG key:
sudo apt-get update
sudo apt-get install ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

# Add the repository to Apt sources:
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update

# Install Docker and the Compose v2 Plugin:
sudo apt-get install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

> [!NOTE]
> After installing the plugin, you should use `docker compose` (without the hyphen) instead of `docker-compose`.

---

## 2. Deployment Steps

### Step 1: Create Deployment Directory
```bash
mkdir -p ~/lms-deploy
cd ~/lms-deploy
```

### Step 2: Create Environment File
Create a `.env` file in the directory. We have adapted this template from your local configuration to work within the Docker environment:

```bash
cat <<EOF > .env
# Environment
NODE_ENV=production

# Database (Note: Host must be 'postgres' inside Docker)
POSTGRES_DB=exam_platform
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password # CHANGE THIS for production
DATABASE_URL=postgresql://postgres:password@postgres:5432/exam_platform

# Redis (Note: Host must be 'redis' inside Docker)
REDIS_URL="redis://redis:6379"

# Authentication
JWT_SECRET=your_jwt_secret_key # CHANGE THIS
JWT_EXPIRES_IN=7d

# Email
SENDGRID_API_KEY=your-sendgrid-api-key
FROM_EMAIL=noreply@yourdomain.com

# AI
OPENAI_API_KEY=your-openai-api-key

# Web Conferencing
ZOOM_CLIENT_ID=your-zoom-client-id
ZOOM_CLIENT_SECRET=your-zoom-client-secret
BBB_URL=https://your-bbb-server.com
BBB_SECRET=your-bbb-secret

# Application
BASE_URL=http://your_server_ip:3070
NEXT_PUBLIC_BASE_URL=http://your_server_ip:3070

# File Upload
MAX_FILE_SIZE_MB=600
UPLOAD_DIR=/app/uploads # Path inside container
EOF
```

### Step 3: Create Docker Compose File
Copy the `docker-compose.prod.yml` content from the repository into a new file named `docker-compose.yml`:

```bash
# You can copy the file manually or use curl if the repo is public
nano docker-compose.yml
```

> [!NOTE]
> Ensure the `DATABASE_URL` in `docker-compose.yml` matches the `POSTGRES_PASSWORD` set in your `.env` file.

### Step 4: Pull and Start Services
```bash
# Pull the latest image from Docker Hub
docker compose pull

# Start services in detached mode
docker compose up -d
```

---

## 3. Database Initialization

After the containers are running, you need to sync the database schema:

```bash
docker exec -it lms_app npm run db:push
```

---

## 4. Verification

Visit `http://your-server-ip:3070` in your browser.

### Useful Commands

- **View Logs**: `docker compose logs -f app`
- **Restart App**: `docker compose restart app`
- **Stop All**: `docker compose down`

---

## 5. Security Recommendations

- **Firewall**: Ensure port `3070` is open on your server's firewall.
- **SSL**: For production use, it is highly recommended to set up a reverse proxy (like Nginx or Caddy) with Let's Encrypt for HTTPS.
- **Passwords**: Never use default passwords for `POSTGRES_PASSWORD` or `JWT_SECRET`.

---

## 6. How to Update

To update your server with the latest changes (like rebranding or bug fixes) from GitHub:

1.  **Wait** for the GitHub Action to finish building (check the "Actions" tab in GitHub).
2.  **SSH** into your server.
3.  **Run these commands:**

```bash
cd ~/lms-deploy
# Pull the latest image
docker compose pull
# Restart the app with new changes
docker compose up -d
```

> [!TIP]
> If you've modified the database schema (Prisma), remember to run:
> `docker exec -it lms_app npm run db:push`
