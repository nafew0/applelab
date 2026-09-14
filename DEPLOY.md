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
sudo usermod -aG applelab www-data
```

Ubuntu 24.04 creates the home directory as `0750`, and Nginx (`www-data`) serves `/static/` and `/media/` from inside it. Without the group membership every image and the Django admin's CSS return **403**. (Restart Nginx after adding the group if it is already running.)

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

Confirm the WSGI server landed — the systemd unit fails with `status=203/EXEC` if it is missing:

```bash
ls -l /opt/applelab/app/backend/venv/bin/gunicorn
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
# 127.0.0.1 is required: the Next.js server calls Django directly at BACKEND_URL
ALLOWED_HOSTS=applelab.bd,www.applelab.bd,127.0.0.1,localhost
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

# Repair ticket references: APL-YYYYMM-NNNNN
LEADS_REFERENCE_PREFIX=APL

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

# Catalog → Next.js page refresh after admin edits (same secret in frontend .env.production)
NEXT_REVALIDATE_URL=http://127.0.0.1:3002/revalidate
NEXT_REVALIDATE_SECRET=__CHANGE_ME__
# Next → Django catalog page-data key (same value in frontend .env.production)
CATALOG_PAGES_SECRET=__CHANGE_ME__
```

> `USE_REDIS=True` matters in production: it makes rate limits shared across all Gunicorn workers.

> `127.0.0.1` in `ALLOWED_HOSTS` matters too. Next.js renders pages by calling Django at `http://127.0.0.1:8002`; those requests carry the host `127.0.0.1`, and without it Django answers 400 to every one of them (the service pages then show "The catalog is being prepared").

Lock the file down — it holds every secret, and `www-data` can now enter the home directory:

```bash
sudo chmod 600 /opt/applelab/app/backend/.env.production
```

Generate secrets:

```bash
python3 -c "import secrets; print(secrets.token_urlsafe(64))"
# Run twice — once for DJANGO_SECRET_KEY, once for JWT_SIGNING_KEY
```

### Migrate, collect static, seed, create superuser

```bash
cd /opt/applelab/app/backend
sudo -u applelab DOTENV_FILE=.env.production venv/bin/python manage.py migrate
sudo -u applelab DOTENV_FILE=.env.production venv/bin/python manage.py collectstatic --noinput
sudo -u applelab DOTENV_FILE=.env.production venv/bin/python manage.py seed_applelab
sudo -u applelab DOTENV_FILE=.env.production venv/bin/python manage.py seed_catalog
sudo -u applelab DOTENV_FILE=.env.production venv/bin/python manage.py createsuperuser
```

`seed_catalog` loads the committed device catalog (`backend/repairs/seed/catalog.json`: families, models, repairs — no prices). It is safe to re-run on every deploy: it only adds missing rows and never overwrites what the owner edited in the admin. Prices are set by the owner in **Admin → Catalog**.

### Catalog images (one-time, then whenever the image set changes)

The catalog pictures (family, model photos, repair icons) are **not in git** — they live in the local research folder `research/ifixit-crawl/images/`, together with `catalog_images.json`, which maps every file to our own family/model/repair slugs. Copy that folder to the server and attach it:

```bash
# from your machine (as root — the applelab user has no SSH login)
rsync -av research/ifixit-crawl/images/ root@<server>:/opt/applelab/catalog-images/

# on the server (after seed_catalog)
sudo chown -R applelab:applelab /opt/applelab/catalog-images
cd /opt/applelab/app/backend
sudo -u applelab DOTENV_FILE=.env.production venv/bin/python manage.py import_catalog_images --images-dir /opt/applelab/catalog-images --dry-run
sudo -u applelab DOTENV_FILE=.env.production venv/bin/python manage.py import_catalog_images --images-dir /opt/applelab/catalog-images
```

Images are converted to WebP into `backend/media/catalog/` (served by the `/media/` nginx block). Re-running only fills empty images — anything the owner uploaded in **Admin → Catalog** is kept; add `--overwrite` to replace them. Include `backend/media/` in your backups.

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
NEXT_PUBLIC_DJANGO_ADMIN_URL=https://applelab.bd/django-admin
NEXT_PUBLIC_SITE_URL=https://applelab.bd
# Styleguide route is dev/QA only — leave at 0 in production
NEXT_PUBLIC_ENABLE_STYLEGUIDE=0
# Must equal the backend's NEXT_REVALIDATE_SECRET / CATALOG_PAGES_SECRET
NEXT_REVALIDATE_SECRET=__CHANGE_ME__
CATALOG_PAGES_SECRET=__CHANGE_ME__
```

> `BACKEND_URL` is server-side only, so it points straight at loopback `8002` and skips the Nginx round trip. `NEXT_PUBLIC_API_URL=/api` keeps browser calls same-origin.

```bash
sudo chmod 600 /opt/applelab/app/frontend/.env.production
```

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

    # Catalog page data is server-to-server only (Next renders it); never public.
    location /api/catalog/pages/ {
        return 404;
    }

    # Django API
    location /api/ {
        proxy_pass http://127.0.0.1:8002;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Django's built-in admin. /admin itself is the site's staff panel (Next.js).
    location /django-admin/ {
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

Keep the HTTP → HTTPS redirect Certbot adds to the port-80 block. Django skips its own HTTPS redirect for `/api/` (so the Next.js server can call it over loopback HTTP), which makes Nginx the only thing sending public API traffic to HTTPS.

---

## 9. Verify Everything

```bash
# Services running?
sudo systemctl status applelab-backend applelab-frontend nginx

