# FA Meeting Manager — FutureSolutions AI

Enterprise Wealth Management & Financial Advisory Meeting Template Studio.

---

## 🌐 Production Infrastructure (Hostinger VPS)

| Property | Value |
| :--- | :--- |
| **Live URL** | [https://fameetingmanager.futuresolutionsai.com](https://fameetingmanager.futuresolutionsai.com) |
| **Server** | **Hostinger VPS (`46.202.129.30`)** |
| **Directory** | `/var/www/fameetingmanager` |
| **Port** | **`3700`** |
| **Process Manager** | **PM2** (`fameetingmanager`) |
| **Reverse Proxy** | **Caddy** (Auto-SSL) |
| **Database** | SQLite + Prisma ORM (`prisma/superbia.db`) |
| **Authentication** | NextAuth v5 Google OAuth (`janskifura@gmail.com`, `lee13parkinson@gmail.com`, `wilkmaksym@gmail.com`) |
| **Telemetry** | Centralized logging to Stef CEO Dashboard |

---

## 📡 Developer REST API

Full documentation is available in [API_DOCUMENTATION.md](./API_DOCUMENTATION.md).

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/templates` | List all templates with internal IDs & metadata |
| `GET` | `/api/v1/templates/:id` | Get full prompt directives & sections (by `DOC-001` or UUID) |
| `POST` | `/api/v1/templates` | Programmatically import new document/meeting templates |

---

## 🚀 Key Features

* **Meeting & Document Catalogs:** Separate, dedicated workspaces for Meeting Notes (10 templates) and Advisory Documents (6 templates).
* **Internal IDs & Developer API:** Programmatic access with standardized IDs (`DOC-001`, `MTG-001`).
* **Multi-Tier Complexity (`Simple` / `Standard` / `Complex`):** Toggle between granular narrative and streamlined versions with 1-click forking.
* **Invisible Drag-and-Drop Sorting:** Custom catalog re-ordering persisted to SQLite database.
* **Two-Layer Interactive Section Editor (`/templates/[id]`):**
  * Dynamic outline with smooth scroll-to-section navigation.
  * Global Instructions & AI Rules manager.
  * Directives / AI Guidance boxes, Content to Include bullet prompts, and Tables.
* **1-Click Actions:** Duplicate, Delete, and JSON Export/Import.

---

## 🛠️ Local Development

```bash
# 1. Install dependencies
npm install

# 2. Database migration & seeding
npx prisma db push
node prisma/seed.js

# 3. Start dev server on port 3005
npm run dev -- -p 3005
```

---

## 🚀 Production Deployment (Hostinger VPS)

```bash
cd /var/www/fameetingmanager
git pull origin main
npm install
npx prisma db push --accept-data-loss
node prisma/seed.js
npm run build
pm2 restart fameetingmanager
pm2 save
```

### Caddy Reverse Proxy Block
```caddyfile
fameetingmanager.futuresolutionsai.com {
    reverse_proxy localhost:3700
    encode gzip zstd
    log {
        output file /var/log/caddy/fameetingmanager.log
    }
}
```