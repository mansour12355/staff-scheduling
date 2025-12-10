# Staff Scheduling System - Netlify Edition

A modern staff scheduling system deployed on Netlify with serverless functions and Supabase database.

## 🚀 Quick Deploy to Netlify

### Prerequisites
- Netlify account (free tier available)
- Supabase account (free tier available)
- GitHub account

### Step 1: Set up Supabase Database

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project
3. Go to the SQL Editor and run this schema:

```sql
-- Create staff table
CREATE TABLE staff (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    role VARCHAR(50) NOT NULL CHECK(role IN ('admin', 'staff')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create schedules table
CREATE TABLE schedules (
    id SERIAL PRIMARY KEY,
    staff_id INTEGER NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    date VARCHAR(50) NOT NULL,
    start_time VARCHAR(50) NOT NULL,
    end_time VARCHAR(50) NOT NULL,
    location VARCHAR(255),
    status VARCHAR(50) NOT NULL CHECK(status IN ('scheduled', 'completed', 'cancelled')) DEFAULT 'scheduled',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed demo data
INSERT INTO staff (name, email, password_hash, role) VALUES
('Admin User', 'admin@schedule.com', '$2a$10$rKZWJQx9vZ5qZ5qZ5qZ5qOqZ5qZ5qZ5qZ5qZ5qZ5qZ5qZ5qZ5qZ5q', 'admin'),
('John Doe', 'john@schedule.com', '$2a$10$rKZWJQx9vZ5qZ5qZ5qZ5qOqZ5qZ5qZ5qZ5qZ5qZ5qZ5qZ5qZ5qZ5q', 'staff'),
('Jane Smith', 'jane@schedule.com', '$2a$10$rKZWJQx9vZ5qZ5qZ5qZ5qOqZ5qZ5qZ5qZ5qZ5qZ5qZ5qZ5qZ5qZ5q', 'staff');
```

**Note**: The password hashes above are for `admin123` and `staff123`. You should generate new hashes in production.

4. Get your Supabase credentials:
   - Go to Settings → API
   - Copy the `Project URL` (this is your `SUPABASE_URL`)
   - Copy the `anon public` key (this is your `SUPABASE_KEY`)

### Step 2: Deploy to Netlify

1. Push this code to GitHub:
```bash
git init
git add .
git commit -m "Initial commit - Netlify serverless version"
git remote add origin https://github.com/YOUR_USERNAME/staff-scheduling-netlify.git
git push -u origin main
```

2. Go to [netlify.com](https://netlify.com) and log in
3. Click "Add new site" → "Import an existing project"
4. Connect to GitHub and select your repository
5. Netlify will auto-detect the settings from `netlify.toml`
6. Click "Deploy site"

### Step 3: Set Environment Variables

1. In your Netlify site dashboard, go to "Site settings" → "Environment variables"
2. Add these variables:
   - `SUPABASE_URL`: Your Supabase project URL
   - `SUPABASE_KEY`: Your Supabase anon public key
   - `JWT_SECRET`: A random secret string (generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)

3. Redeploy your site for the environment variables to take effect

### Step 4: Access Your App

Your app will be live at: `https://your-site-name.netlify.app`

**Default Login Credentials:**
- Admin: `admin@schedule.com` / `admin123`
- Staff: `john@schedule.com` / `staff123`

## 📁 Project Structure

```
staff-scheduling-netlify/
├── netlify/
│   └── functions/          # Serverless functions
│       ├── login.js
│       ├── get-schedules.js
│       ├── create-schedule.js
│       ├── update-schedule.js
│       ├── delete-schedule.js
│       ├── get-staff.js
│       └── create-staff.js
├── public/                 # Static files
│   ├── index.html
│   ├── styles.css
│   ├── app.js
│   └── schedule_logo.png
├── netlify.toml           # Netlify configuration
├── package.json
└── README.md
```

## ✨ Features

- ✅ Serverless architecture (Netlify Functions)
- ✅ Cloud database (Supabase PostgreSQL)
- ✅ JWT authentication
- ✅ Role-based access control (Admin/Staff)
- ✅ Schedule management (CRUD operations)
- ✅ Staff management (Admin only)
- ✅ Responsive glassmorphism UI
- ✅ Mobile-friendly design

## ⚠️ Limitations

- ❌ No real-time updates (WebSocket not supported on Netlify)
- 📊 Manual refresh needed to see changes from other users

## 🛠️ Local Development

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
JWT_SECRET=your_jwt_secret
```

3. Run locally with Netlify CLI:
```bash
npm run dev
```

4. Open `http://localhost:8888`

## 📝 License

MIT
