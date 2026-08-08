# 🎒 PackSmart -  E-Commerce Platform

PackSmart is a full-stack, scalable e-commerce platform dedicated to premium bag items. Built with a robust **Node.js/Express** backend and **MongoDB**, it features a traditional **MVC (Model-View-Controller)** architecture rendered via **EJS** templating.

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

* **Backend & Database:** Node.js, Express.js (v5), MongoDB & MongoDB Atlas, Mongoose (v8), `express-session`
* **Frontend & UI:** EJS Templating, HTML5, Custom CSS3, Vanilla JS (ES6+), Chart.js, Cropper.js, SweetAlert2
* **Authentication & Security:** Passport.js (Google OAuth 2.0 & Local), Bcrypt.js, Nocache, Dotenv
* **Cloud & Media Storage:** Cloudinary API, Multer & `multer-storage-cloudinary`
* **Payments & Communication:** Razorpay API, Resend API (Transactional Emails/OTP)
* **Reporting & Data Export:** PDFKit (PDF Invoices & Reports), ExcelJS (Excel Sales Data)



## ☁️ Deployment & Cloud Infrastructure

### Primary Infrastructure (AWS Setup)
* **Cloud Hosting:** Deployed on an **AWS EC2** virtual server instance running Ubuntu Server.
* **Reverse Proxy & Web Server:** Configured **Nginx** as a reverse proxy for request routing, static file handling, and SSL termination.
* **Process Management:** Utilized **PM2** (Process Manager 2) for background process monitoring, log management, and automatic restarts.
* **Security & Infrastructure:** Manual configuration of AWS Security Groups, environment variable isolation, and SSL/TLS encryption for HTTPS communication.

### Current Live Deployment (Render & Atlas)
> *Note: Migrated to Render and MongoDB Atlas after the AWS Free Tier expired.*

* **Cloud Hosting & DB:** Deployed on **Render** paired with **MongoDB Atlas** cloud database.
* **Uptime Optimization:** Integrated with **cron-job.org** for automated pings to keep the live server active 24/7.

---

## 📂 Project Structure

The codebase is organized adhering to industry-standard separation of concerns:

```text
EPROJECT/
├── App/
│   ├── config/         # Database and third-party API configurations
│   ├── controllers/    # Business logic handling request/response
│   ├── helpers/        # Reusable utility functions
│   ├── middlewares/    # Custom route middleware (Auth, Error handling)
│   ├── models/         # Mongoose schemas and database models
│   ├── public/         # Static assets (CSS, client-side JS, images)
│   ├── routes/         # Express route definitions
│   └── views/          # EJS templates (Admin and User UI)
├── .env                # Environment variables (Ignored in Git)
├── app.js              # Application entry point and server setup
└── package.json        # Project metadata and dependencies



   
