# FitBuddy - AI 7-Day Fitness Plan Generator (Powered by Gemini AI)

FitBuddy is an intelligent, full-stack fitness and nutrition protocol generator built with **Google Gemini AI**, **React 19**, **TypeScript**, **Tailwind CSS**, and **Express**.

It personalizes 7-day workout splits, provides goal-tailored nutrition and recovery advice, supports real-time plan refinement using feedback, generates clean printable PDFs, and includes an admin dashboard to monitor all clients.

---

## 🚀 Quick Start in VS Code

### 1. Open in VS Code
1. Extract the downloaded ZIP file to your desired folder.
2. Open **VS Code** and select **File > Open Folder...**, then select the extracted `fitbuddy-project` directory.

### 2. Install Dependencies
Open the VS Code integrated terminal (`Ctrl + \`` or `Cmd + \``) and run:
```bash
npm install
```

### 3. Configure Gemini API Key
1. Copy the `.env.example` file to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Open `.env` and insert your Gemini API Key from Google AI Studio:
   ```env
   GEMINI_API_KEY="YOUR_GEMINI_API_KEY_HERE"
   PORT=3000
   ```
   *(Get your free API key at [aistudio.google.com](https://aistudio.google.com/app/apikey))*

### 4. Run the Application
Start the development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser!

---

## 📁 Project Architecture

```
├── server.ts                 # Express backend with Gemini AI endpoints and local JSON DB
├── index.html                # Entry point with Google Fonts and print-friendly styles
├── package.json              # Project dependencies and npm scripts
├── tsconfig.json             # TypeScript configuration
├── vite.config.ts            # Vite configuration with Tailwind CSS plugin
├── .env.example              # Sample environment configuration
│
└── src/
    ├── main.tsx              # React application entry point
    ├── App.tsx               # Root application component and tab navigation
    ├── index.css             # Tailwind v4 styles and print-to-PDF stylesheet (@media print)
    ├── types.ts              # TypeScript interfaces for users, plans, and exercises
    │
    ├── components/
    │   ├── Navbar.tsx        # Navigation bar with active plan badges & ZIP download
    │   ├── GeneratorForm.tsx # User intake form (Name, Age, Weight, Goal, Intensity)
    │   ├── PlanView.tsx      # 7-day schedule view, interactive checkboxes, feedback editor & PDF export
    │   └── AdminDashboard.tsx# Coach overview table, search, filters & comparison modal
    │
    └── utils/
        └── pdfGenerator.ts   # Vector PDF generation using jsPDF
```

---

## 🛠 Features

- **Scenario 1 - AI Plan Generator**: Creates a structured day-by-day 7-day routine tailored to goal (Weight Loss, Muscle Gain, etc.) and intensity (Low, Medium, High).
- **Scenario 2 - Plan Revisions via Feedback**: Revise workout routines dynamically (e.g. "Add yoga", "Reduce high impact jumps") using Gemini AI.
- **Scenario 3 - Goal-Targeted Nutrition & Recovery**: Practical tips on protein, hydration, caloric balance, and sleep.
- **Scenario 4 - Admin / Coach Dashboard**: View client lists, search, compare original vs. revised plans, and delete records.
- **Export Options**:
  - **Download PDF**: Uses the print-friendly stylesheet to trigger a clean PDF save via the browser.
  - **Direct File Export**: Generates vector PDF directly via `jsPDF`.
  - **Copy Plan**: Markdown clipboard export.

---

## 📦 Production Build
```bash
npm run build
npm start
```
