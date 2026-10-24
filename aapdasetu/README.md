# AapdaSetu Disaster OS 🚨
> **AI-Assisted Disaster Response and Transparent Rescue Prioritization Platform**  
> *Developed for Hackathon Presentation • Team Tech Innovators*

---

## 📌 Executive Summary

During severe climate disasters (such as the Brahmaputra floods in Assam, Wayanad landslides in Kerala, or coastal cyclones in Odisha), emergency switchboards and State Disaster Management Authorities (SDMAs) face intense information overload. First responders cannot afford to guess which community needs boats first.

**AapdaSetu** bridges the gap between field SOS signals and emergency dispatchers through:
1. **Interactive Operational GIS Map**: Powered by Leaflet.js & OpenStreetMap with custom tactical markers.
2. **Transparent AI Rescue Priority Engine (XAI)**: An open-box, multi-criteria mathematical scoring model that produces deterministic, verifiable urgency ratings (0–100%) without hallucination.
3. **Structured Ingestion Stream & Status Tracking**: Live triage workflow transitioning incidents from *Reported* $\to$ *Verified* $\to$ *Resolved*.
4. **Air-Gapped & 2G SMS Protocol**: Architecture designed for remote zones where high-speed internet fails.

---

## 🛠️ Technology Stack (Beginner-Friendly & Hackathon-Ready)

We selected a zero-dependency, ultra-reliable web technology stack:

| Component | Technology | Why Chosen for Beginners & Hackathons |
| :--- | :--- | :--- |
| **Frontend UI** | HTML5 + CSS3 (Grid & Flexbox) | Zero build tools required. Runs immediately in any browser with zero `npm install` failures or version mismatch bugs. |
| **Design System** | Dark Command-Center Theme | Professional, mission-critical aesthetic inspired by real National Disaster Management dashboards. Fully responsive. |
| **Mapping Engine** | Leaflet.js (v1.9.4) + OpenStreetMap | Free, open-source, no billing or proprietary API keys required. Includes offline fallback support. |
| **AI Priority Engine**| Vanilla ES6 JavaScript (Explainable AI) | High-speed, deterministic mathematical model. Judges can inspect the exact formula rather than trusting a simulated black box. |
| **Data Persistence** | Browser `localStorage` API | Persists newly injected field incidents and status updates across browser refreshes without complex database setup. |
| **Local Server** | PowerShell .NET `HttpListener` / Batch | Single-click Windows launcher (`run-server.bat`) or direct file opening. |

---

## 🧠 The Explainable AI (XAI) Rescue Priority Formula

Traditional emergency response suffers from either manual triage delays or opaque AI models. AapdaSetu uses an explainable, weighted multi-factor formula:

$$\text{Urgency Score} = (0.35 \times S) + (0.30 \times P) + (0.20 \times M) + (0.15 \times R)$$

### 1. Disaster Severity ($S$ — 35% Weight)
* **Critical (100 pts)**: Active embankment breach, rapid torrent submergence, structural collapse.
* **High (75 pts)**: Highway transit severance, rising water levels, severe mudflow.
* **Moderate (50 pts)**: Localized inundation, strong gale winds, culvert damage.
* **Minor (25 pts)**: Controlled drainage overflow, tree falls, precautionary warnings.

### 2. Population at Risk ($P$ — 30% Weight)
* $\ge 500$ people: **100 pts**
* $250 - 499$ people: **90 pts**
* $100 - 249$ people: **75 pts**
* $50 - 99$ people: **60 pts**
* $20 - 49$ people: **45 pts**
* $< 20$ people: **20 pts**

### 3. Medical Access & Entrapment ($M$ — 20% Weight)
* **Trapped / Zero Egress (100 pts)**: Completely surrounded by surging water or landslide debris with no escape.
* **Critical Injuries (85 pts)**: Casualties requiring trauma triage, severe hypothermia risk.
* **Delayed Egress (60 pts)**: Hospital access severed for 6–12 hours.
* **Stable (25 pts)**: First aid supplies available, ambulatory individuals.

