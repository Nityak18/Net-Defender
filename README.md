# 🛡️ Defense Matrix NIDS (Full-Stack Machine Learning NIDS)

![Status](https://img.shields.io/badge/Status-Active-00c896?style=for-the-badge)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Flask](https://img.shields.io/badge/Flask-000000?style=for-the-badge&logo=flask&logoColor=white)
![Python](https://img.shields.io/badge/Python_3.11-3776AB?style=for-the-badge&logo=python&logoColor=white)
![Machine Learning](https://img.shields.io/badge/Scikit--Learn-F7931E?style=for-the-badge&logo=scikit-learn&logoColor=white)
![Framer Motion](https://img.shields.io/badge/Framer_Motion-0055FF?style=for-the-badge&logo=framer&logoColor=white)

An enterprise-grade **Network Intrusion Detection System (NIDS)** powered by a real-time Scikit-Learn **Random Forest Classifier**. Built with an elite, lightweight glassmorphism React interface and a secure, session-managed Python Flask backend.

---

## ✨ Core Features

*   **🧠 Real Machine Learning Engine:** Utilizes a highly trained Random Forest model boasting a **99.74% inference accuracy** measured against the legendary `NSL-KDD` intrusion dataset.
*   **🔒 Secure Authorized API:** The Python backend requires cryptographically strong JWT/Session hashes (`Bearer` tokens via SQLite) preventing unauthorized payload scanning.
*   **📡 Live Stream Inference:** A continuous Web-monitor component proxying real-time network parameter objects to the ML backend in <120ms intervals.
*   **📂 Bulk CSV Processing:** A drag-and-drop feature enabling analysts to process thousands of raw traffic logs natively in the browser against the backend.
*   **💎 Elite UI/UX:** Forged using TailwindCSS and Framer Motion physics. Ultra-sleek page sliding effects, layout glides, frosted glass panels, and deep radial color tones dynamically shift based on network danger levels.

---

## 🖥️ Dashboard Modules

The React interface is split into 5 highly specialized analytical views:

1.  **System Dashboard:** High-level overview rendering real-time SVG line charts tracking network volume and an interactive donut chart breaking down threat distributions.
2.  **Packet Analyzer:** A manual inspection form mapping directly to the NSL-KDD matrix. Includes a **Bulk CSV Downloader** allowing analysts to batch-test thousands of static `.csv` packets against the live API locally.
3.  **Live Monitor:** Simulates active network traffic with continuous API fetching. Features strict thresholds that automatically trigger warning banners if the anomaly rate exceeds 30%.
4.  **Alerts Center:** An incident response management queue. Threats detected globally across the app append here as actionable severity tickets.
5.  **Model Info:** Educational glossary exploring the exact architecture of the classification algorithm, payload engineering parameters, and attack taxonomies.

---

## 🏗️ Architecture

This application operates on a decoupled Full-Stack layout:

1.  **Frontend (React/Vite):** Runs on `localhost:5173`. Handles the presentation layer, session management, and asynchronous data batching.
2.  **Backend (Python/Flask):** Runs on `localhost:5000`. Operates the SQLite security matrix (`nids.db`) and handles complex `pandas` label-encoding before passing strings into the loaded `joblib` Random Forest Matrix.

---

## 🚀 Getting Started

### Prerequisites
You must have **Node.js (v20+)** and **Python (v3.11+)** installed.

### 1. Start the Python API & ML Engine
Ensure you have the required dependencies installed (Flask, Flask-CORS, Flask-SQLAlchemy, Scikit-Learn, Pandas, Numpy, Joblib).
```bash
cd backend

# On the very first run, download the dataset and train the weights globally:
python train_model.py

# Once the .pkl files are generated, boot the API:
python app.py
```
> *The backend will automatically spawn a local `sqlite` database and seed a demo user.*

### 2. Start the React Interface
Open a second terminal window in the root directory.
```bash
# Install NPM dependencies
npm install

# Start the Vite development server
npm run dev
```

### 3. Demo Access Credentials
When you navigate to `http://localhost:5173`, the system will intercept you at the NIDS Gateway. Use the pre-seeded credentials to unlock the interface:
*   **Identifier:** `admin`
*   **Passphrase:** `admin123`

---

## 🧬 Threat Taxonomy / Known Signatures

The active Random Forest classifier is capable of determining 4 major threat categories mathematically, independent of heuristic rules:
1.  **Denial of Service (DoS):** (e.g., *Neptune, Smurf*) Identifying massive bandwidth consumption or connection-rate spikes.
2.  **Probing:** (e.g., *IPsweep, Nmap*) Identifying vulnerability mapping techniques.
3.  **R2L (Remote to Local):** (e.g., *Guess_Passwd, FTP_Write*) Identifying brute-force and remote payload dropping.
4.  **U2R (User to Root):** (e.g., *Buffer_Overflow*) Identifying privilege escalation patterns.

---

## 🛠️ Built With

*   **Vite & React** - Frontend architecture runtime
*   **Tailwind CSS v4** - Styling engine and custom layout configuration
*   **Framer Motion** - 60fps physics animations and routing glides
*   **Recharts** - Dynamic, reactive SVG chart rendering
*   **Flask & SQLAlchemy** - Fast HTTP microframework and ORM layer
*   **Scikit-Learn** - Primary ML mathematical backend 

*Developed as a premier Full-Stack cybersecurity administration tool.*
