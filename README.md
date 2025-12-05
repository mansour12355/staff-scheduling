# 📅 Staff Scheduling System

A modern, full-stack web application for managing staff schedules including work shifts, training sessions, deliveries, and appointments. Features a beautiful glassmorphism UI with role-based access control.

## ✨ Features

### For Staff Members
- 🔐 Secure login with JWT authentication
- 📅 View personal schedule in an intuitive card layout
- 📍 See location, time, and details for each scheduled activity
- 🎨 Beautiful, responsive dark-mode interface
- 📱 Mobile-friendly design

### For Administrators
- 👥 Manage all staff members and their schedules
- ➕ Create, edit, and delete schedules
- 👤 Add new staff members with custom roles
- 🔄 Toggle between personal and all-staff schedule views
- 📊 View schedules with status tracking (scheduled, completed, cancelled)

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm (comes with Node.js)

### Installation

1. **Clone or download this project**

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Start the backend server**
   ```bash
   npm start
   ```
   The server will start on `http://localhost:3000`

4. **Open the application**
   - Open your browser and navigate to `http://localhost:3000`
   - The frontend is automatically served by the backend

## 🌐 Deploy to Railway

For production deployment to Railway, see the detailed guide:
**[RAILWAY_DEPLOY.md](RAILWAY_DEPLOY.md)**

Quick steps:
1. Push to GitHub
2. Connect to Railway
3. Set JWT_SECRET environment variable
4. Deploy!

## 🔑 Default Credentials

### Admin Account
- **Email:** admin@schedule.com
- **Password:** admin123

### Staff Accounts
- **Email:** john@schedule.com
- **Password:** staff123

- **Email:** jane@schedule.com
- **Password:** staff123

## 📁 Project Structure

```
staff-scheduling/
├── backend/
│   ├── server.js          # Express server with API endpoints
│   ├── package.json       # Backend dependencies
│   └── database.db        # SQLite database (auto-created)
├── frontend/
│   ├── index.html         # Main HTML file
│   ├── styles.css         # Design system and styles
│   └── app.js             # Frontend JavaScript logic
└── README.md              # This file
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/login` - Login and receive JWT token

### Schedules
- `GET /api/schedules/my-schedules` - Get logged-in staff's schedules
- `GET /api/schedules/all` - Get all schedules (admin only)
- `POST /api/schedules` - Create new schedule (admin only)
- `PUT /api/schedules/:id` - Update schedule (admin only)
- `DELETE /api/schedules/:id` - Delete schedule (admin only)

### Staff Management
- `GET /api/staff` - Get all staff members (admin only)
- `POST /api/staff` - Add new staff member (admin only)

## 🗄️ Database Schema

### Staff Table
- `id` - Primary key
- `name` - Staff member's full name
- `email` - Unique email address
- `password_hash` - Bcrypt hashed password
- `role` - Either 'admin' or 'staff'
- `created_at` - Timestamp

### Schedules Table
- `id` - Primary key
- `staff_id` - Foreign key to staff table
- `title` - Schedule title (e.g., "Morning Shift")
- `description` - Additional details
- `date` - Schedule date
- `start_time` - Start time
- `end_time` - End time
- `location` - Location/venue
- `status` - 'scheduled', 'completed', or 'cancelled'
- `created_at` - Timestamp

## 🎨 Design Features

- **Glassmorphism UI** - Modern translucent card designs with backdrop blur
- **Dark Mode** - Eye-friendly dark theme with vibrant accent colors
- **Smooth Animations** - Micro-interactions and hover effects
- **Responsive Layout** - Works seamlessly on desktop, tablet, and mobile
- **Custom Scrollbars** - Styled scrollbars matching the theme
- **Gradient Accents** - Beautiful color gradients throughout

## 🔒 Security Features

- JWT-based authentication
- Bcrypt password hashing
- Role-based access control
- Protected API endpoints
- SQL injection prevention with parameterized queries

## 🛠️ Technologies Used

### Backend
- **Express.js** - Web framework
- **Socket.IO** - Real-time WebSocket communication
- **SQLite3** - Lightweight database
- **bcryptjs** - Password hashing
- **jsonwebtoken** - JWT authentication
- **cors** - Cross-origin resource sharing

### Frontend
- **Vanilla JavaScript** - No framework dependencies
- **Socket.IO Client** - Real-time updates
- **Modern CSS** - Custom properties, Grid, Flexbox
- **Google Fonts (Inter)** - Clean, modern typography

## 📝 Usage Guide

### For Staff Members
1. Log in with your credentials
2. View your upcoming schedules on the dashboard
3. Check details like date, time, location, and description
4. See the status of each schedule (scheduled/completed/cancelled)

### For Administrators
1. Log in with admin credentials
2. Use "Add Schedule" to create new schedules for staff
3. Use "Add Staff Member" to add new users
4. Click "View All Schedules" to see everyone's schedules
5. Edit or delete schedules using the action buttons on each card
6. Toggle between "My Schedule" and "All Schedules" views

## 🔧 Configuration

### Change JWT Secret
Edit `server.js` and update the `JWT_SECRET` constant:
```javascript
const JWT_SECRET = 'your-secret-key-change-in-production';
```

### Change Port
Edit `server.js` and update the `PORT` constant:
```javascript
const PORT = 3000;
```

### Database Location
The SQLite database is created in the `backend` directory as `database.db`. To reset the database, simply delete this file and restart the server.

## 🌟 Key Features

### ⚡ Real-time Updates (NEW!)
- **WebSocket Integration** - Instant updates across all connected clients
- **Live Notifications** - Toast notifications for schedule changes
- **No Refresh Needed** - Changes appear automatically
- **Multi-user Support** - Perfect for team collaboration

### 🚀 Ready for Production
- **Railway Deployment** - One-click deploy to Railway
- **Environment Variables** - Secure configuration management
- **Dynamic URLs** - Automatically adapts to production/development

## 🌟 Future Enhancements

Potential features for future versions:
- Email notifications for upcoming schedules
- Calendar view with drag-and-drop
- Recurring schedules
- Time-off requests
- Export schedules to PDF/CSV
- Mobile app version

## 📄 License

This project is open source and available for personal and commercial use.

## 🤝 Support

For issues or questions, please check the code comments or modify as needed for your specific use case.

---

**Built with ❤️ using modern web technologies**
