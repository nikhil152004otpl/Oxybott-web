# Oxybott STEM Robotics Platform — Modern Full-Stack Web Application

![Oxybott Banner](frontend/public/assets/images/banner-app.webp)

A modern, high-performance full-stack web platform for **Oxybott**, a premier educational robotics brand specializing in ESP32 smart robotics kits, IoT STEM learning modules, and classroom curriculum solutions.

This project represents the complete architectural migration from legacy static HTML/Vanilla JS to a scalable **React 18 (Vite SPA) + Node.js (Modular Express 5.x) + PostgreSQL** ecosystem.

---

## 🏛️ Modern Architecture Overview

```
project/
├── frontend/                     # Modern React 18 + Vite SPA
│   ├── public/                   # Static assets, WebP images, uploads
│   ├── src/
│   │   ├── assets/               # Bundled imagery & icons
│   │   ├── components/           # Reusable components
│   │   │   ├── cart/             # Slide-out Cart Drawer with line items & subtotal
│   │   │   ├── common/           # SiteHeader, MegaMenu, SiteFooter, AnnouncementBar
│   │   │   ├── home/             # Interactive CodeStudio simulation
│   │   │   ├── modals/           # Institutional QuoteModal
│   │   │   ├── product/          # ProductCard with wishlist & badges
│   │   │   └── search/           # Quick Search Modal (Ctrl+K)
│   │   ├── context/              # CartContext, StoreContext, AuthContext, ToastContext
│   │   ├── layouts/              # RootLayout with modals & persistent headers
│   │   ├── pages/                # HomePage, ProductsPage, ProductDetailPage,
│   │   │                         # EducationPage, SoftwarePage, TutorialsPage,
│   │   │                         # AboutPage, ContactPage, NotFoundPage
│   │   │   └── admin/            # AdminLoginPage, AdminDashboardPage
│   │   ├── routes/               # React Router v6 route configuration
│   │   ├── services/             # API client with anti-CSRF headers
│   │   ├── styles/               # Preserved styles.css & admin.css
│   │   └── utils/                # Fallback products data
│   ├── package.json
│   └── vite.config.js            # Vite config with API proxy
│
├── backend/                      # Production-ready Modular Express Backend
│   ├── prisma/
│   │   └── schema.prisma         # Prisma ORM Schema for PostgreSQL
│   ├── src/
│   │   ├── config/               # Database connection pool (pg / node-postgres)
│   │   ├── controllers/          # Products, Categories, Banners, Inquiries, Settings, Auth, Admin
│   │   ├── database/             # PostgreSQL migrations, seeders, SQLite import
│   │   │   ├── migrations/       # 001_init.sql PostgreSQL DDL
│   │   │   ├── migrate.js        # Migration runner
│   │   │   ├── seed.js           # Seed admin, categories, settings, hero banner
│   │   │   └── import-sqlite.js  # Safe SQLite-to-PostgreSQL data migration
│   │   ├── middleware/           # Auth (JWT/cookies/anti-CSRF), Multer upload, Error handler
│   │   ├── routes/               # Express modular REST routers
│   │   ├── services/             # Core business logic layer
│   │   ├── app.js                # Express app configuration & middlewares
│   │   └── server.js             # HTTP server entrypoint
│   ├── tests/                    # Automated integration test suite
│   │   └── api.test.js           # 10 integration test suites (100% passing)
│   └── package.json
│
├── .env.example                  # Environment configuration template
└── README.md                     # Complete documentation & operations guide
```

---

## 🚀 Key Features

* **Storefront & Product Catalog:**
  * Dynamic, responsive catalog loaded from PostgreSQL with multi-facet filtering (Series, Category, Age groups) and real-time sorting.
  * Product Detail Pages (PDP) with multi-angle galleries, STEM curriculum highlights, technical pinouts, and box contents.
  * Standardized Indian Rupee (INR `₹`) pricing across all components via `Intl.NumberFormat`.
