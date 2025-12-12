# 🚤 AquaBot Prime - SIH 2025
**Autonomous Water Quality Monitoring & Navigation System**

---

## 📖 What Your Project Does
AquaBot Prime is an intelligent, self-driving boat that autonomously patrols water bodies (lakes, rivers, ponds) to monitor water quality in real-time. Unlike standard sensors that only measure acidity or clarity, AquaBot uses **advanced spectral analysis** to "see" the chemical fingerprint of the water. It can distinguish between **Microplastics, Algae Blooms, and Organic Waste**, mapping these pollutants to specific GPS coordinates on a live dashboard.

---

## 🚩 Problem Statement
Water pollution is one of the most critical challenges today, yet testing methods remain outdated:
1.  **Manual Sampling is Slow:** Collecting samples by hand is labor-intensive, time-consuming, and cannot cover large areas efficiently.
2.  **Limited Data:** Standard sensors (pH, Turbidity) only give a general idea of quality. They cannot tell you *what* is polluting the water (e.g., distinguishing between green algae and green chemical dye).
3.  **Safety Risks:** Manually accessing polluted or deep water bodies poses health and safety risks to humans.
4.  **Lack of Spatial Data:** Static sensors only measure one spot, missing pollution sources located just a few meters away.

---

## 💡 Our Solution
We have developed an **Autonomous Surface Vehicle (ASV)** that solves these problems by combining Robotics, IoT, and Machine Learning:
* **Automated Patrolling:** The boat follows a programmed path or explores autonomously, covering large areas without human intervention.
* **Spectral Fingerprinting:** Using the AS7265X Triad Sensor (18-channel spectroscopy), we analyze light absorption to identify specific contaminants like **Microplastics** and **Harmful Algae Blooms (HABs)**.
* **Real-Time Mapping:** Every data point is tagged with a GPS coordinate, generating a live "Heat Map" of pollution on the dashboard.
* **Resilience:** The system detects hardware faults (like sensor disconnection) and attempts to self-repair via software auto-reconnect loops.

---

## 🚀 Key Features

### 1. 🧠 AI-Powered Pollutant Detection
Uses a specialized Machine Learning algorithm to classify water quality into four categories based on spectral signatures:
* **Clean Water**
* **Microplastic Debris** (High NIR reflection)
* **Algae Bloom** (High Visible Green reflection)
* **CDOM / Organic Waste** (High UV reflection)

### 2. 🌍 Live GPS Tracking & Mapping
* Integrates **NEO-6M GPS** to track the boat's live position.
* Visualizes the boat's path and pollution data on an interactive **OpenStreetMap** dashboard.

### 3. 🤖 Autonomous Navigation
* Equipped with **Ultrasonic Sensors** to detect obstacles up to 4 meters away.
* Implements a **Smart Avoidance Algorithm** (Stop $\rightarrow$ Scan Right $\rightarrow$ Scan Left $\rightarrow$ Choose Clear Path).

### 4. 📊 Comprehensive Dashboard
* Displays live graphs for **pH, Turbidity, Temperature, and Spectral bands**.
* Provides instant alerts for "Acidic Water" or "High Pollution" events.

---

## 🛠️ Technology Stack
* **Hardware:** ESP8266 NodeMCU, NEO-6M GPS, AS7265X Spectral Sensor, L298N Motor Driver, HC-SR04 Ultrasonic.
* **Frontend:** React.js, Recharts (Data Visualization), Leaflet Maps (Navigation).
* **Backend:** Node.js, Express.js.
* **Database:** MongoDB Atlas (Cloud Storage).

---

## 🔌 Hardware Pin Configuration
**Caution:** Ensure the L298N ground is connected to the ESP8266 Ground.

| Component | ESP8266 Pin | Description |
| :--- | :--- | :--- |
| **GPS TX** | **RX (GPIO 3)** | **Unplug during code upload!** |
| **GPS RX** | **TX (GPIO 1)** | |
| **AS7265X SDA** | **D2 (GPIO 4)** | I2C Data |
| **AS7265X SCL** | **D1 (GPIO 5)** | I2C Clock |
| **Ultrasonic Trig** | **D5 (GPIO 14)** | |
| **Ultrasonic Echo** | **D6 (GPIO 12)** | |
| **Left Motor** | **D0, D4** | Via L298N (IN1, IN2) |
| **Right Motor** | **D7, D8** | Via L298N (IN3, IN4) |
| **pH Sensor** | **A0** | Analog Input |
| **Turbidity** | **D3 (GPIO 0)** | Digital Input |

---

## 💻 Steps to Run the Project

### 1. Hardware Setup (Firmware)
1.  Navigate to `project/Hardware_Code/`.
2.  Open `Boat_Code_Final.ino` in Arduino IDE.
3.  Install libraries: `TinyGPS++`, `SparkFun AS7265X`, `ESP8266WiFi`.
4.  Update the `serverUrl` with your laptop's IP address.
5.  **Unplug GPS TX wire**, upload code, then re-plug.

### 2. Backend Server
1.  Navigate to `project/Backend/`.
2.  Run `npm install`.
3.  Run `node server.js`.
4.  Server runs on: `http://localhost:3001`.

### 3. Frontend Dashboard
1.  Navigate to `project/water-boat-dashboard/`.
2.  Run `npm install`.
3.  Run `npm start`.
4.  Open `http://localhost:3000`.

---

## 👥 Team Information
Please refer to `team_info.txt` for detailed member roles and institute information.
