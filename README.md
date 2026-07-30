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

**Architecture:** MVC (Model-View-Controller)
**Environment:** Node.js (Runtime)

* **Backend Framework:** Express.js
* **Database:** MongoDB & Mongoose (ODM)
* **View Engine:** EJS (Embedded JavaScript)
* **Payment Gateway:** Razorpay API
* **Cloud Storage:** Cloudinary API
* **Email Service:** Resend API 

---

## ☁️ Deployment & Cloud Infrastructure

> **Infrastructure Status Note:** Originally deployed on a production-ready **AWS EC2 (Ubuntu)** cloud instance. The live instance is currently undergoing scheduled infrastructure migration to **Render**.

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



   
