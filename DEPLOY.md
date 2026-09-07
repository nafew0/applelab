# Deploying AppleLab — Ubuntu 24.04

**URL:** https://applelab.bd
**Stack:** Django (Gunicorn) + Next.js + PostgreSQL + Redis
**Isolation:** System user `applelab`, backend port `8002`, frontend port `3002`, Redis DB 4–5, PG user `applelab_user`

> **Existing server:** PostgreSQL, Redis, Nginx and Certbot are already installed by the Opsync deployment. There is no server-preparation section here — start at Section 1.
>
> **Node.js 24 is required.** AppleLab's frontend pins `engines.node: 24.15.x`, and its `package-lock.json` is written by npm 11 — npm 10 rejects it with a misleading `Missing: @swc/helpers` error. The server's system Node was upgraded from 20 to 24 for this deployment, so all three projects now share Node 24. If you upgrade the system Node again, see *Upgrading the system Node* at the end of this file — every project's `node_modules` must be rebuilt.

---

## Port & Redis allocation on this server

| Project         | Backend | Frontend | Redis DBs                  | PG User                 |
|-----------------|---------|----------|----------------------------|-------------------------|
| Opsync          | 8000    | 3000     | 0 (cache), 1 (celery)      | opsync_user             |
| EcommbdHosting  | 8001    | 3001     | 2 (cache), 3 (celery)      | ecommbdhosting_user     |
| **AppleLab**    | **8002**| **3002** | **4 (cache), 5 (reserved)**| **applelab_user**       |
| Project 4       | 8003    | 3003     | 6, 7                       | project4_user           |

> AppleLab does not run Celery today (no `celery.py` app module is wired up), so there is no worker or beat service below. Redis DB 5 is reserved so it can be added later without reshuffling.

---

## 1. Create a Dedicated System User

```bash
sudo useradd --system --shell /bin/bash --create-home --home-dir /opt/applelab applelab
```

---

## 2. PostgreSQL — Create Isolated Database

```bash
sudo -u postgres psql
```

```sql
CREATE USER applelab_user WITH PASSWORD 'your-strong-db-password';
CREATE DATABASE applelab_db OWNER applelab_user;
\q
```

---

## 3. Clone the Repository

Your personal SSH key is already set up and trusted by GitHub (done during the EcommbdHosting deploy). If it is missing, redo Section 3 of `/opt/ecommbdhosting/app/DEPLOY.md` first.

```bash
sudo mkdir -p /opt/applelab/app
sudo chown applelab:applelab /opt/applelab /opt/applelab/app
sudo git clone git@github.com:nafew0/applelab.git /opt/applelab/app
sudo chown -R applelab:applelab /opt/applelab/app
```

Allow the system user to pull from GitHub:

```bash
sudo mkdir -p /opt/applelab/.ssh
sudo cp ~/.ssh/id_ed25519 /opt/applelab/.ssh/
sudo cp ~/.ssh/known_hosts /opt/applelab/.ssh/
sudo chown -R applelab:applelab /opt/applelab/.ssh
sudo chmod 700 /opt/applelab/.ssh && sudo chmod 600 /opt/applelab/.ssh/id_ed25519
```

Layout after cloning:

```
/opt/applelab/app/
├── backend/     # Django project module: applelab
└── frontend/    # Next.js (App Router, next-intl locale routing)
```

---

## 4. Backend Setup

### Python virtual environment

```bash
cd /opt/applelab/app/backend
sudo -u applelab python3 -m venv venv
sudo -u applelab venv/bin/pip install --upgrade pip
sudo -u applelab venv/bin/pip install -r requirements.txt
```

### Environment file

```bash
sudo -u applelab nano /opt/applelab/app/backend/.env.production
```

```ini
# Django
DEBUG=False
ENVIRONMENT=production
DJANGO_SECRET_KEY=__CHANGE_ME__
JWT_SIGNING_KEY=__CHANGE_ME__
ALLOWED_HOSTS=applelab.bd,www.applelab.bd
APP_ORIGIN=https://applelab.bd
PUBLIC_APP_URL=https://applelab.bd
API_ORIGIN=https://applelab.bd
TRUST_X_FORWARDED_PROTO=True
TRUSTED_PROXY_IPS=127.0.0.1

# Database
DB_NAME=applelab_db
DB_USER=applelab_user
DB_PASSWORD=__CHANGE_ME__
DB_HOST=localhost
DB_PORT=5432

# Redis — DB 4 for cache/channels (0–3 belong to Opsync and EcommbdHosting)
USE_REDIS=True
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_CACHE_LOCATION=redis://127.0.0.1:6379/4

# Celery (unused today — reserved DB 5)
CELERY_BROKER_URL=redis://127.0.0.1:6379/5
CELERY_RESULT_BACKEND=redis://127.0.0.1:6379/5

# Email
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=__CHANGE_ME__
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=__CHANGE_ME__
EMAIL_HOST_PASSWORD=__CHANGE_ME__
DEFAULT_FROM_EMAIL=no-reply@applelab.bd

# Social login (leave blank if unused)
GOOGLE_OAUTH_CLIENT_ID=
GOOGLE_OAUTH_CLIENT_SECRET=
FACEBOOK_OAUTH_CLIENT_ID=
FACEBOOK_OAUTH_CLIENT_SECRET=
GITHUB_OAUTH_CLIENT_ID=
GITHUB_OAUTH_CLIENT_SECRET=
```

