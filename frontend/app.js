// API Configuration
// Automatically detect if running on Railway or localhost
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000/api'
    : `${window.location.protocol}//${window.location.host}/api`;

// State Management
let currentUser = null;
let authToken = null;
let allSchedules = [];
let allStaff = [];
let viewingAllSchedules = false;
let socket = null;

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    handleOAuthCallback();
    checkAuth();
    setupEventListeners();
    initializeSocket();
});

// Handle OAuth Callback
function handleOAuthCallback() {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const userParam = urlParams.get('user');
    const error = urlParams.get('error');

    if (error) {
        const errorDiv = document.getElementById('loginError');
        errorDiv.textContent = 'Google authentication failed. Please try again.';
        errorDiv.classList.remove('hidden');
        // Clean URL
        window.history.replaceState({}, document.title, '/');
        return;
    }

    if (token && userParam) {
        try {
            const user = JSON.parse(decodeURIComponent(userParam));

            // Store auth data
            authToken = token;
            currentUser = user;
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('currentUser', JSON.stringify(currentUser));

            // Clean URL and show dashboard
            window.history.replaceState({}, document.title, '/');
            showDashboard();
        } catch (error) {
            console.error('Error parsing OAuth callback:', error);
        }
    }
}

// Google OAuth Login
function loginWithGoogle() {
    // Redirect to backend OAuth endpoint
    window.location.href = `${API_BASE_URL}/auth/google`;
}

// Initialize Socket.IO
function initializeSocket() {
    // Automatically detect WebSocket URL
    const socketUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:3000'
        : window.location.origin;

    socket = io(socketUrl);

    socket.on('connect', () => {
        console.log('Connected to WebSocket server');
    });

    socket.on('disconnect', () => {
        console.log('Disconnected from WebSocket server');
    });

    // Listen for schedule events
    socket.on('schedule:created', (data) => {
        console.log('Schedule created:', data);
        if (currentUser) {
            loadSchedules();
            showNotification('New schedule added', 'success');
        }
    });

    socket.on('schedule:updated', (data) => {
        console.log('Schedule updated:', data);
        if (currentUser) {
            loadSchedules();
            showNotification('Schedule updated', 'info');
        }
    });

    socket.on('schedule:deleted', (data) => {
        console.log('Schedule deleted:', data);
        if (currentUser) {
            loadSchedules();
            showNotification('Schedule deleted', 'warning');
        }
    });

    // Listen for staff events
    socket.on('staff:created', (data) => {
        console.log('Staff member added:', data);
        if (currentUser && currentUser.role === 'admin') {
            loadAllStaff();
            showNotification('New staff member added', 'success');
        }
    });
}

// Setup Event Listeners
function setupEventListeners() {
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('scheduleForm').addEventListener('submit', handleScheduleSubmit);
    document.getElementById('staffForm').addEventListener('submit', handleStaffSubmit);
}

// Check Authentication
function checkAuth() {
    const token = localStorage.getItem('authToken');
    const user = localStorage.getItem('currentUser');

    if (token && user) {
        authToken = token;
        currentUser = JSON.parse(user);
        showDashboard();
    } else {
        showLogin();
    }
}

// Show Login Page
function showLogin() {
    document.getElementById('loginPage').classList.remove('hidden');
    document.getElementById('dashboardPage').classList.add('hidden');
}

// Show Dashboard
function showDashboard() {
    document.getElementById('loginPage').classList.add('hidden');
    document.getElementById('dashboardPage').classList.remove('hidden');

    // Update user info
    document.getElementById('userName').textContent = currentUser.name;
    document.getElementById('userRole').textContent = currentUser.role;

    // Show admin actions if user is admin
    if (currentUser.role === 'admin') {
        document.getElementById('adminActions').classList.remove('hidden');
        loadAllStaff();
    }

    // Load schedules
    loadSchedules();
}

// Handle Login
async function handleLogin(e) {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('loginError');
    const btnText = document.getElementById('loginBtnText');

    btnText.innerHTML = '<span class="loading"></span>';
    errorDiv.classList.add('hidden');

    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Login failed');
        }

        // Store auth data
        authToken = data.token;
        currentUser = data.user;
        localStorage.setItem('authToken', authToken);
        localStorage.setItem('currentUser', JSON.stringify(currentUser));

        // Show dashboard
        showDashboard();

    } catch (error) {
        errorDiv.textContent = error.message;
        errorDiv.classList.remove('hidden');
    } finally {
        btnText.textContent = 'Sign In';
    }
}

// Logout
function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    authToken = null;
    currentUser = null;
    viewingAllSchedules = false;
    showLogin();
}

