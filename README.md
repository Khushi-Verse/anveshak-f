<div align="center">

  <img src="./public/logo.jpg" alt="ANVESHAK Logo" width="180"/>

  <h1>ANVESHAK</h1>

  <h3>National Justice Network</h3>

  <p><strong>Secure Digital Document Management System for Legal & Investigation Documents</strong></p>

  <p><em>One Nation. One Justice Network.</em></p>

  <br/>

  <a href="https://anveshak-885p245yf-khushi-singh-collabs-projects.vercel.app/">
    <img src="https://img.shields.io/badge/Live%20Demo-Visit%20ANVESHAK-ff9933?style=for-the-badge&logo=vercel&logoColor=white" alt="Live Demo"/>
  </a>
  <a href="https://github.com/Khushi-Verse/Anveshak-new">
    <img src="https://img.shields.io/badge/GitHub-Source%20Code-181717?style=for-the-badge&logo=github&logoColor=white" alt="GitHub Repository"/>
  </a>

<br/><br/>

  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React"/>
  <img src="https://img.shields.io/badge/Vite-Build%20Tool-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite"/>
  <img src="https://img.shields.io/badge/Node.js-Backend-339933?style=flat-square&logo=node.js&logoColor=white" alt="Node.js"/>
  <img src="https://img.shields.io/badge/Express.js-API-000000?style=flat-square&logo=express" alt="Express"/>
  <img src="https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb&logoColor=white" alt="MongoDB"/>
  <img src="https://img.shields.io/badge/Google%20Gemini-AI-4285F4?style=flat-square&logo=google" alt="Gemini AI"/>

</div>

---

## 🌐 Live Demo

Experience the deployed application:

### 🔗 [Open ANVESHAK Live Demo](https://anveshak-885p245yf-khushi-singh-collabs-projects.vercel.app/)

> The live deployment demonstrates the ANVESHAK frontend and its integrated digital justice workflow.

---

## 🏛️ About the Project

**ANVESHAK** is a secure digital document management and justice coordination platform designed to connect citizens, police departments, investigation agencies, and courts through a unified digital ecosystem.

The platform aims to simplify the management of legal and investigation-related information by bringing together:

* Digital FIR registration
* Case tracking
* Investigation management
* Secure evidence storage
* Cross-agency collaboration
* Court document access
* AI-powered case analysis
* Blockchain-backed document integrity
* Audit trails and controlled access

ANVESHAK is built around the vision:

> **One Nation. One Justice Network.**

---

## 🎯 Problem Statement

Legal and investigation workflows frequently involve disconnected departments, fragmented information, manual documentation, and delayed communication.

This can lead to:

* Difficulty tracking case progress
* Fragmented FIR and investigation records
* Delays in sharing documents between agencies
* Repetitive manual case analysis
* Challenges in maintaining evidence history
* Risk of document tampering
* Limited transparency for citizens
* Inefficient coordination between police and judiciary

ANVESHAK addresses these challenges through a centralized, secure, and intelligent digital platform.

---

## ✨ Core Features

### 👤 Citizen Portal

* Digital e-FIR registration
* FIR tracking
* Case status monitoring
* Access to case-related updates
* English and Hindi language support
* Smart FAQ search
* Secure authentication workflow

### 👮 Police & Investigation Dashboard

* View and manage assigned cases
* Create cases from FIR records
* Update case status
* Set case priority
* View case timelines
* Access authorized investigation information
* Cross-agency document sharing
* Investigation analytics

### 📁 Secure Evidence Vault

* Upload investigation documents
* Store digital evidence securely
* Maintain evidence metadata
* Track document history
* Support chain-of-custody workflows
* Restrict access to authorized users
* Verify document integrity

### ⚖️ Court & Judiciary Access

* Access authorized case records
* Review FIR information
* View submitted investigation documents
* Access relevant evidence
* Support secure document exchange
* Monitor case-related information

