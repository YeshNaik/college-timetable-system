# College Timetable & Substitution Management System

A full-stack web application designed for academic institutions to manage college timetables, classrooms, teacher availability, subject requirements, automated timetable generation, and teacher substitution/leave tracking.

## Tech Stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS, Lucide React, React Router, Recharts, Zod, React Hook Form
- **Backend:** Node.js, Express, MySQL (mysql2)
- **Database:** MySQL (Relational Schema with Views, Stored Procedures, Triggers, and Events)

---

## Project Structure

```text
college-timetable/
├── backend/            # Express backend API & routing
├── database/           # SQL schema files, sample data, procedures, triggers
├── frontend/           # React + TypeScript + Vite frontend
├── scripts/            # Utility scripts (e.g. database seeding)
├── .env.example        # Environment variable template
└── package.json        # Root package configuration & backend dependencies
```

---

## Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- MySQL Server (v8.0+)

### 1. Database Setup

1. Create a MySQL database (e.g., `college_timetable_db`).
2. Run the SQL scripts in the `database/` folder in numerical order (`01_create_database.sql`, `02_sample_data.sql`, etc.) or use your MySQL client to import `database/setup_database.sql` / execute schema scripts.

### 2. Environment Configuration

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Update `.env` with your MySQL connection credentials:
   ```env
   DB_HOST=localhost
   DB_USER=your_mysql_user
   DB_PASSWORD=your_mysql_password
   DB_PORT=3306
   PORT=5000
   API_BASE_URL=http://localhost:5000/api
   ```

### 3. Installation & Running

#### Backend
```bash
# Install root/backend dependencies
npm install

# Start backend development server (with nodemon)
npm run dev
```

#### Frontend
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start frontend development server
npm run dev
```

---

## License

MIT