> `USE_REDIS=True` matters in production: it makes rate limits shared across all Gunicorn workers.

Generate secrets:

```bash
python3 -c "import secrets; print(secrets.token_urlsafe(64))"
# Run twice — once for DJANGO_SECRET_KEY, once for JWT_SIGNING_KEY
```

### Migrate, collect static, create superuser

```bash
cd /opt/applelab/app/backend
sudo -u applelab DOTENV_FILE=.env.production venv/bin/python manage.py migrate
sudo -u applelab DOTENV_FILE=.env.production venv/bin/python manage.py collectstatic --noinput
sudo -u applelab DOTENV_FILE=.env.production venv/bin/python manage.py createsuperuser
```

Static files land in `/opt/applelab/app/backend/staticfiles/`, uploads in `/opt/applelab/app/backend/media/`.

---

## 5. Frontend Setup

### Confirm the toolchain

```bash
node -v   # must be v24.x
npm -v    # must be 11.x
```

If this shows Node 20, stop — `npm ci` will fail. Upgrade first (see *Upgrading the system Node* below).

### Install dependencies

```bash
cd /opt/applelab/app/frontend
sudo -u applelab npm ci
```

> An `EBADENGINE` warning about `npm@11.12.1` is harmless — `engines.npm` is an exact pin, and only `engines.node` actually matters.

### Environment file

```bash
sudo -u applelab nano /opt/applelab/app/frontend/.env.production
```

```ini
BACKEND_URL=http://127.0.0.1:8002
NEXT_PUBLIC_API_URL=/api
NEXT_PUBLIC_DJANGO_ADMIN_URL=https://applelab.bd/admin
NEXT_PUBLIC_SITE_URL=https://applelab.bd
# Styleguide route is dev/QA only — leave at 0 in production
NEXT_PUBLIC_ENABLE_STYLEGUIDE=0
```

> `BACKEND_URL` is server-side only, so it points straight at loopback `8002` and skips the Nginx round trip. `NEXT_PUBLIC_API_URL=/api` keeps browser calls same-origin.

Build:

```bash
cd /opt/applelab/app/frontend
sudo -u applelab npm run build
```

---

## 6. Systemd Services

```bash
sudo mkdir -p /opt/applelab/logs
sudo chown applelab:applelab /opt/applelab/logs
```

### Backend (Gunicorn)

```bash
sudo nano /etc/systemd/system/applelab-backend.service
```

```ini
[Unit]
Description=AppleLab Django Backend
After=network.target postgresql.service redis.service

[Service]
User=applelab
WorkingDirectory=/opt/applelab/app/backend
Environment="DOTENV_FILE=.env.production"
ExecStart=/opt/applelab/app/backend/venv/bin/gunicorn \
    --workers 3 \
    --bind 127.0.0.1:8002 \
    --access-logfile /opt/applelab/logs/backend-access.log \
    --error-logfile /opt/applelab/logs/backend-error.log \
    applelab.wsgi:application
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

### Frontend (Next.js)

```bash
sudo nano /etc/systemd/system/applelab-frontend.service
```

```ini
[Unit]
Description=AppleLab Next.js Frontend
After=network.target applelab-backend.service

[Service]
User=applelab
WorkingDirectory=/opt/applelab/app/frontend
Environment="NODE_ENV=production"
ExecStart=/usr/bin/node node_modules/.bin/next start -p 3002
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

### Enable and start

```bash
sudo systemctl daemon-reload
sudo systemctl enable applelab-backend applelab-frontend
sudo systemctl start applelab-backend applelab-frontend
sudo systemctl status applelab-backend applelab-frontend
```

---

