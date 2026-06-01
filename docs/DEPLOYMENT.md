# Deployment

Production deployment of DocxAutoFill on a single Linux host, behind an nginx
TLS terminator, with a Let's Encrypt certificate issued **directly for the
server's IP address** (no domain required) and renewed automatically.

## Topology

```
Internet ──443/HTTPS──▶ nginx (TLS terminator)
                         ├── /api/*  ──▶ backend  (FastAPI, :3000)
                         └── /*      ──▶ frontend (Vite,    :5173)
                         postgres (:5432) ◀── pgdata volume

certificate: lego + Let's Encrypt `shortlived` profile (IP SAN, ~6 days),
             renewed twice daily by a systemd timer (HTTP-01 webroot).
```

Frontend and API are served from a single origin (`https://<IP>`) so the
session cookie is first-party. Only nginx publishes ports (80/443); the app
and database stay on the internal Docker network.

## Server layout

```
/opt/docxautofill/
├── docker-compose.prod.yml      # from deploy/
├── nginx/conf.d/default.conf    # from deploy/nginx.conf
├── scripts/{deploy.sh,renew-cert.sh}
├── .env                         # secrets — never committed
└── backups/                     # automatic DB dumps (last 10)
/etc/lego/                       # account + certificates (lego state)
/etc/lego/live/{fullchain,privkey}.pem  # symlinks to the active cert
/var/www/acme/                   # ACME HTTP-01 webroot
/usr/local/bin/lego              # ACME client
```

## `.env` (on the server)

```
IMAGE_TAG=1.0.0
POSTGRES_USER=docxautofill
POSTGRES_PASSWORD=<generated>
POSTGRES_DB=docxautofill
DOCXAUTOFILL_ADMIN_USERNAME=admin
DOCXAUTOFILL_ADMIN_PASSWORD=<generated>
DOCXAUTOFILL_COOKIE_SECURE=true
DOCXAUTOFILL_CORS_ORIGINS=["https://<IP>"]
VITE_API_URL=https://<IP>
# certificate renewal
ACME_EMAIL=<contact email>
ACME_DOMAIN=<IP>
ACME_PROFILE=shortlived
NGINX_CONTAINER=docxautofill-nginx
```

## Certificate (IP, Let's Encrypt short-lived)

Let's Encrypt issues certificates for IP addresses only through the
`shortlived` profile (~6-day validity), so renewal must be frequent and
automatic. Initial issuance (standalone HTTP-01 on port 80):

```bash
lego --path /etc/lego \
  --server https://acme-v02.api.letsencrypt.org/directory \
  --email <email> --accept-tos \
  --http --http.address ":80" \
  --domains <IP> --profile shortlived run
```

Renewals use the webroot challenge served by the running nginx (no downtime);
see `scripts/renew-cert.sh`, driven by `deploy/systemd/lego-renew.timer`.

```bash
install -m644 deploy/systemd/lego-renew.{service,timer} /etc/systemd/system/
systemctl daemon-reload
systemctl enable --now lego-renew.timer
systemctl list-timers lego-renew.timer        # inspect schedule
systemctl start lego-renew.service             # force a renewal check now
```

## Updating (delivery of new versions)

From your workstation, after configuring `deploy/deploy.env` (copy of
`deploy/deploy.env.example`):

```bash
scripts/release.sh            # build + push images, then deploy over SSH
```

`release.sh` builds and pushes `ishikii/docx_*:$TAG`, then runs
`scripts/deploy.sh` on the server, which backs up the database, pulls the new
images, recreates the containers, reloads nginx, and health-checks the API
(non-zero exit on failure). To deploy on the server directly:

```bash
cd /opt/docxautofill && IMAGE_TAG=<tag> bash scripts/deploy.sh
```

### Rollback

Re-run with the previous tag: `IMAGE_TAG=<previous> bash scripts/deploy.sh`.
Database dumps are in `/opt/docxautofill/backups/` (gzipped `pg_dump`).

## Notes

- Behind a real domain later: point an A record at the host, set
  `ACME_DOMAIN`/`CORS_ORIGINS`/`VITE_API_URL` to the domain, and switch the
  profile back to a standard 90-day cert (drop `--profile shortlived`).
- The frontend image runs the Vite server; nginx forces the upstream `Host`
  to `localhost` to satisfy Vite's allowed-hosts check.
