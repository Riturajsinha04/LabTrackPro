# Lab Equipment & Asset Issue-Return Tracking System

A full-stack institutional web application built with **Node.js**, **Express.js**, **EJS**, **MongoDB Atlas / Mongoose**, **Bootstrap 5**, and Session-based Authentication to track lab equipment issuance, returns, stock levels, overdue alerts, user roles, and maintenance logs.

---

## Tech Stack

- **Frontend:** EJS Templates (Server-Side Rendering), Bootstrap 5 (via CDN), Bootstrap Icons, Chart.js
- **Backend:** Node.js + Express.js (MVC Pattern)
- **Database:** MongoDB Atlas / Local MongoDB with Mongoose ODM
- **Authentication:** Session-based (`express-session` + `connect-mongo` store) with `bcryptjs` password hashing
- **Validation & Control:** `express-validator`, `method-override` (PUT/DELETE from EJS forms), `connect-flash`, `node-cron`

---

## Project Structure

```
├── config/
│   ├── db.js             # Mongoose connection config
│   └── session.js        # Express Session & MongoStore config
├── models/
│   ├── User.js           # User schema (roles: admin, lab_incharge, requester)
│   ├── Asset.js          # Asset schema (totalQuantity, availableQuantity, condition)
│   ├── IssueRequest.js   # Request schema (status: Pending, Issued, Returned, Overdue, Rejected)
│   └── MaintenanceLog.js # Maintenance log schema (stretch goal)
├── middleware/
│   ├── auth.js           # isLoggedIn, hasRole, updateOverdueRequests middleware
│   └── validators.js     # express-validator form input validation chains
├── controllers/
│   ├── authController.js        # Register, Login, Logout logic
│   ├── adminController.js       # Admin Dashboard, Asset CRUD, User Roles, Maintenance
│   ├── labInchargeController.js # Lab-scoped dashboard, Approvals, Returns
│   ├── requesterController.js   # Catalog browsing, Request placement, My Requests
│   └── dashboardController.js   # Role-based dashboard router
├── routes/
│   ├── authRoutes.js
│   ├── adminRoutes.js
│   ├── labInchargeRoutes.js
│   ├── requesterRoutes.js
│   └── dashboardRoutes.js
├── views/
│   ├── partials/       # header.ejs, navbar.ejs, footer.ejs, flash.ejs
│   ├── auth/           # login.ejs, register.ejs
│   ├── admin/          # dashboard.ejs, assets-list.ejs, asset-form.ejs, users-list.ejs, maintenance.ejs
│   ├── labincharge/    # dashboard.ejs, requests.ejs, issued-items.ejs, return-form.ejs
│   └── requester/      # browse-assets.ejs, request-form.ejs, my-requests.ejs
├── public/
│   ├── css/style.css   # Custom styling & status badges
│   └── js/main.js      # Client-side scripts
├── .env.example
├── package.json
├── seed.js             # Database seeding script
├── server.js           # Application entry point
└── README.md
```

---

## Roles & Permissions

1. **Admin**
   - Global dashboard showing metrics across all labs
   - Full CRUD on assets (`assetTag`, `name`, `category`, `labLocation`, `totalQuantity`, `availableQuantity`, `condition`, `description`)
   - User management (view users, update roles, assign labs)
   - Asset maintenance logging and service due tracking

2. **Lab In-charge**
   - Dashboard scoped strictly to their `assignedLab`
   - View pending issue requests for assets in their assigned lab
   - Approve or reject pending requests (atomic stock deduction on approval)
   - Record physical returns:
     - Condition **OK**: restock `availableQuantity` back
     - Condition **Damaged / Lost**: decrement `totalQuantity` (units are unusable; do not restock)

3. **Requester (Student / Staff)**
   - Register & Login
   - Browse equipment catalog (filter by category, lab location, search, availability)
   - Submit issue requests (validated against available stock)
   - View request history and status badges (Pending, Issued, Returned, Rejected, Overdue)

---

## Setup & Running Locally

### 1. Prerequisites
- Node.js (v16+ recommended)
- MongoDB instance running locally (`mongodb://127.0.0.1:27017`) or a MongoDB Atlas URI

### 2. Installation & Configuration

```bash
# Install dependencies
npm install

# Create environment file from template
cp .env.example .env
```

Ensure `.env` contains:
```env
PORT=3000
MONGO_URI=mongodb://127.0.0.1:27017/lab_tracking_system
SESSION_SECRET=super_secret_lab_equipment_key_2026
```

### 3. Seed Database
Populate the database with sample users, lab in-charges, equipment assets, issue requests, and maintenance logs:

```bash
npm run seed
```

#### Pre-seeded Demo Credentials:
- **Admin:** `admin@lab.com` / `admin123`
- **Lab In-charge (Physics Lab):** `lab1@lab.com` / `lab123`
- **Lab In-charge (CS Lab):** `lab2@lab.com` / `lab123`
- **Requester (Student):** `student@lab.com` / `student123`

### 4. Start Application

```bash
# Start server
npm start

# Or start in development mode with nodemon
npm run dev
```

Open `http://localhost:3000` in your web browser.