// Load Schedules
async function loadSchedules() {
    const endpoint = viewingAllSchedules ? '/schedules/all' : '/schedules/my-schedules';

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        if (!response.ok) {
            throw new Error('Failed to load schedules');
        }

        allSchedules = await response.json();
        renderSchedules();

    } catch (error) {
        console.error('Error loading schedules:', error);
        showError('Failed to load schedules');
    }
}

// Render Schedules
function renderSchedules() {
    const grid = document.getElementById('schedulesGrid');

    // Update dashboard title
    if (viewingAllSchedules) {
        document.getElementById('dashboardTitle').textContent = 'All Schedules';
        document.getElementById('dashboardSubtitle').textContent = 'Manage all staff schedules';
        document.getElementById('viewModeBtn').textContent = 'View My Schedule';
    } else {
        document.getElementById('dashboardTitle').textContent = 'My Schedule';
        document.getElementById('dashboardSubtitle').textContent = 'View your upcoming activities';
        document.getElementById('viewModeBtn').textContent = 'View All Schedules';
    }

    if (allSchedules.length === 0) {
        grid.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <div class="empty-state-icon"><svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg></div>
        <h3 class="empty-state-title">No schedules found</h3>
        <p class="empty-state-text">
          ${currentUser.role === 'admin' ? 'Add a new schedule to get started' : 'You have no scheduled activities yet'}
        </p>
      </div>
    `;
        return;
    }

    grid.innerHTML = allSchedules.map(schedule => createScheduleCard(schedule)).join('');
}

// Create Schedule Card
function createScheduleCard(schedule) {
    const date = new Date(schedule.date);
    const formattedDate = date.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });

    const isAdmin = currentUser.role === 'admin';
    const showStaffName = viewingAllSchedules || isAdmin;

    // SVG Icons
    const userIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`;
    const calendarIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>`;
    const clockIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`;
    const locationIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>`;
    const editIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>`;
    const deleteIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`;

    return `
    <div class="schedule-card">
      <div class="schedule-header">
        <div>
          <h3 class="schedule-title">${escapeHtml(schedule.title)}</h3>
          ${showStaffName ? `<p class="schedule-staff">${userIcon} ${escapeHtml(schedule.staff_name)}</p>` : ''}
        </div>
        <span class="schedule-status status-${schedule.status}">${schedule.status}</span>
      </div>
      
      <div class="schedule-details">
        <div class="schedule-detail">
          <span class="schedule-detail-icon">${calendarIcon}</span>
          <span>${formattedDate}</span>
        </div>
        <div class="schedule-detail">
          <span class="schedule-detail-icon">${clockIcon}</span>
          <span>${schedule.start_time} - ${schedule.end_time}</span>
        </div>
        ${schedule.location ? `
          <div class="schedule-detail">
            <span class="schedule-detail-icon">${locationIcon}</span>
            <span>${escapeHtml(schedule.location)}</span>
          </div>
        ` : ''}
      </div>
      
      ${schedule.description ? `
        <p class="schedule-description">${escapeHtml(schedule.description)}</p>
      ` : ''}
      
      ${isAdmin ? `
        <div class="schedule-actions">
          <button class="btn btn-secondary btn-small" onclick="editSchedule(${schedule.id})">
            ${editIcon} Edit
          </button>
          <button class="btn btn-danger btn-small" onclick="deleteSchedule(${schedule.id})">
            ${deleteIcon} Delete
          </button>
        </div>
      ` : ''}
    </div>
  `;
}

// Toggle View Mode (Admin only)
function toggleViewMode() {
    viewingAllSchedules = !viewingAllSchedules;
    loadSchedules();
}

// Open Add Schedule Modal
function openAddScheduleModal() {
    document.getElementById('scheduleModalTitle').textContent = 'Add Schedule';
    document.getElementById('scheduleSubmitBtn').textContent = 'Add Schedule';
    document.getElementById('scheduleForm').reset();
    document.getElementById('scheduleId').value = '';

    // Set default date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('scheduleDate').value = today;

    document.getElementById('scheduleModal').classList.add('active');
}

// Edit Schedule
function editSchedule(id) {
    const schedule = allSchedules.find(s => s.id === id);
    if (!schedule) return;

    document.getElementById('scheduleModalTitle').textContent = 'Edit Schedule';
    document.getElementById('scheduleSubmitBtn').textContent = 'Update Schedule';

    document.getElementById('scheduleId').value = schedule.id;
    document.getElementById('scheduleStaff').value = schedule.staff_id;
    document.getElementById('scheduleTitle').value = schedule.title;
    document.getElementById('scheduleDescription').value = schedule.description || '';
    document.getElementById('scheduleDate').value = schedule.date;
    document.getElementById('scheduleStartTime').value = schedule.start_time;
    document.getElementById('scheduleEndTime').value = schedule.end_time;
    document.getElementById('scheduleLocation').value = schedule.location || '';
    document.getElementById('scheduleStatus').value = schedule.status;

    document.getElementById('scheduleModal').classList.add('active');
}

// Close Schedule Modal
function closeScheduleModal() {
    document.getElementById('scheduleModal').classList.remove('active');
    document.getElementById('scheduleForm').reset();
}

// Handle Schedule Submit
async function handleScheduleSubmit(e) {
    e.preventDefault();

    const scheduleId = document.getElementById('scheduleId').value;
    const isEdit = !!scheduleId;

    const scheduleData = {
        staff_id: parseInt(document.getElementById('scheduleStaff').value),
        title: document.getElementById('scheduleTitle').value,
        description: document.getElementById('scheduleDescription').value,
        date: document.getElementById('scheduleDate').value,
        start_time: document.getElementById('scheduleStartTime').value,
        end_time: document.getElementById('scheduleEndTime').value,
        location: document.getElementById('scheduleLocation').value,
        status: document.getElementById('scheduleStatus').value
    };

    const btnText = document.getElementById('scheduleSubmitBtn');
    const originalText = btnText.textContent;
    btnText.innerHTML = '<span class="loading"></span>';

    try {
        const url = isEdit
            ? `${API_BASE_URL}/schedules/${scheduleId}`
            : `${API_BASE_URL}/schedules`;

        const response = await fetch(url, {
            method: isEdit ? 'PUT' : 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(scheduleData)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to save schedule');
        }

        closeScheduleModal();
        loadSchedules();

    } catch (error) {
        alert(error.message);
    } finally {
        btnText.textContent = originalText;
    }
}

// Delete Schedule
async function deleteSchedule(id) {
    if (!confirm('Are you sure you want to delete this schedule?')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/schedules/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        if (!response.ok) {
            throw new Error('Failed to delete schedule');
        }

        loadSchedules();

    } catch (error) {
        alert(error.message);
    }
}

// Load All Staff
async function loadAllStaff() {
    try {
        const response = await fetch(`${API_BASE_URL}/staff`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        if (!response.ok) {
            throw new Error('Failed to load staff');
        }

        allStaff = await response.json();
        populateStaffDropdown();

    } catch (error) {
        console.error('Error loading staff:', error);
    }
}

// Populate Staff Dropdown
function populateStaffDropdown() {
    const select = document.getElementById('scheduleStaff');
    select.innerHTML = '<option value="">Select staff member...</option>';

    allStaff.forEach(staff => {
        const option = document.createElement('option');
        option.value = staff.id;
        option.textContent = `${staff.name} (${staff.email})`;
        select.appendChild(option);
    });
}

// Open Add Staff Modal
function openAddStaffModal() {
    document.getElementById('staffForm').reset();
    document.getElementById('staffModal').classList.add('active');
}

// Close Staff Modal
function closeStaffModal() {
    document.getElementById('staffModal').classList.remove('active');
    document.getElementById('staffForm').reset();
}

// Handle Staff Submit
async function handleStaffSubmit(e) {
    e.preventDefault();

    const staffData = {
        name: document.getElementById('staffName').value,
        email: document.getElementById('staffEmail').value,
        password: document.getElementById('staffPassword').value,
        role: document.getElementById('staffRole').value
    };

    try {
        const response = await fetch(`${API_BASE_URL}/staff`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(staffData)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to add staff member');
        }

        closeStaffModal();
        loadAllStaff();
        alert('Staff member added successfully!');

    } catch (error) {
        alert(error.message);
    }
}

// Utility Functions
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showError(message) {
    alert(message);
}

// Show notification for real-time updates
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        background: var(--glass-bg);
        backdrop-filter: blur(20px);
        border: 1px solid var(--glass-border);
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
        color: var(--text-primary);
        font-size: 0.9rem;
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
        max-width: 300px;
    `;

    const icons = {
        success: '✓',
        info: 'ℹ',
        warning: '⚠',
        error: '✕'
    };

    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.75rem;">
            <span style="font-size: 1.2rem;">${icons[type] || icons.info}</span>
            <span>${message}</span>
        </div>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Add CSS animations
if (!document.getElementById('notification-styles')) {
    const style = document.createElement('style');
    style.id = 'notification-styles';
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(400px);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(400px);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
}
