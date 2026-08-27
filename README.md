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
| **Authentication** | NextAuth v5 Google OAuth (`janskifura@gmail.com`, `lee13parkinson@gmail.com`) |
| **Telemetry** | Centralized logging to Stef CEO Dashboard |

---

## 🚀 Key Features

* **Template Catalog (`/templates`):** Pre-loaded with all 11 Wealth & Advisory templates (*Review, Advice Presentation, Onboarding, Fact Find, Initial Strategy, etc.*).
* **Two-Layer Interactive Section Editor (`/templates/[id]`):**
  * Dynamic sidebar outline with smooth scroll-to-section navigation.
  * Global Instructions & AI Rules manager.
  * Section & Subsection tree management (§ 1, 1.1, 1.2...).
  * Directives / AI Guidance boxes, Content to Include bullet prompts, Table schemas, and Compliance checklists.
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