<div align="center">

  <img src="./public/logo.jpg" alt="ANVESHAK Logo" width="180"/>

  # ANVESHAK
  ### National Justice Network

  **Secure Digital Document Management System for Legal & Investigation Documents**

  <p>
    <i>One Nation. One Justice Network.</i>
  </p>

  <p>
    <a href="https://anveshak-885p245yf-khushi-singh-collabs-projects.vercel.app/">
      <img src="https://img.shields.io/badge/Live%20Demo-Visit%20Website-ff9933?style=for-the-badge&logo=vercel&logoColor=white" alt="Live Demo"/>
    </a>
    <a href="https://github.com/Khushi-Verse/Anveshak-new">
      <img src="https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github" alt="GitHub"/>
    </a>
  </p>

  <p>
    <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black"/>
    <img src="https://img.shields.io/badge/Node.js-Backend-339933?style=flat-square&logo=node.js&logoColor=white"/>
    <img src="https://img.shields.io/badge/Express.js-API-000000?style=flat-square&logo=express"/>
    <img src="https://img.shields.io/badge/MongoDB-Database-47A248?style=flat-square&logo=mongodb&logoColor=white"/>
    <img src="https://img.shields.io/badge/Google%20Gemini-AI-4285F4?style=flat-square&logo=google"/>
    <img src="https://img.shields.io/badge/Blockchain-Secured-8A2BE2?style=flat-square"/>
  </p>

</div>

---

## 🏛️ About ANVESHAK

**ANVESHAK** is a secure, unified digital justice platform designed to streamline the management, sharing, tracking, and analysis of legal and investigation-related documents.

The platform connects citizens, police departments, investigating agencies, and courts through a centralized digital ecosystem.

It addresses the fragmentation of India's justice infrastructure by providing a secure environment for:

- Digital FIR registration
- Case tracking
- Evidence management
- Cross-agency collaboration
- Court document access
- AI-powered case analysis
- Blockchain-backed document integrity
- Transparent audit trails

ANVESHAK is designed around the vision of:

> **"One Nation. One Justice Network."**

---

## 🎯 Problem Statement

Legal and investigation workflows often involve multiple disconnected systems, departments, and documentation channels.

This creates challenges such as:

- Fragmented case information
- Delayed inter-department communication
- Difficulty tracking FIR and case progress
- Risk of document tampering
- Lack of transparent evidence history
- Repetitive manual document analysis
- Limited accessibility for citizens
- Inefficient coordination between police and judiciary

ANVESHAK aims to solve these problems through a unified, secure, and intelligent digital platform.

---

## ✨ Key Features

### 👤 Citizen Portal

- Digital e-FIR registration
- FIR status tracking
- Case progress monitoring
- Bilingual interface with English and Hindi support
- Smart FAQ and justice-related search
- Secure citizen authentication
- Easy access to case-related information

### 👮 Police & Investigation Dashboard

- Centralized case management
- View assigned and active cases
- Create cases from registered FIRs
- Update case status and priority
- Cross-agency case sharing
- Inter-department collaboration
- Secure evidence access
- Detailed case timelines
- Audit trail visibility

### 📁 Secure Evidence Vault

- Upload investigation documents
- Secure digital evidence storage
- Evidence metadata management
- Chain-of-custody tracking
- Document integrity verification
- Controlled access to sensitive files
- Tamper-evident document records

### ⚖️ Judiciary & Court Access

- View case information
- Access FIR and investigation documents
- Review submitted evidence
- Monitor case proceedings
- Secure document exchange between departments

### 🤖 AI-Powered Case Analysis

ANVESHAK integrates Google Gemini-powered analysis to assist investigators with structured case intelligence.

The AI analysis can generate:

- Case summary
- Case classification
- Confidence score
- Severity assessment
- Important keywords
- Key information
- Investigation insights
- Event timeline
- Potentially relevant details from documents

This reduces repetitive manual analysis and helps officers quickly understand large volumes of case information.

> AI-generated insights are intended to assist authorized users and do not replace official investigation or judicial decisions.

### 🔐 Secure Authentication

- JWT-based authentication
- Role-based access control
- Secure password hashing
- OTP-based verification support
- Officer identity verification workflow
- Protected API routes
- Session-based authorization

### ⛓️ Blockchain Integration

Blockchain-based mechanisms are used to support document integrity and traceability.

The system is designed to maintain:

- Tamper-evident document records
- Document hash verification
- Evidence integrity
- Transparent verification history
- Improved trust in digital documentation

### 📊 Smart Search & Analytics

- Search cases using case ID
- Search FIR records
- Search by keywords
- Search by case status
- Search by priority
- Search by category
- Case analytics dashboard
- State-level data visualization
- Investigation statistics

### 🌐 Real-Time Communication

- Real-time updates using Socket.IO
- Inter-department communication support
- Live case-related updates
- Improved coordination between authorized users

---

## 🖥️ Platform Roles

ANVESHAK supports multiple user roles with role-specific dashboards.

| Role | Capabilities |
|------|--------------|
| Citizen | Register FIRs, track cases, view updates |
| Police Officer | Manage cases, investigate, upload evidence |
| Investigation Agency | Share and access authorized case information |
| Court / Judiciary | Review cases and submitted documents |
| Administrator | Manage platform-level operations |

Each role receives access only to the functionality permitted by its authorization level.

---

## 🧠 System Architecture

```text
                         ┌──────────────────────┐
                         │      Citizens        │
                         └──────────┬───────────┘
                                    │
                         ┌──────────▼───────────┐
                         │   ANVESHAK Frontend  │
                         │ React + Vite + UI    │
                         └──────────┬───────────┘
                                    │
                          REST APIs / WebSockets
                                    │
                         ┌──────────▼───────────┐
                         │   Node.js + Express  │
                         │     Backend API      │
                         └──────┬─────┬────────┘
                                │     │
                 ┌──────────────┘     └──────────────┐
                 │                                   │
       ┌─────────▼─────────┐              ┌──────────▼─────────┐
       │   MongoDB Atlas   │              │   Google Gemini AI │
       │ Case & User Data  │              │ Case Intelligence │
       └───────────────────┘              └────────────────────┘
                 │
       ┌─────────▼─────────┐
       │ Blockchain Layer  │
       │ Document Integrity│
       └───────────────────┘
