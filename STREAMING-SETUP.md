# MLNF Livestreaming Infrastructure

**Setup Date**: 2026-01-01
**Status**: Fully Operational

---

## Architecture

```
OBS Studio
    │
    ▼ RTMP (port 1935)
┌─────────────────────────────┐
│  Oracle Cloud Server        │
│  150.136.140.253            │
│  ─────────────────────────  │
│  nginx-rtmp (ingest)        │
│  HLS generation → /var/www/hls │
│  Node.js backend (port 5000)│
└─────────────────────────────┘
    │
    ▼ HTTPS (port 443)
stream.mlnf.net/hls/{streamKey}.m3u8
    │
    ▼
Viewers on mlnf.net/pages/live.html
```

---

## Endpoints

| Purpose | URL |
|---------|-----|
| RTMP Ingest | `rtmp://150.136.140.253:1935/live` |
| HLS Playback | `https://stream.mlnf.net/hls/{streamKey}.m3u8` |
| Watch Stream | `https://mlnf.net/pages/live.html?stream={streamId}` |
| Create Stream | Dashboard → Creator Studio |

---

## OBS Settings

- **Service**: Custom
- **Server**: `rtmp://150.136.140.253:1935/live`
- **Stream Key**: Get from dashboard after creating stream

---

## Oracle Cloud Security List Rules

| Port | Protocol | Purpose |
|------|----------|---------|
| 22 | TCP | SSH |
| 80 | TCP | HTTP (Let's Encrypt) |
| 443 | TCP | HTTPS (HLS delivery) |
| 1935 | TCP | RTMP ingest |
| 8080 | TCP | HTTP HLS (legacy) |

---

## SSL Certificate

- **Domain**: stream.mlnf.net
- **Provider**: Let's Encrypt
- **Expires**: 2026-04-01
- **Cert Path**: `/etc/letsencrypt/live/stream.mlnf.net/`
- **Renewal**: `sudo /usr/local/bin/certbot renew`

---

## Databases

**Production (Render + Oracle):**
- MongoDB Atlas cluster: `mlnf.5zppehf.mongodb.net`
- Credentials: Stored in Render environment variables (never commit to repo)

---

## Monthly Costs

| Service | Tier | Cost |
|---------|------|------|
| Oracle Cloud | Always Free | $0 |
| Render | Free | $0 |
| Netlify | Free | $0 |
| MongoDB Atlas | M0 Free | $0 |
| Domain | mlnf.net | ~$1/mo |
| **Total** | | **~$1/month** |

**Scaled (if needed):**
- Render Starter: +$7/mo
- MongoDB M2: +$9/mo

---

## Key Files

- **nginx config**: `/usr/local/nginx/conf/nginx.conf`
- **Backend**: `/home/opc/projects/mlnf/backend/`
- **HLS output**: `/var/www/hls/`
- **Backend logs**: `/tmp/mlnf-backend.log`

---

## Restart Commands

```bash
# SSH to Oracle
ssh opc@100.76.2.30

# Restart nginx
sudo /usr/local/nginx/sbin/nginx -s reload

# Restart backend
pkill -f 'node server.js'
cd /home/opc/projects/mlnf/backend
nohup node server.js > /tmp/mlnf-backend.log 2>&1 &
```

---

## Next Steps (Future)

- [ ] Auto-reconnect handling
- [ ] VOD recording/playback
- [ ] Live chat integration
- [ ] Stream thumbnails/previews
- [ ] Discovery page for all live streams
- [ ] Mobile app