* **Lead Capture & Inquiry Workflow:**
  * Functional lead forms for general inquiries, institutional quotation requests, educator trial units, and newsletter subscriptions.
  * Direct backend persistence to PostgreSQL with server-side validation, duplicate submission protection (60s anti-spam window), and IP rate limiting.
* **Admin Dashboard:**
  * Secure administrative portal with JWT authentication, `SameSite: Strict` / `HttpOnly` cookie protection, and anti-CSRF headers.
  * Complete product CRUD (Create, Read, Update, Delete) with image upload validation (MIME-type filtering and file size bounds).
  * Inquiry & Lead Management dashboard to track, filter, and transition incoming leads (`new` → `in_progress` → `resolved` → `archived`).
  * Immutable administrative audit trail logging all sensitive mutations.
* **Interactive Code Studio:**
  * Virtual tri-lingual programming viewer (OxyCode Blocks, Arduino C++, MicroPython).
  * In-browser servo articulation visualizer simulating pick-and-place robot motion.

---

## 🛠️ Technology Stack

* **Frontend:** React 18, JSX, Vite, React Router v6, CSS3 Custom Design System (WCAG 2.1 AA compliant)
* **Backend:** Node.js, Express.js 4.x/5.x (Modular MVC Architecture)
* **Database:** PostgreSQL with `node-postgres` (`pg`) connection pooling & Prisma Schema
* **Security:** JWT, bcryptjs, HTTP-only SameSite=Strict cookies, custom anti-CSRF header validation, express-rate-limit
* **Testing:** Node.js native test runner (`node --test`), Playwright regression verification

---

## 🏁 Getting Started

### 1. Prerequisites
* **Node.js** v20.x, v22.x, or v24.x+
* **npm** v10.x+
* **PostgreSQL** 14+ (optional for local dev; built-in SQLite translation fallback provided if PostgreSQL is not running)

### 2. Environment Configuration
Copy `.env.example` in `project/`:
```bash
cp project/.env.example project/.env
```
Key environment variables:
```env
PORT=5000
HOST=127.0.0.1
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/oxybott
JWT_SECRET=oxybott_secure_jwt_secret_key_prod_2026_modern_pg_xyz987
CLIENT_ORIGIN=http://localhost:3000
```

### 3. Backend Setup & Start
```bash
# Navigate to backend
cd project/backend

# Install dependencies
npm install

# Run PostgreSQL Migrations & Seed (optional if using PostgreSQL)
npm run db:migrate
npm run db:seed

# Start backend server
npm start
```
The backend starts at `http://127.0.0.1:5000/api`.

### 4. Frontend Setup & Start
```bash
# Navigate to frontend
cd project/frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```
Open your browser to:
* **Storefront:** [http://localhost:3000/](http://localhost:3000/)
* **Admin Portal:** [http://localhost:3000/admin](http://localhost:3000/admin)
* **Admin Login Credentials:**
  * Username: `admin`
  * Password: `AdminPassword123!`

---

## 🧪 Testing & Verification

Run the automated backend integration test suite:
```bash
cd project/backend
npm test
```
**Verification Results:**
* `✔ 1. Health check endpoint responds OK`
* `✔ 2. Public Settings endpoint returns store configuration`
* `✔ 3. Public Categories endpoint returns published categories`
* `✔ 4. Public Products endpoint returns product catalog with filters`
* `✔ 5. Public Product Detail endpoint returns full metadata`
* `✔ 6. Inquiries endpoint validates input and prevents spam duplicate`
* `✔ 7. Admin Auth handles rejection of invalid credentials and accepts valid admin`
* `✔ 8. Admin Dashboard Stats endpoint returns aggregated metrics`
* `✔ 9. Admin Product Lifecycle (Create, Update, Publish, Duplicate, Delete)`
* `✔ 10. Admin Inquiries management (List, Status Update, Delete)`
* **Total: 10 passed, 0 failed.**

### Production Frontend Build Check
```bash
cd project/frontend
npm run build
```
Builds optimized production assets to `project/frontend/dist/`.

