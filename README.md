# pmanage_back

This repository contains the backend server for the **Project Management and Timesheet System**.

The backend is responsible for:
- user authentication
- project and task management
- team management
- timesheet tracking
- AI assistant queries
- database management

The server exposes a REST API used by the frontend application.

---

# Technologies

Backend stack:

- Node.js
- Express.js
- Sequelize ORM
- MySQL
- express-session
- connect-session-sequelize

Database:

- MySQL (Aiven Cloud)

---

# Installation

## 1 Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/backend-repo.git
cd backend-repo
```

## 2 Install Dependencies

```bash
npm install
```
## 3 Configure environment variables

Create a .env file in the backend directory.

example
```bash
MYSQL_DB=defaultdb
MYSQL_USER=your_user
MYSQL_PASS=your_password
MYSQL_HOST=your_mysql_host
MYSQL_PORT=14534

SESS_SECRET=your_secret
APP_PORT=5000

GROQ_API_KEY=your_api_key_from_groq
```
