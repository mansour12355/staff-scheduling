# MySQL Setup Guide for Staff Scheduling App

This guide will help you set up MySQL for your staff scheduling application using **PlanetScale** (recommended free MySQL provider).

## Option 1: PlanetScale (Recommended)

PlanetScale offers a free MySQL-compatible database that works great with Railway.

### Step 1: Create PlanetScale Account
1. Go to https://planetscale.com
2. Sign up for free account
3. Verify your email

### Step 2: Create Database
1. Click **"Create database"**
2. Name: `staff-scheduling` (or your preferred name)
3. Region: Choose closest to your users
4. Click **"Create database"**

### Step 3: Get Connection String
1. Go to your database dashboard
2. Click **"Connect"**
3. Select **"Node.js"** from framework dropdown
4. Copy the connection string (looks like: `mysql://user:pass@host.us-east-3.psdb.cloud/staff-scheduling?ssl={"rejectUnauthorized":true}`)

### Step 4: Configure Local Development
1. Create `.env` file in `backend` folder:
   ```
   DATABASE_URL=mysql://your-planetscale-connection-string
   JWT_SECRET=your-secret-key
   SESSION_SECRET=your-session-secret
   ```

2. Restart your server:
   ```bash
   cd backend
   node server.js
   ```

3. You should see: **"Using MySQL database"** ✅

### Step 5: Configure Railway
1. Go to Railway → Your project → Web Service
2. Click **"Variables"** tab
3. Add these variables:
   - `DATABASE_URL` = Your PlanetScale connection string
   - `JWT_SECRET` = Secure random string
   - `SESSION_SECRET` = Secure random string
   - `NODE_ENV` = `production`

4. Redeploy your app

---

## Option 2: Aiven MySQL

Aiven also offers free MySQL hosting.

### Setup Steps:
1. Sign up at https://aiven.io
2. Create new MySQL service (free tier available)
3. Get connection string from service dashboard
4. Follow same steps as PlanetScale above

---

## Option 3: Local MySQL

For local development only (not recommended for production).

### Setup Steps:
1. Install MySQL locally
2. Create database: `CREATE DATABASE staff_scheduling;`
3. Get connection string: `mysql://root:password@localhost:3306/staff_scheduling`
4. Add to `.env` file

---

## Verifying Connection

After setting up MySQL, verify it's working:

1. **Check server logs** - Should see:
   ```
   Using MySQL database
   Server running on http://localhost:3000
   Database seeded with initial data
   ```

2. **Test login** - Go to http://localhost:3000
   - Email: `admin@schedule.com`
   - Password: `admin123`

3. **Check data persistence**:
   - Add a schedule
   - Restart server
   - Schedule should still be there ✅

---

## Troubleshooting

### "Using SQLite database" instead of MySQL
- Check that `DATABASE_URL` in `.env` starts with `mysql://`
- Verify `.env` file is in the `backend` folder
- Restart the server

### Connection errors
- Verify connection string is correct
- Check database is running (PlanetScale dashboard)
- Ensure no firewall blocking connection

### SSL errors
- PlanetScale requires SSL - connection string should include SSL parameters
- For local MySQL, you can disable SSL in connection string

---

## Migration from PostgreSQL

If you had data in PostgreSQL:
1. Export data from PostgreSQL
2. Import into MySQL
3. Or manually re-create data through the app

---

**Your app is now using MySQL!** 🎉
