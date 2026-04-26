# 🚔 Criminal Record Management System (CRMS) v2.0

**A premium, high-security law enforcement portal for evidence tracking, criminal profiling, and case management.**

![Crimanal Record Management System](https://img.shields.io/badge/Status-Active-brightgreen)
![Tech Stack](https://img.shields.io/badge/Stack-React%20%7C%20Node.js%20%7C%20MySQL-blue)
![Theme](https://img.shields.io/badge/Theme-Cyberpunk%20Black-black)

## 🌌 Overview
CRMS is a full-stack, enterprise-grade solution designed for police departments and judiciary branches. It features a stunning "pitch-black" command center aesthetic, inspired by modern tactical interfaces. The system provides real-time tracking of FIRs, Evidence, Case Files, and Court Hearings with advanced biometric-themed authentication.

---

## ✨ Key Features

### 🔐 Advanced Authentication
- **Biometric Hub**: A terminal-style login with wireframe facial scanning animations.
- **Access Granted Sequence**: A 2.6s immersive "decryption" and "validation" animation post-login.
- **Role-Based Access**: 
  - **Admin**: Full system control, role management, and audit logs.
  - **Police Officer**: FIR management, criminal tracking, and evidence collection.
  - **Court Clerk**: Hearing scheduling and case status updates.

### 📊 Tactical Dashboard
- **Live Metrics**: At-a-glance view of total criminals, active cases, and pending hearings.
- **Interactive HUD**: Functional metric cards that navigate directly to deeper modules.
- **Ambient Wireframe**: A subtle, evolving 3D wireframe skull background that lives in the "negative space" of every page.

### 📁 Core Modules
- **Criminal Records**: Interactive list with deep-linking to past records.
- **FIR Management**: Digitized First Information Reports with status tracking.
- **Case Files**: Link multiple FIRs and suspects into comprehensive legal cases.
- **Evidence Vault**: Track physical, digital, and video evidence with case linking.
- **Hearing Scheduler**: Manage court dates, judge remarks, and next-hearing dates.

### 🛠️ Interactive UI/UX
- **Collapsible Sidebar**: A translucent, floating hamburger menu to maximize screen real estate.
- **Responsive Layout**: Designed for high-resolution tactical displays.
- **Micro-animations**: Smooth transitions, glitch effects, and glassmorphism throughout.

---

## 🛠️ Technology Stack
- **Frontend**: React (Vite), React Router, React Icons, Axios.
- **Backend**: Node.js, Express.
- **Database**: MySQL (Relational schema with normalized tables).
- **Styling**: Pure Vanilla CSS (Custom properties, CSS Grid, Advanced Keyframes).

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** (v16.x or higher)
- **MySQL Server** (Running on port 3306)

### 2. Database Setup
1. Open your MySQL terminal or Workbench.
2. Run the schema located at `database/schema.sql`.
   ```sql
   source database/schema.sql;
   ```
3. Update the `.env` file in the `backend/` directory with your credentials:
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=Criminal_Record_System_2
   ```

### 3. Installation
**Clone the repository:**
```bash
git clone https://github.com/yourusername/Criminal-Record-System.git
cd Criminal-Record-System
```

**Setup Backend:**
```bash
cd backend
npm install
npm start
```

**Setup Frontend:**
```bash
cd ../frontend
npm install
npm run dev
```

---

## 📂 Project Structure
```text
├── backend/            # Express API, Models, and Controllers
├── frontend/           # React Application (Vite)
│   ├── src/components/ # Shared UI (Sidebar, Layout, etc.)
│   ├── src/pages/      # Feature-specific pages
│   └── src/index.css   # Main design system
└── database/           # SQL Schema and Migration Scripts
```

---

## 🛡️ Security Disclaimer
This application is designed for educational and demonstration purposes. In a production environment, ensure:
1. Passwords are hashed using `bcrypt`.
2. JWT or Session tokens are encrypted.
3. SQL Injection protection is strictly enforced (Prepared statements are used in current models).

---

## 👨‍💻 Author
**Developed with Antigravity AI**
*Built for modern law enforcement.*
