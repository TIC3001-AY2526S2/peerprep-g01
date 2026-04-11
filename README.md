[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/vHiHb8vh)

# TIC3001/TCX3225 Project (PeerPrep) - AY2526S2

## Group: G01

# PeerPrep

A FastAPI-based microservice for managing coding questions with support for CRUD operations, search, and pagination. Built with React frontend for a modern user interface.

## Tech Stack

### Backend

- **Framework**: FastAPI
- **Database**: MongoDB Atlas
- **Runtime**: Python 3.13
- **Server**: Uvicorn
- **Data Validation**: Pydantic
- **Matching Queue, Collab Session State, Code Sync** - Redis
- **Matching Service** - Websocket
- **Code Execution** - Piston

### Frontend

- **Framework**: React
- **Build Tool**: Vite
- **Styling**: CSS with custom design system
- **Code Editor**: CodeMirror 6
- **Real-Time Collaboration**: Socket.IO Client

## Infrastructure
- **Containerised Services** - Docker + Docker Compose
- **Container for Collab + Matching ** - Redis 7

## Quick Start

### Prerequisites

- **Python 3.13** or higher
- **Node.js 16** or higher
- MongoDB Atlas account
- pip (Python package manager)
- npm (Node.js package manager)

### Backend Setup

1. Create a copy of the `.env.sample` file (in root) and name it `.env` (in root):

```bash
   cp .env.sample .env
```

2. Create a MongoDB Atlas Cluster and obtain the connection string:
   - Log in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Create a new cluster or use an existing one
   - Click "Connect" and choose "Drivers"
   - Copy the connection string

3. Add the connection string to the `.env` file in the root directory:

```
   DB_CLOUD_URI=<PLACE CLOUD URI HERE>
```

4. Run Docker Desktop

5. Start the backend service:

```bash
   docker-compose up --build
```

### Frontend Setup

1. Open a new terminal and navigate to the `frontend` directory:

```bash
   cd frontend
```

2. Install Node.js dependencies:

```bash
   npm install
```

3. Start the development server:

```bash
   npm run dev
```

The frontend will start on:

```
   Local: http://localhost:5173
```

### Accessing the Application

- **Frontend UI**: http://localhost:5173
- **User Service API**: http://localhost:3000/docs
- **Question Service API**: http://localhost:3001/docs

## Environment Variables

| Variable       | Description                     | Example                                          |
| -------------- | ------------------------------- | ------------------------------------------------ |
| `DB_CLOUD_URI` | MongoDB Atlas connection string | `mongodb+srv://user:pass@cluster.mongodb.net/db` |