# Backend responding (as the frontend calls it)?
curl -s http://127.0.0.1:8002/api/content/config/?lang=en | python3 -m json.tool

# Catalog page data reachable with the shared key? Must print 200
# (400 = 127.0.0.1 missing from ALLOWED_HOSTS; 404 = CATALOG_PAGES_SECRET missing or different)
KEY=$(grep '^CATALOG_PAGES_SECRET=' /opt/applelab/app/frontend/.env.production | cut -d= -f2-)
curl -s -o /dev/null -w '%{http_code}\n' -H "X-Catalog-Key: $KEY" "http://127.0.0.1:8002/api/catalog/pages/index/?lang=en"

# Frontend responding?
curl -s http://127.0.0.1:3002 | head -5

# Redis DB isolation check (4 is ours; 0–3 belong to the other two projects)
redis-cli -n 4 ping

# Nothing else is on our ports?
sudo ss -ltnp | grep -E '8002|3002'

# Site live?
curl -I https://applelab.bd

# Service pages render with data? Must print 10 (one card per device family)
curl -s https://applelab.bd/en/services | grep -c 'data-testid="family-card"'

# Nginx can read uploads and static files? Both must print 200
curl -s -o /dev/null -w '%{http_code}\n' https://applelab.bd/static/admin/css/base.css
curl -s -o /dev/null -w '%{http_code}\n' "https://applelab.bd$(curl -s 'https://applelab.bd/api/catalog/families/?lang=en' | python3 -c 'import sys,json; print(json.load(sys.stdin)[0]["image"])')"
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
sudo -u applelab DOTENV_FILE=.env.production venv/bin/python manage.py seed_catalog

# Frontend: deps + rebuild
cd ../frontend
sudo -u applelab npm ci
sudo -u applelab npm run build

# Restart
sudo systemctl restart applelab-backend applelab-frontend
```

> **Never skip `npm run build`.** `npm ci` only reinstalls packages; without a build, `next start` keeps serving the previous version of the site. Restart the backend *before* building — the build fetches catalog data from it.

### One-time steps for a server set up before 2026-09-14

These settings arrived with the device catalog and the admin-routing fix. Apply them once, then run the update above:

1. **Backend `.env.production`:** add `127.0.0.1,localhost` to `ALLOWED_HOSTS`; add `LEADS_REFERENCE_PREFIX=APL`, `NEXT_REVALIDATE_URL=http://127.0.0.1:3002/revalidate`, `NEXT_REVALIDATE_SECRET` and `CATALOG_PAGES_SECRET` (generate both secrets as in Section 4).
2. **Frontend `.env.production`:** add the same two secrets, and set `NEXT_PUBLIC_DJANGO_ADMIN_URL=https://applelab.bd/django-admin`. `NEXT_PUBLIC_*` values are baked in at build time, so rebuild after changing it.
3. **Nginx:** change `location /admin/` to `location /django-admin/`, add the `location /api/catalog/pages/ { return 404; }` block (Section 7), then `sudo nginx -t && sudo systemctl reload nginx`.
4. **Permissions:** `sudo usermod -aG applelab www-data && sudo systemctl restart nginx`, and `chmod 600` both `.env.production` files.
5. **Data:** run `seed_applelab` once (Section 4), and import the catalog images if you have not (Section 4, *Catalog images*).

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

- **Backend fails instantly with `status=203/EXEC`** — systemd cannot execute the `ExecStart` binary. Almost always `venv/bin/gunicorn` is missing (`pip install -r requirements.txt` was skipped or predates gunicorn being added). After fixing, run `sudo systemctl reset-failed applelab-backend` before `start`, or the restart-rate limit rejects it.

- **400 Bad Request from Django** — the host is missing from `ALLOWED_HOSTS` in `.env.production`. For requests from the Next.js server that host is `127.0.0.1`.
- **Site unchanged after an update** — `npm run build` was skipped; `next start` serves the last build.
- **`/services` shows "The catalog is being prepared"** — the Next.js server cannot load catalog data. Run the key check in Section 9: `400` → add `127.0.0.1` to `ALLOWED_HOSTS`; `301` → the backend predates the loopback HTTPS fix (pull and restart it); `404` → `CATALOG_PAGES_SECRET` is missing or differs between the two `.env.production` files, or the backend was not restarted after editing. Then rebuild the frontend.
- **Catalog images or the Django admin's CSS return 403** — Nginx cannot enter `/opt/applelab`; add `www-data` to the `applelab` group (Section 1) and restart Nginx.
- **`/admin` opens the Django login page** — Nginx still has the old `location /admin/` block; it must be `location /django-admin/` (Section 7). The site's staff panel is `/admin`; Django's own admin is `/django-admin/`.
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
