[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/vHiHb8vh)

# TIC3001/TCX3225 Project (PeerPrep) - AY2526S2

## Group: G01

# Question Service

A FastAPI-based microservice for managing coding questions with support for CRUD operations, search, and pagination. Built with React frontend for a modern user interface.

## Tech Stack

### Backend

- **Framework**: FastAPI
- **Database**: MongoDB Atlas
- **Runtime**: Python 3.13
- **Server**: Uvicorn

### Frontend

- **Framework**: React
- **Build Tool**: Vite
- **Styling**: CSS with custom design system

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

If the server starts successfully, you will see:

```
user-service      | INFO:     Application startup complete.
user-service      | MongoDB user indexes ensured.
user-service      | INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
question-service  | INFO:     Application startup complete.
question-service  | INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
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
- **Backend API**: http://localhost:8000
- **API Documentation (Swagger UI)**: http://localhost:8000/docs

## Environment Variables

| Variable       | Description                     | Example                                          |
| -------------- | ------------------------------- | ------------------------------------------------ |
| `DB_CLOUD_URI` | MongoDB Atlas connection string | `mongodb+srv://user:pass@cluster.mongodb.net/db` |

## Features in Detail

### Question Management

- **Create**: Add new coding questions with title, description, categories, and complexity
- **Read**: View questions with pagination and search
- **Update**: Edit existing questions via modal interface
- **Delete**: Remove questions with confirmation

### UI Features

- **Search**: Real-time search by question title
- **Pagination**: Navigate through questions 5 at a time
- **Complexity Badges**: Color-coded indicators (Green/Yellow/Red)
- **Category Tags**: Multiple categories per question
- **Modal Views**: Detailed question display and edit forms
- **Toast Notifications**: Success/error feedback for all operations

## Notes

- The backend runs on port **8000** by default
- The frontend runs on port **5173** by default
- CORS is configured to accept requests from `http://localhost:5173`
- MongoDB connection requires the `.env` file in the **root directory**
- Both backend and frontend must be running for the full application to work
- Developed with **Python 3.13** - ensure compatibility when deploying
