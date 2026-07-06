# Bondhon Frontend Deployment Guide

> Production deployment notes for Ubuntu 24.04 LTS (DigitalOcean)

---

# Project Location

```text
/srv/bondhon_frontend
```

Project owner

```text
rasel
```

---

# Stack

| Component | Version |
|-----------|----------|
| Next.js | 16.x |
| Node.js | 24.18.0 |
| npm | 11.16.0 |
| PM2 | Latest |

---

# Build Project

```bash
cd /srv/bondhon_frontend

npm install

npm run build
```

---

# Run with PM2

First time only

```bash
pm2 start npm --name bondhon_frontend -- start
```

Check status

```bash
pm2 status
```

View logs

```bash
pm2 logs bondhon_frontend
```

Restart

```bash
pm2 restart bondhon_frontend
```

Delete process

```bash
pm2 delete bondhon_frontend
```

Save PM2 processes

```bash
pm2 save
```

Enable auto start after reboot

```bash
pm2 startup
```

After running the generated command

```bash
pm2 save
```

---

# Nginx

Configuration

```text
/etc/nginx/sites-available/bondhon_frontend
```

Test configuration

```bash
sudo nginx -t
```

Reload

```bash
sudo systemctl reload nginx
```

Restart

```bash
sudo systemctl restart nginx
```

---

# Deployment Checklist

```bash
cd /srv/bondhon_frontend

git pull

npm install

npm run build

pm2 restart bondhon_frontend
```

> If `package.json` has not changed, `npm install` can be skipped.

---

# Environment Variables

Example

```env
NEXT_PUBLIC_API_URL=http://206.189.87.32:9001

NEXT_PUBLIC_REVERB_APP_KEY=YOUR_KEY
NEXT_PUBLIC_REVERB_HOST=206.189.87.32
NEXT_PUBLIC_REVERB_PORT=80
NEXT_PUBLIC_REVERB_SCHEME=http
```

**Important**

Whenever any `NEXT_PUBLIC_*` environment variable changes, you **must** rebuild the project.

```bash
npm run build
pm2 restart bondhon_frontend
```

---

# Useful Commands

Current directory

```bash
pwd
```

Node version

```bash
node -v
```

npm version

```bash
npm -v
```

Check running port

```bash
ss -tlnp | grep 3000
```

PM2 logs

```bash
pm2 logs bondhon_frontend
```

Monitor

```bash
pm2 monit
```

---

# Common Issues

## Build failed

```bash
rm -rf .next

npm install

npm run build
```

---

## Permission denied

```bash
sudo chown -R rasel:rasel /srv/bondhon_frontend
```

---

## PM2 serving old version

```bash
npm run build

pm2 restart bondhon_frontend
```

---

## Check Nginx errors

```bash
sudo tail -f /var/log/nginx/error.log
```

---

## Check Frontend logs

```bash
pm2 logs bondhon_frontend
```

---

# Deployment Flow

```text
git pull
      │
      ▼
npm install (if needed)
      │
      ▼
npm run build
      │
      ▼
pm2 restart bondhon_frontend
      │
      ▼
Verify website
```

---

# Architecture

```
Internet
      │
      ▼
Nginx (:80)
      │
      ▼
Next.js (PM2)
      │
      ▼
Laravel API
http://206.189.87.32:9001
```

---

# Important Notes

- Frontend project location: `/srv/bondhon_frontend`
- Frontend is managed by **PM2**.
- Backend API runs on **http://206.189.87.32:9001**.
- Always run `npm run build` before restarting PM2 after code changes.
- If `.env` or any `NEXT_PUBLIC_*` variables change, a rebuild is required.
- PM2 should be saved (`pm2 save`) so the app starts automatically after a server reboot.