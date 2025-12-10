# Railway PostgreSQL Setup Guide

This guide will help you set up PostgreSQL on Railway for persistent data storage.

## Step 1: Add PostgreSQL to Your Railway Project

1. Go to your Railway project dashboard
2. Click **"+ New"** button
3. Select **"Database"**
4. Choose **"PostgreSQL"**
5. Railway will automatically create a PostgreSQL database and set the `DATABASE_URL` environment variable

## Step 2: Verify Environment Variables

Your app will automatically detect PostgreSQL when `DATABASE_URL` is present:

- ✅ **DATABASE_URL** - Automatically set by Railway (no action needed)
- ⚙️ **JWT_SECRET** - Set this to a secure random string
- ⚙️ **NODE_ENV** - Set to `production`

To add/verify environment variables:
1. Click on your web service in Railway
2. Go to **"Variables"** tab
3. Add `JWT_SECRET` if not already set
4. Add `NODE_ENV` = `production`

## Step 3: Deploy Your Application

Your app is already configured to:
- Use **PostgreSQL** in production (Railway)
- Use **SQLite** for local development

Simply push your code to GitHub and Railway will automatically deploy:

```bash
git push origin main
```

## Step 4: Verify Data Persistence

1. **Login** to your app with default credentials:
   - Email: `admin@schedule.com`
   - Password: `admin123`

2. **Add a test schedule** or staff member

3. **Trigger a redeploy** in Railway:
   - Go to Deployments tab
   - Click "Redeploy"

4. **Check if data persists** after redeploy
   - Login again
   - Your test data should still be there! ✅

## Database Information

### Connection Details
You can view your PostgreSQL connection details in Railway:
- Click on the PostgreSQL service
- Go to "Connect" tab
- You'll see host, port, database name, username, and password

### Accessing the Database
You can connect to your PostgreSQL database using:
- **Railway CLI**: `railway connect postgres`
- **psql**: Use the connection string from Railway
- **GUI tools**: TablePlus, pgAdmin, DBeaver, etc.

## Troubleshooting

### App not connecting to PostgreSQL
- Verify `DATABASE_URL` is set in your web service variables
- Check deployment logs for database connection errors

### Data not persisting
- Confirm you're using PostgreSQL (check logs for "Using PostgreSQL database")
- Verify the PostgreSQL service is running in Railway

### Migration from SQLite
If you had data in SQLite locally that you want to migrate:
1. Export data from local SQLite
2. Connect to Railway PostgreSQL
3. Import data using SQL scripts

## Default Credentials

After deployment, your database will be seeded with:

**Admin:**
- Email: `admin@schedule.com`
- Password: `admin123`

**Staff:**
- Email: `john@schedule.com` / Password: `staff123`
- Email: `jane@schedule.com` / Password: `staff123`

---

**Your data is now persistent! 🎉**
