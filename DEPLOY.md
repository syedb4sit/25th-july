# Deployment Guide: 25th July

This guide walks you through deploying the application to your DigitalOcean droplet at `25th-july.developedbybasit.me`.

## Prerequisites
1. A DigitalOcean droplet running Ubuntu (22.04 LTS recommended).
2. A registered domain (`25th-july.developedbybasit.me`) pointed to your droplet's IP address (A Record).
3. Docker and Docker Compose installed on the droplet.

## Step 1: Initial Server Setup
SSH into your droplet:
```bash
ssh root@your_droplet_ip
```

Install Docker & Docker Compose:
```bash
sudo apt update
sudo apt install -y docker.io docker-compose
```

## Step 2: Clone the Repository
Clone your code onto the server:
```bash
git clone <your-repo-url> haven
cd haven
```

## Step 3: Configure Environment Variables
Create a `.env` file in the root of the project:
```bash
nano .env
```
Paste your secrets into the file. Make sure to set secure random strings:
```env
# Database & Redis (Handled internally by Docker, no external URLs needed)

# Security (Generate a long random string for this!)
JWT_ACCESS_SECRET=your_super_secret_jwt_key

# Email
RESEND_API_KEY=re_your_resend_api_key

# Domain
APP_URL=https://25th-july.developedbybasit.me
```

## Step 4: First Boot (Without SSL)
Before Certbot can generate SSL certificates, Nginx needs to be running.
We have commented out the `ssl_certificate` lines in `nginx/nginx.conf`. Leave them commented for now.

Start the stack:
```bash
docker-compose -f docker-compose.prod.yml up -d
```

Check logs to ensure everything is running:
```bash
docker-compose -f docker-compose.prod.yml logs -f
```

## Step 5: Setup SSL with Certbot
Run Certbot via a temporary Docker container to generate the certificates:
```bash
docker run -it --rm --name certbot \
  -v "$(pwd)/certbot/conf:/etc/letsencrypt" \
  -v "$(pwd)/certbot/www:/var/www/certbot" \
  certbot/certbot certonly --webroot -w /var/www/certbot \
  -d 25th-july.developedbybasit.me
```
Follow the prompts to register your email and agree to terms.

## Step 6: Enable SSL
Now that certificates exist, edit the Nginx configuration:
```bash
nano nginx/nginx.conf
```
Uncomment these two lines under the `listen 443 ssl` section:
```nginx
ssl_certificate /etc/letsencrypt/live/25th-july.developedbybasit.me/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/25th-july.developedbybasit.me/privkey.pem;
```

Restart Nginx to apply the SSL configuration:
```bash
docker-compose -f docker-compose.prod.yml restart nginx
```

## Step 7: Database Migration
Finally, push the Prisma schema to your production database:
```bash
docker-compose -f docker-compose.prod.yml exec api npx prisma db push
```

## Success!
The app is now live at `https://25th-july.developedbybasit.me`.
- **Database data** is persisted in a Docker volume.
- **Media files** are persisted in a Docker volume (`/app/media`).
- **Redis cache** is persisted.

## Updates
To deploy future updates:
```bash
git pull
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d
```
