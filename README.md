# Blood Bank Network Management System 🩸

A web-based application designed to simplify blood donor management, blood donation records, blood inventory tracking, and hospital blood requests through a centralized platform.

## 📌 Project Overview

The **Blood Bank Network Management System** aims to connect donors, blood banks, and hospitals through an organized digital system. It helps maintain donor information, record blood donations, manage blood availability, and handle blood requests efficiently.

This project is developed as an academic Software Engineering project using modern web development technologies.

## 🎯 Objectives

- Maintain donor information and donation records.
- Manage blood inventory by blood group.
- Facilitate blood requests from hospitals.
- Provide secure authentication and role-based access.
- Reduce manual recordkeeping and improve data organization.
- Support efficient tracking of blood availability and requests.

## ✨ Key Modules

### 1. Authentication & Authorization
- User registration and login.
- Secure password handling.
- Authentication for protected resources.
- Role-based access for authorized users.

### 2. Donor Management
- Donor registration and profile management.
- Store donor information and blood group.
- Retrieve and maintain donor records.
- Validate donor information.

### 3. Blood Donation Management
- Record blood donation details.
- Maintain donation records and history.
- Validate donation information.
- Support inventory updates when integrated.

### 4. Blood Inventory Management
- Track available blood units by blood group.
- Monitor inventory levels.
- Support inventory status management.

### 5. Hospital Management
- Maintain hospital information.
- Organize hospital records.

### 6. Blood Request Management
- Manage hospital requests for blood.
- Track request status and processing.

### 7. Emergency Requests & Notifications
- Support urgent blood requests.
- Provide notifications about relevant request updates.

### 8. Dashboard & Reports
- Display relevant project information and statistics.
- Support monitoring of donors, donations, inventory, and requests.

*Note: The modules listed describe the project scope. Features should be considered complete only when implemented and tested in the repository.*

## 🛠️ Technology Stack

| Technology | Purpose |
|---|---|
| React.js | Frontend user interface |
| Tailwind CSS | Responsive styling |
| React Router DOM | Frontend navigation |
| Axios | HTTP requests to backend APIs |
| Node.js | Backend JavaScript runtime |
| Express.js | REST API development |
| MySQL | Relational database |
| mysql2 | MySQL connectivity |
| JWT | Authentication tokens, if configured |
| bcryptjs | Password hashing |
| express-validator | Input validation |
| dotenv | Environment configuration |
| Git & GitHub | Version control and collaboration |
| Postman | API testing |

## 🏗️ System Architecture

The application follows a client-server architecture.

```text
             Users
      (Admin / Donor / Hospital)
                |
                v
       React.js + Tailwind CSS
          Frontend Application
                |
          HTTP / REST APIs
                |
                v
        Node.js + Express.js
           Backend Server
                |
                v
             MySQL
           Database
```

## 📂 Suggested Project Structure

```text
blood-bank-network-management/
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── context/
│   │   ├── assets/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── .env.example
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── scripts/
│   │   └── server.js
│   ├── package.json
│   └── .env.example
│
├── database/
│   └── schema.sql
│
├── docs/
│
├── .gitignore
└── README.md
```

*This is a suggested structure. Adjust it to match the actual folders and files in your repository.*

## ⚙️ Installation and Setup

### Prerequisites

Install the following tools before running the project:

- [Node.js](https://nodejs.org/)
- [MySQL](https://www.mysql.com/) or [MySQL Community Server](https://dev.mysql.com/downloads/mysql/)
- [Git](https://git-scm.com/)
- A code editor such as Visual Studio Code
- [Postman](https://www.postman.com/) for API testing (optional)

### Step 1: Clone the Repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd blood-bank-network-management
```

Replace the placeholder with your actual GitHub repository URL.

### Step 2: Set Up the Database

1. Start your MySQL server.
2. Open MySQL Workbench or your preferred MySQL client.
3. Create the project database:

```sql
CREATE DATABASE blood_bank_network;
```

4. Import or execute the database schema if your repository contains `database/schema.sql`.
5. Verify that the required tables have been created.

The planned database may include:

- `users`
- `donors`
- `hospitals`
- `donations`
- `blood_inventory`
- `blood_requests`
- `notifications`

Use the actual schema included in your project.

### Step 3: Configure the Backend

Open a terminal in the backend directory:

```bash
cd backend
npm install
```

Create a `.env` file in the backend directory using the following template:

```env
PORT=5000

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=blood_bank_network
DB_PORT=3306

JWT_SECRET=replace_with_a_secure_random_secret
```

Replace the example database credentials and secret with your local configuration. Keep `.env` private and do not commit it to GitHub.

Start the backend using the script defined in your `backend/package.json`. For example, if a `dev` script exists:

```bash
npm run dev
```

Otherwise, use the appropriate start script configured in your project.

### Step 4: Configure the Frontend

Open a separate terminal:

```bash
cd frontend
npm install
```

Configure the frontend API base URL according to the environment-variable name used in your source code. For example, a Vite application may use:

```env
VITE_API_URL=http://localhost:5000
```

Start the frontend using the script defined in `frontend/package.json`. For a typical Vite development setup:

```bash
npm run dev
```

Open the local URL displayed in the terminal.

### Step 5: Verify the Application

1. Confirm that the backend server starts successfully.
2. Confirm that the frontend opens in the browser.
3. Verify the database connection.
4. Test registration and login.
5. Test donor registration and profile operations.
6. Test donation recording and history.
7. Check protected endpoints and role-based permissions.
8. Test inventory and request operations if those modules are implemented.

## 🧪 Testing

Testing helps verify that the system behaves as expected.

### Black Box Testing
Checks functionality using inputs and expected outputs without inspecting internal source code.

Examples:
- Login with valid and invalid credentials.
- Submit donor registration with missing fields.
- Record a donation with invalid information.
- Attempt to access a protected endpoint without authentication.

### White Box Testing
Examines internal source-code logic, conditions, and execution paths.

Examples:
- Verify login validation branches.
- Test donor input-validation conditions.
- Verify donation validation and error-handling paths.

**Testing tools:** Postman, browser-based testing, and appropriate code-level tests.

Actual test results should be recorded after executing the test cases.

## 🔐 Security Considerations

- Hash passwords instead of storing them as plain text.
- Validate and sanitize incoming data.
- Protect sensitive endpoints with authentication middleware.
- Enforce role-based permissions on the backend.
- Store credentials and secrets in environment variables.
- Never commit database passwords, access tokens, or private configuration files.
- Restrict access to donor information to authorized users.

## 🚀 Future Enhancements

- Real-time blood availability updates.
- Improved emergency blood request handling.
- Automated low-stock notifications.
- Advanced search and filtering for donors.
- Dashboard analytics and reports.
- Email or SMS notifications.
- Deployment for access by authorized users across locations.

## 👩‍💻 Project Information

**Project:** Blood Bank Network Management System  
**Domain:** Web Development / Healthcare Management  
**Project Type:** Academic Software Engineering Project  
**Frontend:** React.js and Tailwind CSS  
**Backend:** Node.js and Express.js  
**Database:** MySQL

### Team Members

- Member 1: Saloni Rana
- Member 2: Siddhi Patel
- Member 3: Khevana Vasani

## 📄 License

This project is developed for academic and educational purposes. Add a license file if you intend to distribute the project under a specific open-source license.

---

**Developed as part of a Software Engineering academic project.**
