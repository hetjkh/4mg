# Role-Based Access Control Setup Guide

## System Overview

The system now has role-based access control with 4 roles:
- **Admin** - Can register new users, full access
- **Stalkist** - Limited access
- **Dellear** - Limited access  
- **Salesman** - Limited access

## Setup Steps

### 1. Create First Admin User

Run this command in the backend folder:
```bash
cd backend
npm run create-admin
```

This will:
- Create an admin user with email: `admin@example.com`
- Generate a random password
- Display the password (save it securely!)

### 2. Login as Admin

1. Open the app
2. Go to Login page
3. Select "Admin" role from dropdown
4. Enter email: `admin@example.com`
5. Enter the password generated in step 1
6. Login

### 3. Register New Users (Admin Only)

1. After logging in as admin, you'll see "Register New User" button on dashboard
2. Click it to open admin registration page
3. Fill in:
   - Name
   - Email
   - Select Role (admin, stalkist, dellear, salesman)
   - Password
   - Confirm Password
4. Click "Register User"

### 4. Login with Different Roles

Users can login by:
1. Selecting their role from dropdown
2. Entering their email and password
3. The system validates that the role matches their account

## API Endpoints

### Generate Admin Password
- `GET /api/auth/admin/password`
- Returns a randomly generated password

### Register User (Admin Only)
- `POST /api/auth/register`
- Requires: Authorization header with admin token
- Body: `{ name, email, password, role }`

### Login
- `POST /api/auth/login`
- Body: `{ email, password, role }`
- Returns: token and user data with role

## Features

✅ Role-based login with dropdown selection
✅ Admin-only user registration
✅ Role displayed on dashboard
✅ Admin password generation endpoint
✅ Secure token-based authentication
✅ Role validation on login

## Important Notes

- Only admin can register new users
- Users must select their correct role to login
- Role is validated against the database on login
- Admin users see "Register New User" button on dashboard
- All user data includes role information