### 🤖 AI-Powered Case Analysis

ANVESHAK integrates Google Gemini to assist authorized users in understanding case information.

The AI analysis workflow can generate structured insights such as:

* Case summary
* Case classification
* Confidence score
* Severity
* Important keywords
* Key information
* Investigation timeline
* Relevant case details

This helps reduce repetitive manual analysis and allows users to quickly understand large amounts of case information.

> AI-generated outputs are intended to assist authorized users and do not replace official investigation, legal, or judicial decisions.

### 🔐 Authentication & Authorization

* JWT-based authentication
* Role-based access control
* Password hashing
* Protected API routes
* Secure user sessions
* OTP verification workflow
* Authorization-based access to sensitive information

### ⛓️ Blockchain-Based Integrity

Blockchain-related functionality supports the integrity and traceability of digital documents.

The system is designed to support:

* Document hash verification
* Tamper-evident records
* Evidence integrity
* Transparent verification history
* Trustworthy digital documentation

### 📊 Smart Search & Analytics

* Search by case ID
* Search by FIR ID
* Search using keywords
* Filter by case status
* Filter by priority
* Search case categories
* Case statistics
* Investigation analytics
* Data visualization

### ⚡ Real-Time Updates

* Socket.IO integration
* Real-time communication support
* Live case-related updates
* Improved coordination between authorized users

---

## 🧩 User Roles

| User Role            | Main Capabilities                            |
| -------------------- | -------------------------------------------- |
| Citizen              | Register FIRs, track cases, view updates     |
| Police Officer       | Manage cases, investigate, upload evidence   |
| Investigation Agency | Access and share authorized case information |
| Court / Judiciary    | Review authorized case records and documents |
| Administrator        | Manage platform-level operations             |

Access to features is controlled according to the user's role and authorization.

---

## 🛠️ Technology Stack

### Frontend

* React
* Vite
* Tailwind CSS
* React Router
* Lucide React
* React Simple Maps
* D3 Geo
* TopoJSON
* Socket.IO Client

### Backend

* Node.js
* Express.js
* MongoDB
* Mongoose
* Socket.IO
* JSON Web Tokens
* bcryptjs
* Multer
* Sharp
* PDF-Lib
* CORS
* dotenv

### Artificial Intelligence

* Google Gemini API
* `@google/genai`
* AI-powered case summarization
* Case classification
* Severity analysis
* Keyword extraction
* Timeline generation

### Database

* MongoDB Atlas
* Mongoose ODM

### Security

* JWT authentication
* Password hashing
* Role-based authorization
* Protected routes
* Environment variable configuration
* Document integrity verification

### Deployment

* Vercel
* Node.js-compatible backend hosting
* MongoDB Atlas

---

## 🏗️ System Architecture

```text
                         ┌──────────────────────┐
                         │       Citizens       │
                         └──────────┬───────────┘
                                    │
                         ┌──────────▼───────────┐
                         │   ANVESHAK Frontend  │
                         │    React + Vite      │
                         └──────────┬───────────┘
                                    │
                           REST APIs / WebSockets
                                    │
                         ┌──────────▼───────────┐
                         │   Node.js + Express  │
                         │      Backend         │
                         └──────┬──────┬────────┘
                                │      │
                  ┌─────────────┘      └─────────────┐
                  │                                  │
        ┌─────────▼─────────┐             ┌──────────▼─────────┐
        │   MongoDB Atlas   │             │   Google Gemini AI │
        │ Users, Cases, FIRs│             │ Case Intelligence  │
        └───────────────────┘             └────────────────────┘
                  │
        ┌─────────▼─────────┐
        │ Blockchain Layer  │
        │ Document Integrity│
        └───────────────────┘
```

---

## 📂 Project Structure

```text
ANVESHAK/
│
├── public/
│   ├── logo.jpg
│   ├── favicon.svg
│   ├── icons.svg
│   └── slider/
│
├
```
