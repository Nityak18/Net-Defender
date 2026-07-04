<div align="center">

# 🛡️ Net Defender
### Full-Stack ML Network Intrusion Detection System

<br/>

![Status](https://img.shields.io/badge/Status-Active-00c896?style=for-the-badge&labelColor=0a0a0a)
![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Flask](https://img.shields.io/badge/Flask-000000?style=for-the-badge&logo=flask&logoColor=white)
![Python](https://img.shields.io/badge/Python_3.11-3776AB?style=for-the-badge&logo=python&logoColor=white)
![Scapy](https://img.shields.io/badge/Scapy-Live_Sniffer-00c896?style=for-the-badge&labelColor=0a0a0a)
![ML](https://img.shields.io/badge/Scikit--Learn-99.74%25_Accuracy-F7931E?style=for-the-badge&logo=scikit-learn&logoColor=white)
![Framer](https://img.shields.io/badge/Framer_Motion-0055FF?style=for-the-badge&logo=framer&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS_v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)

<br/>

> **An enterprise-grade Network Intrusion Detection System** powered by a real-time Scikit-Learn Random Forest Classifier, hardware-level Scapy packet sniffing, and a blazing-fast Server-Sent Events (SSE) live stream — wrapped in a premium glassmorphism React dashboard.

</div>

---

## 🚀 What Makes This Different

This isn't a toy demo. Every layer of the stack is production-grade:

| Layer | Technology | Role |
|---|---|---|
| 🖥️ **Frontend** | React 19 + Vite + Framer Motion | Glassmorphism dashboard, SSE stream consumer |
| 🐍 **Backend** | Python Flask + SQLAlchemy | Secure REST API, ML inference engine |
| 🧠 **ML Model** | Scikit-Learn Random Forest | 99.74% accuracy on NSL-KDD dataset |
| 📡 **Live Capture** | Scapy + Npcap | Real hardware-level packet sniffing |
| 🔁 **Streaming** | Server-Sent Events (SSE) | Sub-100ms live inference pipeline |
| 🔐 **Auth** | SQLite + Bearer Tokens | Cryptographic session management |

---

## ✨ Feature Highlights

### 🧠 Machine Learning Engine
- **Random Forest Classifier** trained on the legendary **NSL-KDD** dataset
- **99.74% inference accuracy** across 4 major threat categories
- 16-feature vector extraction: `duration`, `protocol_type`, `service`, `flag`, `src_bytes`, `dst_bytes`, `count`, `srv_count`, and more
- `scikit-learn` Pipeline with `LabelEncoder` + `RandomForestClassifier`
- Model weights serialized via `joblib` (`.pkl`) for instant cold-boot loading

### 📡 Real-Time Hardware Packet Sniffing *(New)*
- **Scapy daemon** runs as a background thread inside Flask on startup
- Dynamically discovers the **active network interface** (Wi-Fi or Ethernet) via `conf.route`
- Extracts statistical features from every live packet:
  - Packet size, protocol (TCP/UDP/ICMP), service port mapping
  - TCP flag analysis (`SF`, `S0`, `REJ`, `RSTO`)
  - Flow duration tracking with a lightweight **TCP/UDP flow tracker**
  - Connection rate metrics (`count`, `srv_count`, `same_srv_rate`, `diff_srv_rate`)
- **No hardware modification** — 100% read-only passive capture

### 🔁 Server-Sent Events (SSE) Live Stream *(New)*
- Flask `/api/live_stream` endpoint pushes inferred packet JSON to all connected clients in real-time
- React `EventSource` consumes the stream and renders packets to the Live Monitor table instantly
- **Zero polling** — pure push-based architecture
- Automatic threat escalation: if attack density in last 10 packets exceeds **30%**, a critical alert banner fires

### 🔐 Secure Authentication System
- Token-based auth via **SQLite** (`nids.db`) — no JWT libraries required
- `Bearer` token in `Authorization` header + query param support (for SSE connections)
- Session tokens regenerated on every login
- Auto-logout with token invalidation on the backend
- Pre-seeded demo admin account on first boot

### 📂 Bulk CSV Processing *(Enhanced)*
- **Real drag-and-drop** with animated border feedback — not just visual, fully functional
- Supports **NSL-KDD / KDD99 column format** (41-column) with automatic header row detection
- Processes up to **50 rows per batch** — each row sent to the Flask ML API individually
- **Summary stats panel** after processing: Total / Normal / Attacks / API Errors
- Error state clearly shows `API OFFLINE` (styled to match dark theme) instead of silent failures
- Re-select the same file without refreshing — input value reset on each pick
- Animated row entrance in results table

### 💎 Premium UI / UX
- **Glassmorphism panels** with `backdrop-blur` and layered transparency
- **Framer Motion** physics: page slide transitions, layout animations, micro-hover effects
- Dark radial color system: `accentPrimary` (teal glow) + `accentDanger` (red pulse)
- Threat-reactive UI — the entire interface shifts tone when attacks are detected
- `cyber-glow` and `cyber-glow-danger` shadow utilities on critical elements
- Animated confidence bars, staggered table row entrances, pulsing status badges

---

## 🖥️ Dashboard Modules

```
┌─────────────────────────────────────────────────────────────────┐
│  🔐 NIDS Gateway Login                                           │
│  ↓ (Bearer Token Issued)                                         │
├──────────────┬──────────────────────────────────────────────────┤
│  Sidebar Nav │  1. 📊 System Dashboard                          │
│              │  2. 🔬 Packet Analyzer  ← Manual + Bulk CSV      │
│              │  3. 📡 Live Monitor     ← SSE + Scapy Stream     │
│              │  4. 🚨 Alerts Center    ← Incident Queue          │
│              │  5. 🧬 Model Info       ← Architecture Glossary  │
└──────────────┴──────────────────────────────────────────────────┘
```

| # | Module | Description |
|---|--------|-------------|
| 1 | **System Dashboard** | Real-time SVG line charts for network volume + threat distribution donut chart |
| 2 | **Packet Analyzer** | 16-feature manual form with sample presets + Bulk CSV upload with drag-and-drop |
| 3 | **Live Monitor** | SSE-powered real-time table fed by hardware Scapy packet sniffing |
| 4 | **Alerts Center** | Incident response queue — auto-populated by both manual and live detections |
| 5 | **Model Info** | Explore the Random Forest architecture, feature weights, and attack taxonomy |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│  BROWSER (React + Vite)  →  localhost:5173                              │
│                                                                          │
│   EventSource ──────────────────────────────────┐                       │
│   fetch('/api/predict')  ──────────────┐        │                       │
│   fetch('/api/login')    ──────────┐   │        │                       │
└───────────────────────────────────┼───┼─────────┼───────────────────────┘
                                    │   │         │
                            HTTPS / REST + SSE    │
                                    │   │         │
┌───────────────────────────────────┼───┼─────────┼───────────────────────┐
│  FLASK BACKEND  →  localhost:5000 │   │         │                       │
│                                   ▼   ▼         │                       │
│  /api/login   → SQLite Auth    ┌─────────────┐  │                       │
│  /api/predict → ML Inference   │  Flask App  │  │                       │
│  /api/live_stream → SSE Push ◄─┤  (app.py)   │──┘                       │
│  /api/sniffer_status           └──────┬──────┘                          │
│                                       │                                  │
│              ┌────────────────────────┤                                  │
│              ▼                        ▼                                  │
│  ┌─────────────────────┐   ┌────────────────────────┐                  │
│  │  Random Forest .pkl  │   │  Scapy Sniffer Thread  │                  │
│  │  + LabelEncoders.pkl │   │  (feature_extractor.py)│                  │
│  │  (scikit-learn)      │   │  → FlowTracker         │                  │
│  └─────────────────────┘   │  → process_packet()     │                  │
│                             └────────────────────────┘                  │
│                                       │                                  │
│                              NIC / Network Card                          │
│                           (Live Packet Capture)                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Getting Started

### Prerequisites

| Requirement | Version | Notes |
|---|---|---|
| Node.js | v20+ | For the React frontend |
| Python | v3.11+ | For the Flask backend |
| Npcap | Latest | **Required** for live packet capture on Windows |
| Admin Rights | — | **Required** to run Scapy on Windows |

### Step 1 — Install Python Dependencies

```bash
pip install flask flask-cors flask-sqlalchemy werkzeug scikit-learn pandas numpy joblib scapy
```

### Step 2 — Train the ML Model *(First Run Only)*

```bash
cd backend
python train_model.py
```

> Downloads the NSL-KDD dataset, trains the Random Forest classifier, and saves `nsl_kdd_rf_model.pkl` + `label_encoders.pkl` to the project root.

### Step 3 — Start the Flask Backend

> ⚠️ **Run as Administrator** for live Scapy packet capture to work!

```bash
# Right-click your terminal → "Run as Administrator", then:
cd backend
python app.py
```

On startup you will see:
```
============================================================
  NIDS Backend Server - Startup Diagnostics
============================================================
  Model Loaded:     YES
  Scapy Available:  YES
  Admin Privileges: YES
  Npcap Driver:     FOUND
============================================================
  Sniffer thread launched successfully!
```

### Step 4 — Start the React Frontend

Open a second terminal:

```bash
npm install
npm run dev
```

### Step 5 — Login

Navigate to `http://localhost:5173` and use the pre-seeded credentials:

```
Identifier : admin
Passphrase : admin123
```

---

## 📡 Live Sniffer Requirements (Windows)

The hardware packet sniffer requires two things on Windows:

| Requirement | How to Get It |
|---|---|
| **Npcap Driver** | Download from [npcap.com](https://npcap.com/#download) and install |
| **Admin Rights** | Right-click VS Code / Terminal → *Run as Administrator* |

> If either requirement is unmet, the Live Monitor will display a diagnostic banner listing exactly what is missing. The rest of the app (Manual Analyzer, Bulk CSV, Alerts) continues to work normally.

---

## 🧬 Threat Taxonomy

The Random Forest model detects **4 major intrusion categories** — purely from statistical network features, without signature rules:

| Category | Examples | Detection Signal |
|---|---|---|
| **DoS** (Denial of Service) | Neptune, Smurf, Land | Massive `src_bytes` spike, zero `dst_bytes`, high `count` |
| **Probe** | IPsweep, Nmap, Portsweep | High `diff_srv_rate`, low `same_srv_rate`, many unique services |
| **R2L** (Remote to Local) | Guess_Passwd, FTP_Write | High `num_failed_logins`, `su_attempted = 1` |
| **U2R** (User to Root) | Buffer_Overflow, Rootkit | Low traffic volume + `su_attempted` + `logged_in` state |

---

## 🛠️ Tech Stack

```
Frontend                    Backend                     ML Pipeline
─────────────────────       ─────────────────────       ─────────────────────
React 19                    Python 3.11                 Scikit-Learn
Vite 8                      Flask                       Random Forest (500 trees)
TailwindCSS v4              Flask-CORS                  LabelEncoder (3 features)
Framer Motion               Flask-SQLAlchemy            Pandas DataFrame
Recharts                    Werkzeug (Auth)             NumPy
Lucide React                Scapy (Sniffer)             Joblib (.pkl serialization)
EventSource (SSE)           SQLite (nids.db)            NSL-KDD Dataset
```

---

---

<div align="center">

**Built as a premier Full-Stack Cybersecurity Research Platform**

*Real packets · Real ML · Real-time*

</div>
