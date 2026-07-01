# 🛡️ Quantum Sentinel

### *A Post-Quantum Secure Digital Vault*

---

## 📖 Overview

**Quantum Sentinel** is a next-generation secure digital vault designed to protect sensitive digital assets from both current and future cyber threats. The application combines **Post-Quantum Cryptography (PQC)**, **Blockchain-based Tamper-Evident Logging**, and **Secure Cloud Infrastructure** to provide a highly secure platform for storing, managing, and protecting confidential information.

The system leverages **CRYSTALS-Kyber** for quantum-resistant encryption, **CRYSTALS-Dilithium** for digital signatures, and **Supabase** for secure authentication, cloud storage, and database management. Fine-grained access control is implemented using **PostgreSQL Row Level Security (RLS)**.

---

## ✨ Key Features

* 🔐 Secure User Authentication with JWT & Supabase
* 🛡️ Post-Quantum Encryption using **CRYSTALS-Kyber**
* ✍️ Quantum-Resistant Digital Signatures using **CRYSTALS-Dilithium**
* ⛓️ Blockchain-Based Tamper-Evident Audit Logs
* ☁️ Secure Cloud File Storage
* 👥 Digital Legacy Management System (DMS)
* 🎯 Beneficiary Management
* 📊 Real-Time Activity Monitoring
* 🔒 Row Level Security (RLS)
* 📱 Responsive and Modern User Interface

---

## 🛠️ Technology Stack

### 🎨 Frontend

* ⚛️ React
* 📘 TypeScript
* ⚡ Vite
* 🎨 Tailwind CSS
* 🧩 shadcn/ui

### ⚙️ Backend & Database

* 🟢 Supabase
* 🐘 PostgreSQL
* ☁️ Supabase Storage
* 🔒 Row Level Security (RLS)

### 🛡️ Security Technologies

* 🔐 CRYSTALS-Kyber
* ✍️ CRYSTALS-Dilithium
* 🔑 JWT Authentication
* ⛓️ Blockchain-Based Tamper-Evident Logging

---

## 🏗️ System Architecture

The application follows a modern client-cloud architecture where the React frontend securely communicates with Supabase services for authentication, database operations, and cloud storage.

Sensitive information is protected using **Post-Quantum Cryptography**, while blockchain-inspired immutable audit logs ensure **data integrity**, **traceability**, and **tamper detection**. PostgreSQL Row Level Security guarantees that users can access only their own information.

---

## 🚀 Getting Started

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/<your-username>/<repository-name>.git
```

### 2️⃣ Navigate to the Project

```bash
cd <repository-name>
```

### 3️⃣ Install Dependencies

```bash
npm install
```

### 4️⃣ Configure Environment Variables

Create a `.env` file in the project root.

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 5️⃣ Run the Application

```bash
npm run dev
```

---

## 📁 Project Structure

```text
📦 Quantum-Sentinel
├── 📂 public
├── 📂 src
│   ├── 📂 components
│   ├── 📂 pages
│   ├── 📂 hooks
│   ├── 📂 lib
│   ├── 📂 services
│   ├── 📂 utils
│   └── 📂 styles
├── 📂 supabase
├── 📄 package.json
├── 📄 README.md
└── 📄 vite.config.ts
```

---

## 🎯 Future Enhancements

* ✅ Multi-Factor Authentication (MFA)
* 🔑 Hardware Security Key Integration
* 🤝 Secure File Sharing
* 🤖 AI-Based Threat Detection
* 📱 Mobile Application
* 🌐 Enterprise Identity Provider Integration

---

## 🎓 Academic Project

This project was developed as part of the **Master of Computer Applications (MCA)** curriculum to demonstrate the implementation of **Post-Quantum Cryptography**, **Blockchain-Based Security**, and **Cloud-Based Secure Storage** in a modern web application.

---

## 👩‍💻 Author

**Sanjana Karanam**
🎓 Master of Computer Applications (MCA)

---

## ⭐ Support

If you found this project useful, consider giving it a **⭐ Star** on GitHub!
