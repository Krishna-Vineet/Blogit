# Blogit 📝  [View Blogit](https://blogit-gamma.vercel.app/)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)


A full-stack **blogging web application** where users can write and interact with blogs using likes, dislikes, comments, shares, and follows. Built with a powerful backend using Node.js, Express, and MongoDB, and rendered with EJS templating for polished user experience.

> **Note:** The primary focus is on backend robustness and clean architecture. Frontend is functional with great UX; responsiveness/UI polish is planned in future iterations.

---

## 🌐 Live Demo

👉 [Click here to view Blogit Website](https://blogit-gamma.vercel.app/)

---

## 🚀 Purpose & Goals

This project was built after completing a full backend course using **Node.js, Express, and MongoDB**. The aim was to:

* Build a real-world, full-stack application with production-grade architecture
* Practice intense backend logic, JWT authentication, and OTP verification
* Implement clean folder structures and reusable utilities/middlewares
* Master error handling, routing, MongoDB operations, file uploads, and mailing
* Learn tools like Cloudinary, Multer, Nodemailer, CKEditor, etc.

---

## ⚙️ Tech Stack

### 💻 Frontend

* EJS
* HTML, CSS, JS
* Toastify, Flickity, CKEditor

### 🛠 Backend

* Node.js
* Express.js
* MongoDB (Cloud Hosted)
* Mongoose
* JWT & OTP-based authentication
* Multer (file handling)
* Cloudinary (image hosting)
* Nodemailer (emails)
* CORS, dotenv, cookie-parser, bcrypt

### 🔧 Dev Tools

* Git, GitHub
* Postman (route testing)
* VS Code, Prettier, Nodemon

---

## ✨ Features

* 🔐 **Authentication**

  * Register/Login with validations
  * OTP-based email verification
  * Password reset & change email
  * Logout & account deletion

* ✍️ **Blog System**

  * Create/Edit/Delete blog posts
  * Rich text editing with CKEditor
  * Upload blog images (Cloudinary)
  * Categorized blog organization

* 📢 **User Interaction**

  * Like, Dislike, Share blogs
  * Add comments & interact with them
  * Follow other users

* 👤 **User Profiles**

  * View others' profiles and blogs
  * Followers/Following counts
  * Edit your profile

* 🔍 **Utility Features**

  * Real-time search
  * Sidebar with Top Authors, Trending Blogs
  * Toast notifications
  * Server-side and client-side validations

* ⚙️ **Admin & Safety**

  * All routes verified via Postman
  * All errors handled gracefully
  * Cyber-safe architecture (bcrypt, cookie-parser)

---

## 📁 Folder Structure

```bash
Blogit/
├── .env
├── .gitignore
├── .prettierc / .prettierignore
├── package.json
├── vercel.json
├── public/
│   └── temp/.gitkeep
├── src/
│   ├── app.js / index.js / constants.js
│   ├── controllers/
│   ├── db/
│   ├── middlewares/
│   ├── models/
│   ├── public/css/ & js/
│   ├── routes/
│   ├── utils/
│   └── views/
└── README.md
```

> Folder structure reflects production-grade separation of concerns.

---

## 🧪 Setup Instructions

### 🔑 Environment Variables

Create a `.env` file with the following keys:

```env
PORT=5000
MONGODB_URI=your_mongodb_uri
ACCESS_TOKEN_SECRET=your_secret
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_SECRET=your_refresh_secret
REFRESH_TOKEN_EXPIRY=30d
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
EMAIL_USERNAME=your_email@gmail.com
EMAIL_PASSWORD=your_email_password_or_app_password
```

### 🧰 Run Locally

```bash
git clone https://github.com/yourusername/Blogit.git
cd Blogit
npm install
npm run dev
```

---

## 🖼 Pages Overview

* **Header:** CTA buttons, Add Blog, Search bar, Sidebar with top authors, trending, followed users
* **Footer:** Categories, Feedback, Links to T\&C, Privacy, Logout/Delete account
* **Homepage:** Hero, categories, trending carousel, popular carousel, stats, sidebar
* **Profile Page:** Social handles, bio, follower stats, blogs with filters
* **Blog Page:** Like/Dislike, comments, tags, related blogs
* **Auth Pages:** Register, Login, Password Reset, Change Email
* **Others:** Add/Edit Blog, 404 page, Privacy Policy, Terms

---

## 📚 What I Learned

* Deep understanding of backend fundamentals
* RESTful APIs, middlewares, clean code structure
* EJS templating & partials
* Mongoose Aggregate Pipelines
* OTP and JWT flows
* Debugging, async error handling, backend logic
* Git workflow & deployment
* Postman testing and API documentation

---

## 📈 Future Improvements

* Convert frontend to React.js or Next.js
* Add 3D elements via Three.js
* Redis caching
* Make UI better with better fonts, colors and responsiveness.
* Improve SEO and metadata

---

## 🙏 Credits

* Special thanks to **Hitesh Choudhary (ChaiOrCode)** for backend courses
* Stack Overflow, npm docs, ChatGPT for continuous learning
* Myself, for being consistent and passionate about backend!

---

## 🧠 Note

> The focus was on backend strength and architecture. UI might lack polish, but UX is functional. All errors are handled via Toastify. The web app is fully stable and safe.

---

## 📌 License

This project is open-source and available under the MIT License.



---

**Built with ❤️ by Krishna**

