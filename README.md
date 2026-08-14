# BlackTeal (Version 2)

BlackTeal is a modern, high-performance Operator Console and Telemetry Dashboard designed for Battery Energy Storage Systems (BESS). 

This project simulates a real-time site topology and renders live telemetry feeds, equipment statuses, and alarm systems in a clean, highly responsive user interface.

## 🚀 Features
- **Live Telemetry Dashboard**: Real-time simulation of power skids, batteries, and substations.
- **Site Topology Map**: An interactive SVG-based single-line diagram of the site's electrical flow.
- **Dynamic Alarms Table**: Grouped and ranked fault detection based on severity.
- **Scenario Controls**: Inject faults or drop connections to test system resilience and UI responsiveness.

## 🛠️ Tech Stack
- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS + custom glassmorphism components
- **Animations**: GSAP
- **Code Quality**: Oxlint + Strict TypeScript

## 📦 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Development Server
```bash
npm run dev
```
Open your browser to `http://localhost:5173` to view the console.

### 3. Build for Production
```bash
npm run build
```
This will run strict type checks, linting, and output a highly optimized production bundle to the `/dist` folder.