### 4. Source Trust & Verification ($R$ — 15% Weight)
* **NDRF / SDRF Official Control Room (100 pts)**: Verified government sensor & operator dispatches.
* **Verified First Responder / Medical Officer (85 pts)**: Red Cross, doctor on-site, licensed amateur radio operator.
* **Multi-Citizen Geo-Tagged Posts (65 pts)**: Cross-referenced citizen eyewitness reports.
* **Single Unverified Social Post (40 pts)**: Unconfirmed signal awaiting verification.

### Priority Tiers:
* **CRITICAL ($\ge 75\%$)**: Tier 1 emergency. Immediate air/boat evacuation units dispatched.
* **HIGH ($50 - 74\%$)**: Tier 2 emergency. Medical staging & route clearance dispatched.
* **MODERATE ($25 - 49\%$)**: Tier 3. Relief supply distribution and telemetric monitoring.

---

## 🚀 How to Run the Project

### Option 1: Direct File Launch (Simplest for Beginners)
1. Navigate to:  
   `C:\Users\Aanandita Hizly\.gemini\antigravity\scratch\aapdasetu\`
2. Double-click **`index.html`** to open it directly in Google Chrome, Microsoft Edge, or Mozilla Firefox.

### Option 2: Run Local Web Server (Recommended for Hackathons)
1. Double-click **`run-server.bat`** (or open PowerShell in this directory and execute `.\start-server.ps1`).
2. Your browser will automatically open to:  
   **`http://localhost:8080/`**

---

## 🎯 Hackathon Presentation Script & Demo Flow

Here is a 3-minute pitch walkthrough you can follow in front of the judges:

1. **The Hook (30s)**:
   > *"Judges, during the annual Assam floods and Wayanad landslides, rescue teams receive thousands of frantic calls. But which location needs the amphibious boat first? Current systems rely on manual phone calls. We built **AapdaSetu Disaster OS** to solve this."*

2. **The Dashboard & Map (45s)**:
   > *"Here is our Command Center dashboard. In the center is a live OpenStreetMap powered by Leaflet.js. You can see red pulsating pins for active hazards and teal pins for relief shelters. Notice our Quick Jump buttons for Assam, Kerala, Odisha, and Himachal."*

3. **Explainable AI Engine (45s)**:
   > *"Select any card, such as the active route blockade in Assam. On the right, our Granular Telemetry & Co-Pilot displays the transparent AI Urgency Score: 92%. Unlike black-box models, we display the exact mathematical breakdown: Severity, Population at risk, Medical access, and Source trust."*

4. **Live Field SOS Injection (45s)**:
   > *"Watch how a field operator logs a new emergency: Click **'+ Inject Field SOS'**. As we adjust the number of people and medical access, watch the AI engine calculate the score in real time. We click Submit, and instantly the new pin drops onto the map, ready for SDMA verification."*

5. **Transparency & Safety Note (15s)**:
   > *"All ground feeds and telemetries in this demo are safely simulated so no false alarms are dispatched. The AI engine, map interactions, and triage logic are 100% operational."*

---

## 📂 Codebase Architecture

```
aapdasetu/
├── index.html            # Main semantic 3-panel command center dashboard
├── css/
│   └── style.css         # Modern dark command center UI, CSS variables & animations
├── js/
│   ├── priority-engine.js# Transparent AI Rescue Priority Engine (mathematical formula)
│   ├── data.js           # Seed data across India with localStorage persistence
│   ├── map.js            # Leaflet.js GIS map controller with custom SVG pins
│   └── app.js            # Application controller, modal handling, live previews
├── start-server.ps1      # Built-in PowerShell HTTP server
├── run-server.bat        # 1-click Windows server launcher
└── README.md             # Complete documentation and hackathon presentation guide
```