## 7. Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/applelab
```

```nginx
server {
    listen 80;
    server_name applelab.bd www.applelab.bd;

    client_max_body_size 25M;

    # Django static/media
    location /static/ {
        alias /opt/applelab/app/backend/staticfiles/;
    }

    location /media/ {
        alias /opt/applelab/app/backend/media/;
    }

    # Django API
    location /api/ {
        proxy_pass http://127.0.0.1:8002;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Django admin
    location /admin/ {
        proxy_pass http://127.0.0.1:8002;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Next.js frontend (everything else)
    location / {
        proxy_pass http://127.0.0.1:3002;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable and test:

```bash
sudo ln -s /etc/nginx/sites-available/applelab /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 8. SSL with Let's Encrypt

Point the DNS A record for `applelab.bd` (and `www`) at this server first, then:

```bash
sudo certbot --nginx -d applelab.bd -d www.applelab.bd
sudo certbot renew --dry-run
```

---

## 9. Verify Everything

```bash
# Services running?
sudo systemctl status applelab-backend applelab-frontend nginx

# Backend responding?
curl -s http://127.0.0.1:8002/api/auth/site-settings/ | python3 -m json.tool

# Frontend responding?
curl -s http://127.0.0.1:3002 | head -5

# Redis DB isolation check (4 is ours; 0–3 belong to the other two projects)
redis-cli -n 4 ping

# Nothing else is on our ports?
sudo ss -ltnp | grep -E '8002|3002'

# Site live?
curl -I https://applelab.bd
```

---

## 10. Updating from GitHub

```bash
cd /opt/applelab/app
sudo -u applelab git pull origin main

# Backend: deps + migrate + static
cd backend
sudo -u applelab venv/bin/pip install -r requirements.txt
sudo -u applelab DOTENV_FILE=.env.production venv/bin/python manage.py migrate
sudo -u applelab DOTENV_FILE=.env.production venv/bin/python manage.py collectstatic --noinput

# Frontend: deps + rebuild
cd ../frontend
sudo -u applelab npm ci
sudo -u applelab npm run build

# Restart
sudo systemctl restart applelab-backend applelab-frontend
```

---

## Troubleshooting

```bash
# Backend
sudo journalctl -u applelab-backend -f
tail -f /opt/applelab/logs/backend-error.log

# Frontend
sudo journalctl -u applelab-frontend -f

# Nginx
sudo tail -f /var/log/nginx/error.log
```

Common issues:

- **400 Bad Request from Django** — the host is missing from `ALLOWED_HOSTS` in `.env.production`.
- **CSRF/cookie failures over HTTPS** — check `TRUST_X_FORWARDED_PROTO=True` and that Nginx sends `X-Forwarded-Proto`.
- **Unstyled admin** — `collectstatic` was not run, or the `/static/` alias path is wrong.
- **Frontend 500s on data fetches** — `BACKEND_URL` is wrong, or the backend service is down; `curl` port 8002 directly.
- **Rate limits behaving inconsistently** — `USE_REDIS=True` is missing, so each worker keeps its own counters.
- **`npm ci` fails with `Missing: @swc/helpers@... from lock file`** — you are on npm 10. The lockfile is written by npm 11, which records optional peer dependencies differently. Check `npm -v` and upgrade Node. Never "fix" this by running `npm install` on the server: it rewrites the committed lockfile and the failure returns on the next deploy.
- **`NODE_MODULE_VERSION` mismatch or `invalid ELF header` on startup** — `node_modules` holds native builds (sharp, swc) compiled for the previous Node major. Delete `node_modules` and re-run `npm ci` + `npm run build`.

---

## Upgrading the system Node

All three projects share `/usr/bin/node`, so a Node major upgrade is a coordinated, all-projects operation — not a package install. `apt` replaces the binary immediately, but running services keep the old one mapped in memory, so breakage surfaces at the *next* restart or reboot rather than during the upgrade. Do the rebuilds in the same maintenance window.

```bash
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt install -y nodejs
node -v && npm -v
```

Then rebuild every frontend from scratch — deleting `node_modules` is the step that matters, because native modules are compiled per Node ABI:

```bash
cd /opt/opsync/app/frontend
sudo -u opsync rm -rf node_modules .next
sudo -u opsync npm ci && sudo -u opsync npm run build
sudo systemctl restart opsync-frontend

cd /opt/ecommbdhosting/app/frontend
sudo -u ecommbdhosting rm -rf node_modules .next
sudo -u ecommbdhosting npm ci && sudo -u ecommbdhosting npm run build
sudo systemctl restart ecommbdhosting-frontend

cd /opt/applelab/app/frontend
sudo -u applelab rm -rf node_modules .next
sudo -u applelab npm ci && sudo -u applelab npm run build
sudo systemctl restart applelab-frontend
```

Verify all three actually serve, rather than merely reporting `active`:

```bash
for p in 3000 3001 3002; do echo -n "$p -> "; curl -sS -o /dev/null -w '%{http_code}\n' http://127.0.0.1:$p; done
```

---

## Adding a 4th Project to This Server

Follow the checklist at the end of `/opt/ecommbdhosting/app/DEPLOY.md`, using ports `8003`/`3003`, Redis DBs `6`/`7`, and PG user `project4_user`. Update the allocation table at the top of this file too.
