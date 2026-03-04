# LockIn – Health & Fitness Desktop App

<p align="center">
  <img src="https://img.shields.io/badge/Electron-Desktop-blue?logo=electron" />
  <img src="https://img.shields.io/badge/React-Frontend-61DAFB?logo=react" />
  <img src="https://img.shields.io/badge/Node.js-Backend-339933?logo=node.js" />
  <img src="https://img.shields.io/badge/Express-API-black?logo=express" />
  <img src="https://img.shields.io/badge/License-MIT-green" />
</p>

<p align="center">
  A personal health & fitness management desktop application built with Electron.
</p>

---

## Overview

**LockIn** is a desktop application that helps users manage their health journey by tracking:

* Body metrics (BMI, BMR, TDEE)
* Nutrition intake
* Workout sessions
* Relaxation activities
* Personal fitness plans

The application is designed with an **offline-first architecture**, storing data locally using JSON-based storage.

---

## Demo

<p align="center">
  <img src="(https://drive.google.com/drive/folders/17cfYcBN78LCm2nYaJIrs26Omzox9z21T)" alt="App Demo" width="800"/>
</p>


---

## Architecture

LockIn follows a layered desktop architecture:

```
Electron (Main Process)
│
├── Preload (IPC Bridge)
│
└── Renderer (React + Vite)
      │
      └── Express API (in-process)
              │
              └── JSON File Storage
```

### Main Modules

* Authentication
* Profile Management
* Stats & Health Calculation
* Meal Log
* Workout Log
* Relaxation Log
* Admin Panel
* Blog & Notification
* Paid Plan Management

---

## User Roles

| Role      | Description                                   |
| --------- | --------------------------------------------- |
| User      | Track personal health and fitness             |
| Paid User | Access personalized fitness plans             |
| Admin     | Manage foods, exercises, blogs, notifications |

---

## Tech Stack

| Layer    | Technology               |
| -------- | ------------------------ |
| Desktop  | Electron                 |
| Frontend | React + Vite             |
| Backend  | Node.js + Express        |
| Storage  | JSON-based local storage |
| Design   | Figma                    |

---

## Getting Started

### Clone Repository

```bash
git clone https://github.com/your-username/lockin.git
cd lockin
```

### Install Dependencies

```bash
npm install
```

### Run in Development Mode

```bash
npm run dev:desktop
```

The Electron desktop app will launch automatically.

---

## Project Structure

```
lockin/
│
├── electron/
├── src/
│   ├── components/
│   ├── pages/
│   ├── services/
│   └── store/
│
├── server/
├── data/
├── docs/
└── package.json
```

---

## Features

* User authentication
* BMI / BMR / TDEE calculation
* Nutrition tracking with calorie counting
* Workout tracking with calories burned
* Relaxation tracking
* Dashboard analytics
* Admin content management
* Role-based authorization

---

## Future Improvements

* Cloud synchronization
* Mobile version
* AI-powered meal recommendations
* Online payment integration
* Smart coach suggestions

---

## License

This project is licensed under the MIT License.


<p align="center">
  Due to project scope and time limitations, several UI refinements and advanced logic features are planned for future improvement.
</p>
