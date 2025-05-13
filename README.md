<h1>File Sharing Web App</h1>

A full-stack file-sharing application built with **Flask** (Python) on the backend and **React** (JavaScript) on the frontend. Users can sign up, verify their email, log in, upload files to AWS S3, share files with other users, view owned/shared files, download via presigned URLs, and manage sharing permissions.

---
## Features

- **User Authentication & Verification**  
  - Email verification workflow (register → verify code → complete signup)  
  - JWT-based login / protected routes  

- **File Management**  
  - Upload files (to AWS S3)  
  - List “My Files” and “Shared With Me”  
  - Download your own files or files shared with you via presigned S3 URLs  
  - Delete owned files  

- **Collaboration & Sharing**  
  - Share files with other registered users (read-only)  
  - Unshare / revoke access  
  - Leave collaboration for files shared with you  

- **Tech Stack**  
  - **Backend**: Flask, Flask-SQLAlchemy, Flask-JWT-Extended, Flask-Migrate, Flask-CORS  
  - **Database**: PostgreSQL (via `psycopg2-binary`)  
  - **Storage**: AWS S3 (via `boto3`)  
  - **Email**: SMTP (`smtplib`, `email.message`)  
  - **Frontend**: React, React Router, Fetch API, plain CSS  

---

## Prerequisites

- **Python 3.7+**  
- **Node.js & npm**
- **PostgreSQL** database  
- **AWS** account with an S3 bucket  
- **SMTP** credentials for sending verification emails  

---

## Environment Variables

Create a `.env` file in the `backend/` folder with the following:

```ini
# Flask / Security
SECRET_KEY=your_flask_secret
JWT_SECRET_KEY=your_jwt_secret

# Database
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DB_NAME

# AWS S3
AWS_S3_BUCKET=your_s3_bucket
AWS_ACCESS_KEY=your_aws_access_key
AWS_SECRET_KEY=your_aws_secret_key
AWS_REGION=us-east-2         # or your region

# SMTP Email
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password
EMAIL_SENDER=verify@yourdomain.com
````

---

## Backend Setup

1. **Install dependencies**

   ```bash
   cd backend
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

2. **Initialize database migrations**

   ```bash
   export FLASK_APP=run.py
   export FLASK_ENV=development

   flask db init
   flask db migrate -m "Initial migration"
   flask db upgrade
   ```

3. **Run the server**

   ```bash
   flask run
   ```

   The API will be available at `http://localhost:5000/api`.

---

## Frontend Setup

1. **Install dependencies**

   ```bash
   cd frontend
   npm install
   ```

2. **(Optional) Configure proxy**
   To avoid CORS issues in development, add to `frontend/package.json`:

   ```json
   "proxy": "http://localhost:5000"
   ```

3. **Start the development server**

   ```bash
   npm start
   ```

   The React app runs at `http://localhost:3000`.

---

## Building for Production

1. **Build frontend**

   ```bash
   cd frontend
   npm run build
   ```

2. **Serve static files**

   * Option A: Configure Nginx (or similar) to serve `frontend/build/` behind your Flask API.
   * Option B: Extend Flask to serve `build/` as static.

3. **Run with Gunicorn**

   ```bash
   cd backend
   gunicorn run:app --bind 0.0.0.0:8000
   ```
