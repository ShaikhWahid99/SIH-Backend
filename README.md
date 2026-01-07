# SIH Backend 

This repository contains the backend server of my SIH project. It is a robust RESTful API built with Node.js and Express, leveraging a multi-database architecture with MongoDB and Neo4j to handle complex data relationships and user data efficiently.

## 🚀 Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Databases:**
  - **MongoDB:** (via Mongoose) for user profiles, content, and general document storage.
  - **Neo4j:** (via neo4j-driver) for managing complex relationships, recommendations, and knowledge graphs.
- **Authentication:**
  - Passport.js (Google OAuth 2.0)
  - JWT (JSON Web Tokens) for stateless authentication.
  - BCryptJS for password hashing.
- **Security:**
  - Helmet for setting secure HTTP headers.
  - Express Rate Limit to prevent abuse.
  - CORS for Cross-Origin Resource Sharing.
- **Utilities:** Axios, Dotenv, UUID.

## 🔌 API Endpoints

The API provides routes for:
- **Authentication:** `/auth` (Login, Register, Google OAuth)
- **User Management:** `/api/user` (Profiles, Progress)
- **Trainers:** `/api/trainer` (Dashboard data, Course management)
- **Recommendations:** `/api/recommendations` (Neo4j-powered course suggestions)
- **Chat/AI:** `/api/chat` (Chatbot interactions)
- **Translation:** `/api/translate`

## 📂 Project Structure

```
SIH-Backend/
├── config/              # Database connections (MongoDB, Neo4j) and env config
├── controllers/         # Request logic (Auth, Recommendations, Trainer, User)
├── middleware/          # Custom middleware (Auth, Rate Limiter)
├── models/              # Mongoose schemas and Neo4j models
├── routes/              # API route definitions
├── utils/               # Helper functions (Crypto, JWT)
├── app.js               # App configuration
├── server.js            # Server entry point
└── ...
```

## 🛠️ Installation & Setup

1.  **Navigate to the backend directory:**
    ```bash
    cd ProductionReadyBackend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Environment Variables:**
    Create a `.env` file in the root directory and configure the following variables (example):
    ```env
    PORT=5000
    MONGO_URI=your_mongodb_connection_string
    NEO4J_URI=bolt://localhost:7687
    NEO4J_USER=neo4j
    NEO4J_PASSWORD=your_password
    JWT_SECRET=your_jwt_secret
    GOOGLE_CLIENT_ID=your_google_client_id
    GOOGLE_CLIENT_SECRET=your_google_client_secret
    ```

4.  **Run the server:**
    ```bash
    # Development mode (with nodemon)
    npm run dev

    # Production mode
    npm start
    ```