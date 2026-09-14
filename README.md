# 🎒 PackSmart - E-Commerce Platform


PackSmart is a full-stack, scalable e-commerce platform dedicated to premium bag items and travel accessories. Built with a robust **Node.js/Express** backend and **MongoDB**, it features a traditional **MVC (Model-View-Controller)** architecture rendered via **EJS** templating and styled with an ahead-of-time (AOT) compiled **Tailwind CSS** design system.

This project demonstrates modern backend capabilities including secure authentication, third-party payment integration, cloud media storage, and automated report generation.

---

## ✨ Key Features

* **Secure Authentication:** Local strategy (Bcrypt password hashing) and OAuth 2.0 (Google Login) via `Passport.js`. OTP-based email verification.
* **Product & Inventory Management:** Full admin dashboard to manage products, categories, and stock levels.
* **Media Management:** Cloud-based image storage and optimization using `Cloudinary` and `Multer`. Frontend image cropping via `Cropper.js`.
* **Seamless Checkout & Payments:** Integrated with `Razorpay` for secure, real-time transaction processing.
* **Advanced Cart & Order System:** Session-based cart management (`express-session`) with complete order tracking and status updates.
* **Admin Analytics & Reporting:** Automated sales report generation in both **PDF** (`pdfkit`) and **Excel** (`exceljs`) formats.

---

## 🛠️ Tech Stack & Architecture

Built with a robust **MVC (Model-View-Controller)** architecture:

* **Backend & Database:** Node.js, Express.js (v5), MongoDB & MongoDB Atlas, Mongoose ODM (v8)
* **Authentication & Security:** Session-based Authentication (`express-session`), Passport.js (Google OAuth 2.0 & Local Strategy), Bcrypt.js, OTP Email Verification (Resend API), Nocache, Dotenv
* **Frontend & UI:** Tailwind CSS (AOT CLI Pipeline), EJS Templating, HTML5, Custom CSS3, Vanilla JS (ES6+), Chart.js, Cropper.js, SweetAlert2
* **Cloud & Media Storage:** Cloudinary API, Multer & `multer-storage-cloudinary`
* **Payments & Communication:** Razorpay Payment Gateway, Resend API (Transactional Emails)
* **Reporting & Data Export:** PDFKit (PDF Invoices & Reports), ExcelJS (Excel Sales Data)

---

## ☁️ Deployment & Cloud Infrastructure

### Current Live Deployment (Render)
> *Note: Migrated application hosting to Render following the conclusion of the initial AWS deployment tenure.*

* **Live URL:** 🔗 [https://packsmart-psry.onrender.com/](https://packsmart-psry.onrender.com/)
* **Cloud Hosting:** Deployed as a web service on **Render**.
* **Uptime Optimization:** Integrated with **cron-job.org** for automated health checks to keep the live server active 24/7.

### Primary Infrastructure (AWS Setup)
* **Cloud Hosting:** Deployed on an **AWS EC2** virtual server instance running Ubuntu Server.
* **Reverse Proxy & Web Server:** Configured **Nginx** as a reverse proxy for request routing, static file handling, and SSL termination.
* **Process Management:** Utilized **PM2** (Process Manager 2) for background process monitoring, log management, and automatic restarts.
* **Security & Infrastructure:** Manual configuration of AWS Security Groups, environment variable isolation, and SSL/TLS encryption for HTTPS communication.

---

## 📂 Project Structure

The codebase is organized adhering to industry-standard separation of concerns:

```text
EPROJECT/
├── App/
│   ├── config/              # Database & third-party service configs
│   ├── controllers/         # MVC Controllers handling request/response logic
│   ├── helpers/             # Utility functions & helpers
│   ├── middlewares/         # Custom Express middlewares (Auth, Multer, Error guards)
│   ├── models/              # Mongoose schemas and data models
│   ├── public/              # Static assets (Compiled Tailwind CSS, client JS, media)
│   │   └── user/css/        # tailwind-input.css (Source) & tailwind.css (Compiled)
│   ├── routes/              # Express router definitions (User & Admin)
│   ├── views/               # EJS server-rendered templates (User & Admin UI)
│   ├── app.js               # Application entry point & Express configuration
│   ├── package.json         # Dependencies & Tailwind build/watch scripts
│   └── tailwind.config.js   # Central Tailwind design system & content configuration
├── .env                     # Environment variables (Ignored in Git)
└── README.md                # Project documentation
```
