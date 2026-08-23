// --- Global Variables ---
const API_URL = 'http://localhost:5000/api';
let currentUser = null;
let editingUserId = null;
let userCache = []; // For caching the admin's user list
let selectedLoginRole = null; // For checking login role

/**
 * A helper function for making authenticated API calls.
 * It automatically gets the token from sessionStorage.
 */
async function authFetch(url, options = {}) {
  // Get the logged-in user from storage
  const user = JSON.parse(sessionStorage.getItem('ayurUser'));
  const token = user ? user.token : null;

  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  // If we have a token, add the Authorization header
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  const mergedOptions = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  const response = await fetch(url, mergedOptions);

  if (response.status === 401) {
    // Token is invalid or expired
    logout(); // Log the user out
    throw new Error('Session expired. Please log in again.');
  }

  // Handle '204 No Content' or other non-JSON responses
  if (response.status === 204) {
      return null;
  }
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'API request failed');
  }
  
  return data;
}


// --- App Initialization ---
document.addEventListener('DOMContentLoaded', function() {
    loginCheck(); // Check session storage
    setInterval(updateDateTime, 1000);
    
    // Add event listeners for filters
    const userSearch = document.getElementById('userSearch');
    const roleFilter = document.getElementById('roleFilter');
    const statusFilter = document.getElementById('statusFilter');

    if (userSearch) userSearch.addEventListener('input', filterUsers);
    if (roleFilter) roleFilter.addEventListener('change', filterUsers);
    if (statusFilter) statusFilter.addEventListener('change', filterUsers);

    const patientSearch = document.getElementById('patientSearch');
    if (patientSearch) patientSearch.addEventListener('input', filterDoctorPatients);
});

function updateDateTime() {
    const now = new Date();
    const timeOptions = { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true
    };
    const dateOptions = { 
        weekday: 'long',
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };

    const timeString = now.toLocaleTimeString('en-US', timeOptions);
    const dateString = now.toLocaleDateString('en-US', dateOptions);

    document.querySelectorAll('.current-time').forEach(el => {
        el.textContent = timeString;
    });
    document.querySelectorAll('.current-date').forEach(el => {
        el.textContent = dateString;
    });
}

// --- Auth & Navigation Functions ---

function loginCheck() {
    const userString = sessionStorage.getItem('ayurUser');
    if (userString) {
        currentUser = JSON.parse(userString);
        showDashboard(currentUser.role); // Go straight to dashboard
        return true;
    }
    // If no user, show the role selection
    showRoleSelection();
    return false;
}

function showRoleSelection() {
    selectedLoginRole = null; // Reset the role
    
    // Hide all dashboards
    hideAllDashboards();
    hideAllModals(); // Hide modals in case one was stuck open
    document.getElementById('loginScreen').classList.remove('active');
    
    // Show the role selection
    const roleSelectionEl = document.getElementById('roleSelection');
    if (roleSelectionEl) {
        roleSelectionEl.classList.add('active');
    }
}

function showLogin(role) {
    selectedLoginRole = role; // Remember the role
    
    document.getElementById('roleSelection').classList.remove('active');
    document.getElementById('loginScreen').classList.add('active');
    
    const titles = {
        admin: '👩‍💼 Administrator Login',
        doctor: '👨‍⚕️ Doctor Login',
        therapist: '🧘 Therapist Login',
        patient: '🧑 Patient Login'
    };
    
    document.getElementById('loginTitle').textContent = titles[role] || 'Login';
    document.getElementById('loginAlert').innerHTML = '';
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
}

async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const alertDiv = document.getElementById('loginAlert');
    const loginBtn = document.getElementById('loginBtn');
    const loginText = document.getElementById('loginText');
    const loginLoading = document.getElementById('loginLoading');
    
    loginText.style.display = 'none';
    loginLoading.style.display = 'inline-block';
    loginBtn.disabled = true;
    alertDiv.innerHTML = '';

    if (!selectedLoginRole) {
        alertDiv.innerHTML = '<div class="alert alert-error">❌ An internal error occurred. Please go back and select your role again.</div>';
        loginText.style.display = 'inline';
        loginLoading.style.display = 'none';
        loginBtn.disabled = false;
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, role: selectedLoginRole })
        });

        const data = await response.json(); 

        if (!response.ok) {
            throw new Error(data.message || 'Invalid email or password');
        }

        currentUser = data; 
        sessionStorage.setItem('ayurUser', JSON.stringify(currentUser));
        
        alertDiv.innerHTML = '<div class="alert alert-success">✅ Login successful! Redirecting...</div>';
        
        setTimeout(() => {
            showDashboard(currentUser.role);
            document.getElementById('username').value = '';
            document.getElementById('password').value = '';
            showNotification('Welcome!', `Successfully logged in as ${currentUser.full_name}`);
        }, 500);

    } catch (error) {
        alertDiv.innerHTML = '<div class="alert alert-error">❌ ' + error.message + '</div>';
    } finally {
        loginText.style.display = 'inline';
        loginLoading.style.display = 'none';
        loginBtn.disabled = false;
    }
}

async function logout() {
    currentUser = null;
    userCache = []; // Clear user cache
    sessionStorage.removeItem('ayurUser');
    showRoleSelection(); // Go back to the main login page
    showNotification('Logged Out', 'You have been successfully logged out');
}

function hideAllDashboards() {
    const dashboards = ['adminDashboard', 'doctorDashboard', 'therapistDashboard', 'patientDashboard'];
    dashboards.forEach(dashboard => {
        const element = document.getElementById(dashboard);
        if (element) {
            element.classList.remove('active');
        }
    });
}

function hideAllModals() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.classList.remove('active');
    });
}

function showTab(event, tabId) {
    const currentDashboard = document.querySelector('.dashboard.active');
    if (!currentDashboard) return;
    
    const tabContents = currentDashboard.querySelectorAll('.tab-content');
    tabContents.forEach(content => content.classList.remove('active'));
    
    const tabs = currentDashboard.querySelectorAll('.nav-tab');
    tabs.forEach(tab => tab.classList.remove('active'));
    
    const tabEl = document.getElementById(tabId);
    if(tabEl) tabEl.classList.add('active');
    if(event.target) event.target.classList.add('active');
}

// --- Master Dashboard Loader ---

function showDashboard(role) {
    hideAllModals(); // Close any open modals
    
    document.getElementById('roleSelection').classList.remove('active');
    document.getElementById('loginScreen').classList.remove('active');
    hideAllDashboards(); 
    
    const dashboardId = role + 'Dashboard';
    const dashboardEl = document.getElementById(dashboardId);
    
    if (!dashboardEl) {
        console.error(`Dashboard element not found: ${dashboardId}`);
        showRoleSelection(); 
        return;
    }
    
    dashboardEl.classList.add('active');
    
    const firstTab = dashboardEl.querySelector('.nav-tab');
    const firstTabContent = dashboardEl.querySelector('.tab-content');
    if (firstTab) {
         dashboardEl.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
         dashboardEl.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
         firstTab.classList.add('active');
    }
     if (firstTabContent) {
        firstTabContent.classList.add('active');
    }
    
    // --- Load ALL dashboard-specific data ---
    
    if (role === 'admin') {
        document.getElementById('adminName').textContent = currentUser.full_name;
        document.getElementById('adminAvatar').textContent = currentUser.full_name.charAt(0).toUpperCase();
        
        loadUsersTable();
        loadScheduleTable(); 
        updateAdminStats(); 
        populatePatientReportDropdown();
        
    } else if (role === 'doctor') {
        document.getElementById('doctorName').textContent = currentUser.full_name;
        document.getElementById('doctorDesignation').textContent = currentUser.designation || 'Doctor';
        document.getElementById('doctorAvatar').textContent = currentUser.full_name.charAt(0).toUpperCase();
        
        loadPatientsTable();
        loadPrescriptionsTable();
        loadDoctorSchedule();
        updateDoctorStats();
        populatePatientDropdown(); 
        populateTherapistDropdown();
        loadDoctorFeedback(); 
        loadBlockedSlots();
        
    } else if (role === 'therapist') {
        document.getElementById('therapistName').textContent = currentUser.full_name;
        document.getElementById('therapistDesignation').textContent = currentUser.designation || 'Therapist';
        document.getElementById('therapistAvatar').textContent = currentUser.full_name.charAt(0).toUpperCase();
        
        loadTodaySessions();
        loadTherapistPatients();
        updateTherapistStats();
        populateTherapistPatientDropdown();
        loadTherapistFeedback();
        loadBlockedSlots();
        
    } else if (role === 'patient') {
        document.getElementById('patientName').textContent = currentUser.full_name;
        document.getElementById('patientId').textContent = `Patient ID: #${currentUser._id.slice(-6)}`; 
        document.getElementById('patientAvatar').textContent = currentUser.full_name.charAt(0).toUpperCase();
        
        loadPatientAppointments();
        loadPatientTreatmentPlan();
        loadPatientProfile();
        updatePatientStats();
        populateTherapistDropdown();
        populateDoctorDropdown();
        loadPatientPayments();
        loadFeedbackForm();
    }
}

// --- Modal & Notification Functions ---

function showNotification(title, message, type = 'info') {
    const notification = document.getElementById('notification');
    const titleEl = document.getElementById('notificationTitle');
    const messageEl = document.getElementById('notificationMessage');
    
    if (!notification || !titleEl || !messageEl) {
        console.error('Notification elements not found');
        return;
    }
    
    titleEl.textContent = title;
    messageEl.textContent = message;
    
    notification.classList.remove('show', 'error');
    
    if (type === 'error') {
         notification.style.borderLeftColor = '#dc3545';
    } else {
         notification.style.borderLeftColor = '#667eea';
    }
    
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 4000);
}

function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if(modal) modal.classList.add('active');
}

function closeModal(modalId) {
     const modal = document.getElementById(modalId);
     if(modal) modal.classList.remove('active');
}

// --- Registration Flow Functions ---

function triggerRegistration(event) {
    event.preventDefault(); 
    if (selectedLoginRole) {
        openRegistrationForm(selectedLoginRole);
    } else {
        showNotification('Error', 'Please go back and select your role first.', 'error');
        showRoleSelection();
    }
}

function openRegistrationForm(role) {
    const roleSelect = document.getElementById('regRole');
    if (roleSelect) {
        roleSelect.value = role;
        // roleSelect.disabled = true; // Optional: lock the role
    }
    showModal('registrationFormModal');
}

async function submitRegistration(event) {
    event.preventDefault();
    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;
    const role = document.getElementById('regRole').value;

    if (!name || !email || !password || !role) {
        showNotification('Error', 'All fields are required', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/auth/register`, { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ full_name: name, email, password, role })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Registration failed');
        }

        if (currentUser && currentUser.role === 'admin') {
            loadUsersTable();
            updateAdminStats();
        }

        closeModal('registrationFormModal');
        document.getElementById('registrationForm').reset();
        
        document.getElementById('username').value = email;
        document.getElementById('password').value = '';
        showLogin(role); // Go back to the login screen for this role
        showNotification('Registration Successful', 'Account created. Please log in.');
        
    } catch (error) {
        showNotification('Error', error.message, 'error');
    }
}

// --- Admin Functions ---

async function loadUsersTable(filteredUsers = null, totalUserCount = null) {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;

    let displayUsers = [];
    let totalCount = 0;
    
    try {
        if (filteredUsers !== null) { 
            displayUsers = filteredUsers;
            totalCount = totalUserCount; 
        } else {
            displayUsers = await authFetch(`${API_URL}/users`);
            userCache = displayUsers; 
            totalCount = displayUsers.length;
        }

        if (displayUsers.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align: center;">No users found.</td></tr>`;
        } else {
            tbody.innerHTML = displayUsers.map(user => `
                <tr title="Click to view details">
                    <td>
                        <div style="font-weight: 600;">${user.full_name}</div>
                        <div style="font-size: 12px; color: #6c757d;">${user.designation || 'N/A'}</div>
                    </td>
                    <td><span class="badge badge-info">${user.role}</span></td>
                    <td>${user.email}</td>
                    <td><span class="badge badge-${user.status === 'active' ? 'success' : 'warning'}">${user.status}</span></td>
                    <td>
                        ${user.role === 'patient' && user.assignedDoctor ? 
                            `Dr. ${user.assignedDoctor.full_name}` : 
                            formatDate(user.lastLogin)}
                    </td>
                    <td><button class="btn btn-small" onclick="event.stopPropagation(); editUser('${user._id}')">Edit</button></td>
                </tr>
            `).join('');
        }
        
        updateFilterResults(displayUsers.length, totalCount);

    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: red;">Error loading users: ${error.message}</td></tr>`;
    }
}

function filterUsers() { 
    try {
        const searchTerm = document.getElementById('userSearch')?.value.toLowerCase().trim() || '';
        const roleFilter = document.getElementById('roleFilter')?.value.toLowerCase() || '';
        const statusFilter = document.getElementById('statusFilter')?.value.toLowerCase() || '';
        
        const filteredUsers = userCache.filter(user => { 
            const matchesSearch = !searchTerm || 
                user.full_name.toLowerCase().includes(searchTerm) ||
                user.email.toLowerCase().includes(searchTerm) ||
                (user.designation && user.designation.toLowerCase().includes(searchTerm));
            
            const matchesRole = !roleFilter || user.role.toLowerCase() === roleFilter;
            const matchesStatus = !statusFilter || user.status.toLowerCase() === statusFilter;
            
            return matchesSearch && matchesRole && matchesStatus;
        });
        
        loadUsersTable(filteredUsers, userCache.length); 
    } catch (error) {
        showNotification('Error', `Could not filter users: ${error.message}`, 'error');
    }
}

function updateFilterResults(showing, total) {
    const resultsDiv = document.getElementById('filterResults');
    if (!resultsDiv) return;
    
    if (showing === total) {
        resultsDiv.innerHTML = `Showing all <strong>${total}</strong> users`;
    } else {
        resultsDiv.innerHTML = `Showing <strong>${showing}</strong> of <strong>${total}</strong> users`;
    }
}

function clearFilters() {
    const userSearch = document.getElementById('userSearch');
    const roleFilter = document.getElementById('roleFilter');
    const statusFilter = document.getElementById('statusFilter');
    
    if (userSearch) userSearch.value = '';
    if (roleFilter) roleFilter.value = '';
    if (statusFilter) statusFilter.value = '';
    
    filterUsers();
    showNotification('Filters Cleared', 'All filters have been reset');
}

async function editUser(userId) {
    try {
        const user = await authFetch(`${API_URL}/users/${userId}`);
        
        editingUserId = user._id; 
        document.getElementById('editUserId').value = user._id;
        document.getElementById('editUserName').value = user.full_name;
        document.getElementById('editUserEmail').value = user.email;
        document.getElementById('editUserPhone').value = user.phone || '';
        document.getElementById('editUserRole').value = user.role;
        document.getElementById('editUserStatus').value = user.status;
        document.getElementById('editUserDesignation').value = user.designation || '';

        const allUsers = await authFetch(`${API_URL}/users`);
        const doctors = allUsers.filter(u => u.role === 'doctor');
        
        const form = document.querySelector('#editUserModal .form-grid');
        let doctorGroup = document.getElementById('edit-doctor-group');
        if (!doctorGroup) {
             doctorGroup = document.createElement('div');
             doctorGroup.id = 'edit-doctor-group';
             doctorGroup.className = 'form-group';
             doctorGroup.innerHTML = '<label>Assigned Doctor (if Patient)</label>';
             form.appendChild(doctorGroup);
        }
        
        const oldSelect = document.getElementById('editUserAssignedDoctor');
        if (oldSelect) oldSelect.remove();
        
        const doctorSelect = document.createElement('select');
        doctorSelect.id = 'editUserAssignedDoctor';
        doctorSelect.style = "width: 100%; padding: 15px 20px; border: 2px solid #e1e5e9; border-radius: 12px; font-size: 1rem; background: rgba(255,255,255,0.9);";
        
        doctorSelect.innerHTML = '<option value="">-- No Doctor Assigned --</option>';
        doctors.forEach(doc => {
            const isSelected = user.assignedDoctor && user.assignedDoctor._id === doc._id;
            doctorSelect.innerHTML += `<option value="${doc._id}" ${isSelected ? 'selected' : ''}>${doc.full_name}</option>`;
        });
        
        doctorGroup.appendChild(doctorSelect);

        showModal('editUserModal');
    } catch (error) {
        showNotification('Error', `Could not load user: ${error.message}`, 'error');
    }
}

async function saveUserEdit(event) {
    event.preventDefault();
    const userId = document.getElementById('editUserId').value;
    const doctorSelect = document.getElementById('editUserAssignedDoctor');
    
    const userData = {
        full_name: document.getElementById('editUserName').value,
        email: document.getElementById('editUserEmail').value,
        phone: document.getElementById('editUserPhone').value,
        role: document.getElementById('editUserRole').value,
        status: document.getElementById('editUserStatus').value,
        designation: document.getElementById('editUserDesignation').value,
        assignedDoctor: doctorSelect ? doctorSelect.value : null
    };

    try {
        await authFetch(`${API_URL}/users/${userId}`, {
            method: 'PUT',
            body: JSON.stringify(userData)
        });
        
        loadUsersTable(); 
        updateAdminStats();
        closeModal('editUserModal');
        showNotification('User Updated', 'User information has been successfully updated');
    } catch (error) {
        showNotification('Error', error.message, 'error');
    }
}

async function deleteUser() {
    const userId = document.getElementById('editUserId').value;
    
    if (!confirm('Are you sure you want to delete this user? This cannot be undone.')) {
        return;
    }

    try {
        await authFetch(`${API_URL}/users/${userId}`, {
            method: 'DELETE'
        });

        loadUsersTable();
        updateAdminStats();
        closeModal('editUserModal');
        showNotification('User Deleted', 'User has been successfully removed');
    } catch (error) {
        showNotification('Error', error.message, 'error');
    }
}

async function updateAdminStats() {
    try {
        const users = await authFetch(`${API_URL}/users`);
        const appointments = await authFetch(`${API_URL}/appointments`);
        
        const totalPatients = users.filter(u => u.role === 'patient').length;
        const activeDoctors = users.filter(u => u.role === 'doctor' && u.status === 'active').length;
        const activeTherapists = users.filter(u => u.role === 'therapist' && u.status === 'active').length;
        
        const completedAppointments = appointments.filter(a => a.status === 'completed');
        const today = getTodayDateStr();
        const newRegistrations = users.filter(u => u.createdAt && u.createdAt.startsWith(today)).length;
        
        // --- Update MAIN Dashboard Cards ---
        document.getElementById('totalPatients').textContent = totalPatients;
        document.getElementById('activeDoctors').textContent = activeDoctors;
        document.getElementById('activeTherapists').textContent = activeTherapists;
        document.getElementById('todaySessions').textContent = appointments.filter(a => 
            getLocalDateStr(a.appointment_date) === today && a.status !== 'cancelled'
        ).length;

        // --- Update REPORT Tab Cards ---
        document.getElementById('adminReportTotalPatients').textContent = totalPatients;
        document.getElementById('adminReportTreatmentsCompleted').textContent = completedAppointments.length;
        document.getElementById('adminReportNewRegistrations').textContent = newRegistrations;
        
        if (appointments.length > 0) {
            const progress = (completedAppointments.length / appointments.length) * 100;
            document.getElementById('adminReportTreatmentProgress').textContent = `${progress.toFixed(0)}%`;
        } else {
            document.getElementById('adminReportTreatmentProgress').textContent = '0%';
        }

    } catch (error) {
        console.error("Error updating admin stats:", error);
    }
}

async function loadScheduleTable() {
    const tbody = document.getElementById('scheduleTableBody');
    if (!tbody) return;
    
    try {
        const appointments = await authFetch(`${API_URL}/appointments`);
        
        if (appointments.length === 0) {
             tbody.innerHTML = `<tr><td colspan="9" style="text-align: center;">No appointments found in the system.</td></tr>`;
             return;
        }

        tbody.innerHTML = appointments.map(session => {
            const patient = session.patientId ? session.patientId.full_name : 'Unknown';
            const doctor = session.doctorId ? session.doctorId.full_name : 'N/A';
            const therapist = session.therapistId ? session.therapistId.full_name : 'N/A';
            const status = session.status; 

            let paymentCell = '';
            let actionCell = '';

            if (status === 'completed') {
                if (session.isPaid) {
                    paymentCell = `<span class="badge badge-success">₹${session.cost} (Paid)</span>`;
                    actionCell = `<button class="btn btn-small" onclick="showReceipt('${session._id}')">View Receipt</button>`;
                } else {
                    paymentCell = `<span class="badge badge-warning">₹${session.cost} (Pending)</span>`;
                    actionCell = `<button class="btn btn-small" style="background: #ffc107; color: #333;" onclick="markAsPaidByAdmin('${session._id}')">Mark Paid</button>`;
                }
            } else {
                paymentCell = `<span class="badge badge-info">₹${session.cost} (Due)</span>`;
                actionCell = `(Not completable)`;
            }
            
            return `
                <tr>
                    <td>${formatDate(session.appointment_date)}</td>
                    <td>${formatTime(session.appointment_time)}</td>
                    <td>${patient}</td>
                    <td>${doctor}</td>
                    <td>${therapist}</td>
                    <td>${session.treatment}</td>
                    <td><span class="badge badge-${getStatusBadge(status)}">${status}</span></td> 
                    <td>${paymentCell}</td>
                    <td>${actionCell}</td>
                </tr>
            `
        }).join('');
    } catch (error) {
         tbody.innerHTML = `<tr><td colspan="9" style="color: red; text-align: center;">Error loading schedule: ${error.message}</td></tr>`;
    }
}

async function markAsPaidByAdmin(appointmentId) {
    if (!confirm('Are you sure you want to mark this appointment as paid?')) {
        return;
    }
    
    try {
        await authFetch(`${API_URL}/appointments/${appointmentId}/pay`, {
            method: 'PUT'
        });
        
        showNotification('Payment Confirmed', 'The appointment has been marked as paid.');
        
        loadScheduleTable();
        if (currentUser.role === 'patient') {
             loadPatientPayments();
        }

    } catch (error) {
        showNotification('Error', 'Could not mark as paid.', 'error');
    }
}

function saveSettings() {
    showNotification('Settings Saved', 'System settings have been successfully updated (Demo)');
}

// --- Report Functions ---

async function populatePatientReportDropdown() {
    const datalist = document.getElementById('patient-report-list'); 
    if (!datalist) return;
    
    try {
        const patients = await authFetch(`${API_URL}/users?role=patient`);
        datalist.innerHTML = ''; // Clear old options
        patients.forEach(p => {
            datalist.innerHTML += `<option value="${p.full_name}" data-id="${p._id}"></option>`;
        });
    } catch (error) {
        console.error("Failed to load patients for report dropdown:", error);
    }
}

async function generatePatientReport() {
    const patientName = document.getElementById('reportPatientInput').value;
    if (!patientName) {
        showNotification('Error', 'Please select a patient first.', 'error');
        return;
    }

    const patientOption = document.querySelector(`#patient-report-list option[value="${patientName}"]`);
    if (!patientOption) {
        showNotification('Error', 'Invalid patient selected. Please choose from the list.', 'error');
        return;
    }
    const patientId = patientOption.dataset.id; 

    showNotification('Generating...', 'Fetching patient data, please wait.');

    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const reportData = await authFetch(`${API_URL}/reports/patient/${patientId}`);
        const { user, appointments, prescriptions, notes } = reportData;

        // --- Build the PDF ---
        let y = 20; 
        doc.setFontSize(22); doc.text('AyurSutra Patient Report', 20, y); y += 15;
        doc.setFontSize(16); doc.text('Patient Details', 20, y); y += 7;
        doc.setFontSize(12);
        doc.text(`Name: ${user.full_name}`, 20, y); doc.text(`Email: ${user.email}`, 100, y); y += 7;
        doc.text(`Phone: ${user.phone || 'N/A'}`, 20, y); doc.text(`Assigned Doctor: ${user.assignedDoctor ? user.assignedDoctor.full_name : 'N/A'}`, 100, y); y += 7;
        doc.text(`Condition: ${user.condition || 'N/A'}`, 20, y); y += 15;
        
        doc.setFontSize(16); doc.text('Prescriptions', 20, y); y += 7; doc.setFontSize(10);
        if (prescriptions.length === 0) { doc.text('No prescriptions found.', 20, y); y += 10; }
        else {
            prescriptions.forEach(p => {
                if (y > 270) { doc.addPage(); y = 20; }
                doc.text(`- Treatment: ${p.treatment} (${p.status})`, 25, y); y += 5;
                doc.text(`  Prescribed by: Dr. ${p.doctorId.full_name}`, 25, y); y += 5;
                doc.text(`  Progress: ${p.progressCompleted} / ${p.duration} sessions`, 25, y); y += 7;
            });
        }
        y += 10;
        
        doc.setFontSize(16); doc.text('Appointment History', 20, y); y += 7; doc.setFontSize(10);
        if (appointments.length === 0) { doc.text('No appointments found.', 20, y); y += 10; }
        else {
            appointments.forEach(a => {
                if (y > 270) { doc.addPage(); y = 20; }
                const staff = a.therapistId ? a.therapistId.full_name : (a.doctorId ? a.doctorId.full_name : 'Unknown');
                doc.text(`- ${formatDate(a.appointment_date)}: ${a.treatment} with ${staff} (${a.status})`, 25, y); y += 7;
            });
        }
        y += 10;
        
        doc.setFontSize(16); doc.text('Doctor & Therapist Notes', 20, y); y += 7; doc.setFontSize(10);
        if (notes.length === 0) { doc.text('No notes found.', 20, y); y += 10; }
        else {
            notes.forEach(n => {
                if (y > 270) { doc.addPage(); y = 20; }
                doc.text(`- ${formatDate(n.createdAt)} (${n.authorId.full_name}):`, 25, y); y += 5;
                const noteLines = doc.splitTextToSize(n.note, 150);
                doc.text(noteLines, 30, y);
                y += (noteLines.length * 5) + 3;
            });
        }

        // --- Show the Preview ---
        const pdfDataUri = doc.output('datauristring');
        document.getElementById('pdfPreviewFrame').src = pdfDataUri;
        document.getElementById('pdfPreviewTitle').textContent = `Report: ${user.full_name}`;
        
        const saveName = `Patient_Report_${user.full_name.replace(' ', '_')}.pdf`;
        document.getElementById('pdfSaveBtn').onclick = () => doc.save(saveName);
        document.getElementById('pdfPrintBtn').onclick = () => printReceipt();
        
        showModal('pdfPreviewModal');
        document.getElementById('reportPatientInput').value = ""; // Clear input

    } catch (error) {
        console.error('Error generating report:', error);
        showNotification('Error', error.message, 'error');
    }
}

// --- Doctor Functions ---

async function loadPatientsTable() {
    const tbody = document.getElementById('patientsTableBody');
    if (!tbody) return;

    try {
        const patients = await authFetch(`${API_URL}/users?role=patient`);
        
        if (patients.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align: center;">No patients found.</td></tr>`;
            return;
        }

        tbody.innerHTML = patients.map(patient => `
            <tr>
                <td>${patient.full_name}</td>
                <td>${patient.age || 'N/A'}</td>
                <td>${patient.condition || 'N/A'}</td>
                <td>${formatDate(patient.lastLogin)}</td>
                <td><span class="badge badge-${patient.status === 'active' ? 'success' : 'warning'}">${patient.status}</span></td>
                <td><button class="btn btn-small" onclick="viewPatientDetails('${patient._id}')">View Details</button></td>
            </tr>
        `).join('');
    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: red;">Error loading patients: ${error.message}</td></tr>`;
    }
}

async function loadPrescriptionsTable() {
    const tbody = document.getElementById('prescriptionsTableBody');
    if (!tbody) return;

    try {
        const prescriptions = await authFetch(`${API_URL}/prescriptions/doctor/${currentUser._id}`);

        if (prescriptions.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align: center;">No prescriptions found.</td></tr>`;
            return;
        }

        tbody.innerHTML = prescriptions.map(p => {
            const patient = p.patientId ? p.patientId.full_name : 'Unknown';
            const therapist = p.therapistId ? p.therapistId.full_name : 'N/A';
            const progress = p.progressCompleted;
            const total = p.duration;
            const percentage = total > 0 ? (progress / total) * 100 : 0;
            
            return `
                <tr>
                    <td>${patient}</td>
                    <td>${p.treatment}</td>
                    <td>${p.duration} days</td>
                    <td>${therapist}</td>
                    <td>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${percentage}%;"></div>
                        </div>
                        ${progress}/${total} sessions
                    </td>
                    <td><span class="badge badge-${p.status === 'in-progress' ? 'warning' : 'success'}">${p.status}</span></td>
                    <td><button class="btn btn-small" onclick="editPrescriptionProgress('${p._id}')">Update</button></td>
                </tr>
            `;
        }).join('');
    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: red;">Error loading prescriptions: ${error.message}</td></tr>`;
    }
}

async function loadDoctorSchedule() {
    const tbody = document.getElementById('doctorScheduleBody');
    if (!tbody) return;

    try {
        const appointments = await authFetch(`${API_URL}/appointments?doctorId=${currentUser._id}`);

        if (appointments.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align: center;">No consultations scheduled.</td></tr>`;
            return;
        }

        tbody.innerHTML = appointments.map(a => {
            const patient = a.patientId ? a.patientId.full_name : 'Unknown';
            return `
                <tr>
                    <td>${formatDate(a.appointment_date)}</td>
                    <td>${formatTime(a.appointment_time)}</td>
                    <td>${patient}</td>
                    <td>${a.treatment}</td>
                    <td><span class="badge badge-${getStatusBadge(a.status)}">${a.status}</span></td>
                    <td>
                        <button class="btn btn-small" style="background: #28a745;" onclick="updateAppointmentStatus('${a._id}', 'confirmed')">Confirm</button>
                        <button class="btn btn-small" style="background: #dc3545;" onclick="updateAppointmentStatus('${a._id}', 'cancelled')">Cancel</button>
                    </td>
                </tr>
            `;
        }).join('');
    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: red;">Error loading schedule: ${error.message}</td></tr>`;
    }
}

async function updateDoctorStats() {
    try {
        const prescriptions = await authFetch(`${API_URL}/prescriptions/doctor/${currentUser._id}`);
        const appointments = await authFetch(`${API_URL}/appointments?doctorId=${currentUser._id}`);
        
        const myPatientIds = new Set(prescriptions.map(p => p.patientId));
        document.getElementById('doctorActivePatients').textContent = myPatientIds.size;
        
        const today = getTodayDateStr();
        document.getElementById('doctorConsultations').textContent = appointments.filter(a => 
            getLocalDateStr(a.appointment_date) === today && a.status !== 'cancelled'
        ).length;
        
        document.getElementById('doctorTreatmentsPrescribed').textContent = prescriptions.length;
    } catch (error) {
        console.error("Error updating doctor stats:", error);
    }
}

async function viewPatientDetails(patientId) {
    try {
        const patient = await authFetch(`${API_URL}/users/${patientId}`);
        const patientNotes = await authFetch(`${API_URL}/notes/patient/${patientId}`);
        
        if (!patient) return;
        
        const content = `
            <div style="padding: 20px;">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                    <div><strong>Name:</strong> ${patient.full_name}</div>
                    <div><strong>Age:</strong> ${patient.age || 'N/A'}</div>
                    <div><strong>Gender:</strong> ${patient.gender || 'N/A'}</div>
                    <div><strong>Phone:</strong> ${patient.phone || 'N/A'}</div>
                    <div><strong>Email:</strong> ${patient.email || 'N/A'}</div>
                    <div><strong>Blood Group:</strong> ${patient.bloodGroup || 'N/A'}</div>
                    <div><strong>Condition:</strong> ${patient.condition || 'N/A'}</div>
                    <div><strong>Status:</strong> <span class="badge badge-${patient.status === 'active' ? 'success' : 'warning'}">${patient.status}</span></div>
                </div>
                
                <h4>Recent Notes</h4>
                <div style="max-height: 300px; overflow-y: auto;">
                    ${patientNotes.length > 0 ? patientNotes.map(note => `
                        <div style="background: #e8f5e8; padding: 15px; border-radius: 8px; margin-bottom: 10px; border-left: 4px solid #28a745;">
                            <p>${note.note}</p>
                            <small style="color: #6c757d;">- ${note.authorId.full_name} (${note.authorId.role}) on ${formatDate(note.createdAt)}</small>
                        </div>
                    `).join('') : '<p>No notes available</p>'}
                </div>
            </div>
        `;
        
        document.getElementById('patientDetailsContent').innerHTML = content;
        showModal('patientDetailsModal');
    } catch (error) {
        showNotification('Error', error.message, 'error');
    }
}

async function populatePatientDropdown() {
    const select = document.getElementById('prescriptionPatient');
    if (!select) return;
    try {
        const patients = await authFetch(`${API_URL}/users?role=patient`);
        select.innerHTML = '<option value="">Select Patient</option>';
        patients.forEach(p => {
            select.innerHTML += `<option value="${p._id}">${p.full_name}</option>`;
        });
    } catch (error) {
        console.error("Failed to load patients for dropdown:", error);
    }
}

async function populateTherapistDropdown() {
    const selects = [
        document.getElementById('preferredTherapist'),
        document.getElementById('prescriptionTherapist')
    ];
    
    try {
        const therapists = await authFetch(`${API_URL}/users?role=therapist`);
        selects.forEach(select => {
            if (select) {
                const firstOption = select.options[0].outerHTML;
                select.innerHTML = firstOption; 
                therapists.forEach(t => {
                    select.innerHTML += `<option value="${t._id}">${t.full_name}</option>`;
                });
            }
        });
    } catch (error) {
        console.error("Failed to load therapists for dropdown:", error);
    }
}

async function savePrescription(event) {
    event.preventDefault();
    
    const prescriptionData = {
        patientId: document.getElementById('prescriptionPatient').value,
        doctorId: currentUser._id, 
        therapistId: document.getElementById('prescriptionTherapist').value,
        treatment: document.getElementById('prescriptionTreatment').value,
        duration: parseInt(document.getElementById('prescriptionDuration').value),
        plan: document.getElementById('prescriptionPlan').value,
        notes: document.getElementById('prescriptionNotes').value,
    };

    try {
        await authFetch(`${API_URL}/prescriptions`, {
            method: 'POST',
            body: JSON.stringify(prescriptionData)
        });

        loadPrescriptionsTable();
        updateDoctorStats();
        
        closeModal('createPrescriptionModal');
        showNotification('Prescription Created', 'New prescription has been successfully created');
        event.target.reset();
    } catch (error) {
        showNotification('Error', error.message, 'error');
    }
}

async function editPrescriptionProgress(prescriptionId) {
    try {
        const prescription = await authFetch(`${API_URL}/prescriptions/${prescriptionId}`);
        if (!prescription) return;
        
        document.getElementById('progressPrescriptionId').value = prescription._id;
        document.getElementById('progressCompleted').value = prescription.progressCompleted;
        document.getElementById('progressTotal').value = prescription.duration;
        
        showModal('editProgressModal');
    } catch (error) {
        showNotification('Error', error.message, 'error');
    }
}

async function saveProgress(event) {
    event.preventDefault();
    const prescriptionId = document.getElementById('progressPrescriptionId').value;
    const progressCompleted = parseInt(document.getElementById('progressCompleted').value);

    try {
        await authFetch(`${API_URL}/prescriptions/${prescriptionId}/progress`, {
            method: 'PUT',
            body: JSON.stringify({ progressCompleted })
        });

        loadPrescriptionsTable();
        closeModal('editProgressModal');
        showNotification('Progress Updated', 'Treatment progress has been successfully updated');
    } catch (error) {
        showNotification('Error', error.message, 'error');
    }
}

// ⭐️ NEW FUNCTION
// Loads feedback for the doctor dashboard
async function loadDoctorFeedback() {
    const display = document.getElementById('doctorFeedbackDisplay');
    if (!display) return;

    try {
        const feedbackList = await authFetch(`${API_URL}/feedback/doctor`);
        if (feedbackList.length === 0) {
            display.innerHTML = '<p>No patient feedback submitted yet.</p>';
            return;
        }

        display.innerHTML = feedbackList.map(fb => `
            <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin-bottom: 10px; border-left: 4px solid #667eea;">
                <p><strong>${fb.patientId.full_name}</strong> - ${renderStars(fb.doctorRating)}</p>
                <p style="font-style: italic;">"${fb.doctorFeedback || 'No comment'}"</p>
                <small style="color: #6c757d;">${formatDate(fb.createdAt)}</small>
            </div>
        `).join('');

    } catch (error) {
        display.innerHTML = '<p style="color: red;">Could not load feedback.</p>';
    }
}

// ⭐️ NEW FUNCTION: Renders the list of blocked slots
function loadBlockedSlots() {
    const listDiv = document.getElementById('blockedSlotsList');
    if (!listDiv) return; // Only runs on doctor/therapist dashboards

    const slots = currentUser.blockedSlots || [];

    if (slots.length === 0) {
        listDiv.innerHTML = '<p>No blocked slots found.</p>';
        return;
    }

    listDiv.innerHTML = slots.map(slot => `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px; border-bottom: 1px solid #eee;">
            <span>${formatDate(slot.date)} at ${formatTime(slot.time)}</span>
            <button class="btn btn-small" style="background: #6c757d;" onclick="deleteBlockedSlot('${slot._id}')">Remove</button>
        </div>
    `).join('');
}

// ⭐️ NEW FUNCTION: Handles the "Block Slot" form
async function addBlockedSlot(event) {
    event.preventDefault();
    const date = document.getElementById('blockDate').value;
    const time = document.getElementById('blockTime').value;

    try {
        const updatedUser = await authFetch(`${API_URL}/users/profile/block-slot`, {
            method: 'POST',
            body: JSON.stringify({ date, time })
        });
        
        // Update current user in session and refresh list
        currentUser = { ...currentUser, ...updatedUser };
        sessionStorage.setItem('ayurUser', JSON.stringify(currentUser));
        loadBlockedSlots();
        showNotification('Slot Blocked', 'The time slot has been successfully blocked.');
        
        event.target.reset(); // Clear the form

    } catch (error) {
        showNotification('Error', error.message, 'error');
    }
}

// ⭐️ NEW FUNCTION: Deletes a blocked slot
async function deleteBlockedSlot(slotId) {
    if (!confirm('Are you sure you want to unblock this time slot?')) return;

    try {
        const updatedUser = await authFetch(`${API_URL}/users/profile/unblock-slot/${slotId}`, {
            method: 'DELETE'
        });

        // Update current user in session and refresh list
        currentUser = { ...currentUser, ...updatedUser };
        sessionStorage.setItem('ayurUser', JSON.stringify(currentUser));
        loadBlockedSlots();
        showNotification('Slot Unblocked', 'The time slot is now available.');

    } catch (error) {
        showNotification('Error', error.message, 'error');
    }
}
// --- Therapist Functions ---

async function loadTodaySessions() {
    const tbody = document.getElementById('todaySessionsBody');
    if (!tbody) return;

    try {
        const appointments = await authFetch(`${API_URL}/appointments?therapistId=${currentUser._id}`);
        const today = getTodayDateStr();
        const sessions = appointments.filter(a => getLocalDateStr(a.appointment_date) === today && a.status !== 'cancelled');

        if (sessions.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 20px;">No sessions scheduled for today.</td></tr>`;
            return;
        }

        tbody.innerHTML = sessions.map(session => {
            const patient = session.patientId ? session.patientId.full_name : 'Unknown';
            let actionButton = '';

            if (session.status === 'scheduled') {
                actionButton = `<button class="btn btn-small" style="background: #28a745;" onclick="startSession('${session._id}', 'scheduled', '${session.patientId._id}')">Start</button>`;
            } else if (session.status === 'in-progress') {
                actionButton = `<button class="btn btn-small" style="background: #ffc107; color: #333;" onclick="startSession('${session._id}', 'in-progress', '${session.patientId._id}')">Complete</button>`;
            } else if (session.status === 'completed') {
                actionButton = `<button class="btn btn-small" onclick="showNotesModal('${session.patientId._id}')">View/Add Notes</button>`;
            }
            
            return `
                <tr>
                    <td>${formatTime(session.appointment_time)}</td>
                    <td>${patient}</td>
                    <td>${session.treatment}</td>
                    <td>60 mins</td> 
                    <td><span class="badge badge-${getStatusBadge(session.status)}">${session.status}</span></td>
                    <td>${actionButton}</td>
                </tr>
            `;
        }).join('');
    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: red;">Error loading sessions: ${error.message}</td></tr>`;
    }
}

async function startSession(sessionId, currentStatus, patientId) {
    try {
        let newStatus = '';
        if (currentStatus === 'scheduled') {
            newStatus = 'in-progress';
            showNotification('Session Started', `Session has been started`);
        } else if (currentStatus === 'in-progress') {
            newStatus = 'completed';
            showNotification('Session Completed', `Session has been completed`);
            
            const prescriptions = await authFetch(`${API_URL}/prescriptions/therapist/${currentUser._id}`);
            const prescription = prescriptions.find(p => p.patientId._id === patientId && p.status === 'in-progress');
            
            if (prescription) {
                const newProgress = prescription.progressCompleted + 1;
                await authFetch(`${API_URL}/prescriptions/${prescription._id}/progress`, {
                    method: 'PUT',
                    body: JSON.stringify({ progressCompleted: newProgress })
                });
            }
        } else {
            console.error('startSession called with unexpected status:', currentStatus);
            return; 
        }

        await authFetch(`${API_URL}/appointments/${sessionId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status: newStatus })
        });

        loadTodaySessions();
        updateTherapistStats();

    } catch (error) {
        showNotification('Error', error.message, 'error');
    }
}

async function loadTherapistPatients() {
    const tbody = document.getElementById('therapistPatientsBody');
    if (!tbody) return;

    try {
        const prescriptions = await authFetch(`${API_URL}/prescriptions/therapist/${currentUser._id}`);
        
        if (prescriptions.length === 0) {
             tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 20px;">No patients currently assigned.</td></tr>`;
             return;
        }

        tbody.innerHTML = prescriptions.map(p => {
            const patient = p.patientId ? p.patientId.full_name : 'Unknown';
            const doctor = p.doctorId ? p.doctorId.full_name : 'N/A';
            const progress = p.progressCompleted;
            const total = p.duration;
            const percentage = total > 0 ? (progress / total) * 100 : 0;
            
            return `
                <tr>
                    <td>${patient}</td>
                    <td>${p.treatment}</td>
                    <td>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${percentage}%;"></div>
                        </div>
                        ${progress}/${total} days
                    </td>
                    <td>${doctor}</td>
                    <td>
                        <button 
                            class="btn btn-small" 
                            onclick="editPrescriptionProgress('${p._id}')" 
                            style="background: #ffc107; color: #333; margin-right: 5px;">
                            Update Progress
                        </button>
                        
                        <button class="btn btn-small" onclick="showNotesModal('${p.patientId._id}')">View/Add Notes</button>
                    </td>
                </tr>
            `;
        }).join('');
    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: red;">Error loading patients: ${error.message}</td></tr>`;
    }
}

async function populateTherapistPatientDropdown() {
     const select = document.getElementById('progressPatientSelect');
     if(!select) return;
     
     try {
        const prescriptions = await authFetch(`${API_URL}/prescriptions/therapist/${currentUser._id}`);
        const patientsMap = new Map();
        prescriptions.forEach(p => {
            if (p.patientId) {
                patientsMap.set(p.patientId._id, p.patientId.full_name);
            }
        });

        const patients = Array.from(patientsMap, ([id, name]) => ({ id, name }));
        
        select.innerHTML = '<option value="">-- Select Patient --</option>';
        patients.forEach(p => {
            select.innerHTML += `<option value="${p.id}">${p.name}</option>`;
        });
    } catch (error) {
        console.error("Failed to populate therapist patient dropdown:", error);
    }
}

async function loadPatientProgress() {
    const patientId = document.getElementById('progressPatientSelect').value;
    const details = document.getElementById('patientProgressDetails');
    if (!details) return;
    
    if (!patientId) {
        details.innerHTML = `<p>Please select a patient to view their progress.</p>`;
        return;
    }

    try {
        const prescriptions = await authFetch(`${API_URL}/prescriptions/therapist/${currentUser._id}`);
        const prescription = prescriptions.find(p => p.patientId._id === patientId);

        if (!prescription) {
             details.innerHTML = `<p>No active prescription found for this patient.</p>`;
             return;
        }

        const patientName = prescription.patientId.full_name;
        const progress = prescription.progressCompleted;
        const total = prescription.duration;
        const percentage = total > 0 ? (progress / total) * 100 : 0;
        
        const notes = await authFetch(`${API_URL}/notes/patient/${patientId}`);
        const latestNote = notes.length > 0 ? notes[0].note : "No recent feedback.";

        details.innerHTML = `
            <div style="background: rgba(102, 126, 234, 0.1); padding: 25px; border-radius: 15px; margin: 20px 0;">
                <h4>${patientName} - ${prescription.treatment}</h4>
                <p><strong>${progress}/${total} sessions completed:</strong> ${prescription.plan}</p>
                <div class="progress-bar" style="margin: 15px 0;">
                    <div class="progress-fill" style="width: ${percentage}%;"></div>
                </div>
                <p><strong>Doctor Notes:</strong> ${prescription.notes}</p>
                <p><strong>Latest Note:</strong> "${latestNote}"</p>
            </div>
        `;
    } catch (error) {
        details.innerHTML = `<p style="color: red;">Error loading progress: ${error.message}</p>`;
    }
}

async function saveProgress(event) {
    event.preventDefault();
    const prescriptionId = document.getElementById('progressPrescriptionId').value;
    const progressCompleted = parseInt(document.getElementById('progressCompleted').value);

    try {
        await authFetch(`${API_URL}/prescriptions/${prescriptionId}/progress`, {
            method: 'PUT',
            body: JSON.stringify({ progressCompleted })
        });

        // ⭐ UPDATED THIS SECTION to refresh the correct table
        if (currentUser.role === 'doctor') {
            loadPrescriptionsTable();
        } else if (currentUser.role === 'therapist') {
            loadTherapistPatients(); // Refresh therapist patient list
        }
        
        closeModal('editProgressModal');
        showNotification('Progress Updated', 'Treatment progress has been successfully updated');
    } catch (error) {
        showNotification('Error', error.message, 'error');
    }
}

async function updateTherapistStats() {
    try {
        const appointments = await authFetch(`${API_URL}/appointments?therapistId=${currentUser._id}`);
        
        const today = getTodayDateStr();
        const todaySessions = appointments.filter(a => 
            getLocalDateStr(a.appointment_date) === today && 
            a.status !== 'cancelled'
        );
        
        document.getElementById('therapistTodaySessions').textContent = todaySessions.length;
        document.getElementById('therapistCompleted').textContent = todaySessions.filter(s => s.status === 'completed').length;
        document.getElementById('therapistRemaining').textContent = todaySessions.filter(s => s.status === 'scheduled' || s.status === 'in-progress').length;
    } catch (error) {
        console.error("Error updating therapist stats:", error);
    }
}

async function showNotesModal(patientId) {
    const notesContent = document.getElementById('notesContent');
    if (!notesContent) return;

    try {
        const patient = await authFetch(`${API_URL}/users/${patientId}`);
        const notes = await authFetch(`${API_URL}/notes/patient/${patientId}`);
        
        document.getElementById('notesPatientId').value = patientId;
        
        if (notes.length > 0) {
            notesContent.innerHTML = notes.map(note => `
                <div style="background: #e8f5e8; padding: 15px; border-radius: 8px; margin-bottom: 10px; border-left: 4px solid #28a745;">
                    <p>${note.note}</p>
                    <small style="color: #6c757d;">- ${note.authorId.full_name} (${note.authorId.role}) on ${formatDate(note.createdAt)}</small>
                </div>
            `).join('');
        } else {
            notesContent.innerHTML = `<p>No previous notes available for ${patient.full_name}</p>`;
        }
        
        showModal('notesModal');
    } catch (error) {
        showNotification('Error', error.message, 'error');
    }
}

async function saveNote() {
    const note = document.getElementById('newNote').value;
    const patientId = document.getElementById('notesPatientId').value;
    
    if (note.trim() && patientId) {
        try {
            await authFetch(`${API_URL}/notes`, {
                method: 'POST',
                body: JSON.stringify({ patientId, note })
            });

            document.getElementById('newNote').value = '';
            showNotification('Note Saved', 'Treatment note has been successfully saved');
            showNotesModal(patientId);
        } catch (error) {
            showNotification('Error', error.message, 'error');
        }
    }
}
async function loadTherapistFeedback() {
    const display = document.getElementById('therapistFeedbackDisplay');
    if (!display) return;

    try {
        const feedbackList = await authFetch(`${API_URL}/feedback/therapist`);
        if (feedbackList.length === 0) {
            display.innerHTML = '<p>No patient feedback submitted yet.</p>';
            return;
        }

        display.innerHTML = feedbackList.map(fb => `
            <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin-bottom: 10px; border-left: 4px solid #4facfe;">
                <p><strong>${fb.patientId.full_name}</strong> - ${renderStars(fb.therapistRating)}</p>
                <p style="font-style: italic;">"${fb.therapistFeedback || 'No comment'}"</p>
                <small style="color: #6c757d;">${formatDate(fb.createdAt)}</small>
            </div>
        `).join('');

    } catch (error) {
        display.innerHTML = '<p style="color: red;">Could not load feedback.</p>';
    }
}

// --- Patient Functions ---

async function loadPatientAppointments() {
    const tbody = document.getElementById('patientAppointmentsBody');
    if (!tbody) return;

    try {
        const appointments = await authFetch(`${API_URL}/appointments?patientId=${currentUser._id}`);

        if (appointments.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 20px;">No appointments found.</td></tr>`;
            return;
        }
        
        tbody.innerHTML = appointments.map(a => {
            const staff = a.therapistId ? a.therapistId.full_name : (a.doctorId ? a.doctorId.full_name : 'N/A');
            
            let statusBadge = `<span class="badge badge-${getStatusBadge(a.status)}">${a.status}</span>`;
            let receiptButton = '-'; 
            
            if (a.status === 'completed' && a.isPaid) {
                statusBadge = `<span class="badge badge-success">Paid</span>`;
                receiptButton = `<button class="btn btn-small" onclick="showReceipt('${a._id}')">View Receipt</button>`;
            } else if (a.status === 'completed' && !a.isPaid) {
                statusBadge = `<span class="badge badge-warning">Payment Pending</span>`;
                receiptButton = `<button class="btn btn-small" style="background: #ffc107; color: #333;" onclick="showTab(event, 'patientPayments')">Pay Now</button>`;
            } else if (a.status === 'scheduled') {
                 receiptButton = `<button class="btn btn-small" style="background:#dc3545;" onclick="updateAppointmentStatus('${a._id}', 'cancelled')">Cancel</button>`;
            }

            return `
                <tr>
                    <td>${formatDate(a.appointment_date)}</td>
                    <td>${formatTime(a.appointment_time)}</td>
                    <td>${a.treatment}</td>
                    <td>${staff}</td>
                    <td>₹${a.cost}</td>
                    <td>${statusBadge}</td>
                    <td>${receiptButton}</td>
                </tr>
            `
        }).join('');
    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: red;">Error loading appointments: ${error.message}</td></tr>`;
    }
}

async function loadPatientTreatmentPlan() {
    const container = document.getElementById('patientTreatmentPlan');
    if (!container) return;

    try {
        const prescriptions = await authFetch(`${API_URL}/prescriptions/patient/${currentUser._id}`);
        const prescription = prescriptions.find(p => p.status === 'in-progress');

        if (!prescription) {
             container.innerHTML = `<p>No active treatment plan found. Please consult your doctor.</p>`;
             return;
        }
        
        const doctor = prescription.doctorId ? prescription.doctorId.full_name : 'N/A';
        const progress = prescription.progressCompleted;
        const total = prescription.duration;
        const percentage = total > 0 ? (progress / total) * 100 : 0;
        
        container.innerHTML = `
            <div style="background: linear-gradient(135deg, rgba(67, 233, 123, 0.1) 0%, rgba(56, 249, 215, 0.1) 100%); padding: 30px; border-radius: 15px; margin: 20px 0; border: 1px solid rgba(67, 233, 123, 0.2);">
                <h4>${prescription.duration}-Day ${prescription.treatment}</h4>
                <p><strong>Prescribed by:</strong> ${doctor}</p>
                <p><strong>Treatment Plan:</strong> ${prescription.plan}</p>
                <p><strong>Progress:</strong> ${progress}/${total} sessions completed (${percentage.toFixed(0)}%)</p>
                <div class="progress-bar" style="margin: 15px 0;">
                    <div class="progress-fill" style="width: ${percentage}%;"></div>
                </div>
                <p><strong>Doctor Notes:</strong> ${prescription.notes}</p>
            </div>
        `;

        const notesContainer = container.nextElementSibling; 
        if (notesContainer) {
            const notes = await authFetch(`${API_URL}/notes/patient/${currentUser._id}`);
            const latestNote = notes[0]; 
            if (latestNote) {
                 notesContainer.nextElementSibling.innerHTML = `
                    <p><strong>Note:</strong> ${latestNote.note}</p>
                    <small style="color: #6c757d;">- ${latestNote.authorId.full_name} on ${formatDate(latestNote.createdAt)}</small>
                 `;
            }
        }

    } catch (error) {
        container.innerHTML = `<p style="color: red;">Error loading treatment plan: ${error.message}</p>`;
    }
}

function loadPatientProfile() {
    document.getElementById('profileName').value = currentUser.full_name;
    document.getElementById('profileEmail').value = currentUser.email;
    document.getElementById('profileAge').value = currentUser.age || '';
    document.getElementById('profileGender').value = currentUser.gender || 'prefer-not-to-say';
    document.getElementById('profileDob').value = currentUser.dob ? currentUser.dob.split('T')[0] : '';
    document.getElementById('profilePhone').value = currentUser.phone || '';
    document.getElementById('profileAddress').value = currentUser.address || '';
    document.getElementById('profileEmergencyContact').value = currentUser.emergencyContact || '';
    document.getElementById('profileBloodGroup').value = currentUser.bloodGroup || '';
    document.getElementById('profileAllergies').value = currentUser.allergies || '';

    // Vitals from login object
    document.getElementById('patientBloodPressure').textContent = currentUser.bloodPressure || 'N/A';
    document.getElementById('patientHeartRate').textContent = (currentUser.heartRate || 'N/A') + ' bpm';
    document.getElementById('patientWeight').textContent = (currentUser.weight || 'N/A') + ' kg';
    document.getElementById('patientTemperature').textContent = (currentUser.temperature || 'N/A') + '°F';
}

async function updateProfile() {
    const profileData = {
        age: document.getElementById('profileAge').value || null,
        gender: document.getElementById('profileGender').value,
        dob: document.getElementById('profileDob').value || null,
        phone: document.getElementById('profilePhone').value,
        address: document.getElementById('profileAddress').value,
        emergencyContact: document.getElementById('profileEmergencyContact').value,
        bloodGroup: document.getElementById('profileBloodGroup').value,
        allergies: document.getElementById('profileAllergies').value,
    };

    try {
        const updatedUser = await authFetch(`${API_URL}/users/profile`, {
            method: 'PUT',
            body: JSON.stringify(profileData)
        });

        currentUser = { ...currentUser, ...updatedUser };
        sessionStorage.setItem('ayurUser', JSON.stringify(currentUser));
        
        showNotification('Profile Updated', 'Your profile information has been successfully updated');
    } catch (error) {
        showNotification('Error', error.message, 'error');
    }
}

async function updatePatientStats() {
    const grid = document.getElementById('patientStatsGrid');
    if(!grid) return;
    
    try {
        const prescriptions = await authFetch(`${API_URL}/prescriptions/patient/${currentUser._id}`);
        const prescription = prescriptions.find(p => p.status === 'in-progress');
        const appointments = await authFetch(`${API_URL}/appointments?patientId=${currentUser._id}`);
        
        let progress = "N/A";
        let doctor = "N/A";
        let therapist = "N/A";
        
        if (prescription) {
            progress = `${prescription.progressCompleted}/${prescription.duration}`;
            if (prescription.doctorId) doctor = prescription.doctorId.full_name;
            if (prescription.therapistId) therapist = prescription.therapistId.full_name;
        } else if (currentUser.assignedDoctor) {
             doctor = currentUser.assignedDoctor.full_name;
        }
        
        const nextAppt = appointments
            .filter(a => new Date(a.appointment_date) >= new Date(new Date().setHours(0,0,0,0)) && a.status === 'scheduled')
            .sort((a,b) => new Date(a.appointment_date) - new Date(b.appointment_date))[0];
        
        let nextApptDate = "None";
        if (nextAppt) {
            const today = getTodayDateStr();
            const tomorrow = getTomorrowDateStr();
            const apptDateStr = getLocalDateStr(nextAppt.appointment_date);
            if (apptDateStr === today) nextApptDate = "Today";
            else if (apptDateStr === tomorrow) nextApptDate = "Tomorrow";
            else nextApptDate = formatDate(nextAppt.appointment_date);
        }
        
        grid.innerHTML = `
            <div class="stat-card">
                <h3>${progress}</h3>
                <p>Treatment Progress</p>
            </div>
            <div class="stat-card">
                <h3>${nextApptDate}</h3>
                <p>Next Appointment</p>
            </div>
            <div class="stat-card">
                <h3>${doctor}</h3>
                <p>Assigned Doctor</p>
            </div>
            <div class="stat-card">
                <h3>${therapist}</h3>
                <p>Primary Therapist</p>
            </div>
        `;
    } catch (error) {
        console.error("Error updating patient stats:", error);
    }
}

async function populateDoctorDropdown() {
    const select = document.getElementById('preferredDoctor');
    if (!select) return; 
    
    try {
        const doctors = await authFetch(`${API_URL}/users?role=doctor`);
        select.innerHTML = '<option value="">-- Select a Doctor --</option>';
        doctors.forEach((doc, idx) => {
            select.innerHTML += `<option value="${doc._id}" ${idx === 0 ? 'selected' : ''}>${doc.full_name}</option>`;
        });
    } catch (error) {
        console.error("Failed to load doctors for dropdown:", error);
    }
}

async function populateTherapistDropdown() {
    const select = document.getElementById('preferredTherapist');
    if (!select) return;
    try {
        const therapists = await authFetch(`${API_URL}/users?role=therapist`);
        select.innerHTML = '<option value="">No Preference</option>';
        therapists.forEach((ther, idx) => {
            select.innerHTML += `<option value="${ther._id}" ${idx === 0 ? 'selected' : ''}>${ther.full_name}</option>`;
        });
    } catch (error) {
        console.error("Failed to load therapists for dropdown:", error);
    }
}

function toggleAppointmentFields() {
    const treatmentType = document.getElementById('treatmentType').value;
    const therapistGroup = document.getElementById('therapist-select-group');
    const doctorGroup = document.getElementById('doctor-select-group');

    if (!therapistGroup || !doctorGroup) return;

    if (treatmentType === 'Consultation') {
        therapistGroup.style.display = 'none'; 
        doctorGroup.style.display = 'block';  
    } else {
        therapistGroup.style.display = 'block';  
        doctorGroup.style.display = 'none';   
    }
}

const DEFAULT_WEB_SLOTS = [
    '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM',
    '11:00 AM', '11:30 AM', '12:00 PM', '02:00 PM',
    '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM',
    '04:30 PM', '05:00 PM'
];

function renderDefaultWebSlots() {
    const container = document.getElementById('webTimeSlotsContainer');
    if (!container) return;
    currentWebSlots = DEFAULT_WEB_SLOTS.map(t => ({ time: t, status: 'available' }));
    container.innerHTML = DEFAULT_WEB_SLOTS.map(t => `
        <button type="button" 
                class="time-slot-pill"
                data-time="${t}"
                onclick="selectParticularTimeSlot('${t}')" 
                style="background: #e8f5e9; color: #2e7d32; border: 1px solid #a5d6a7; padding: 8px 12px; border-radius: 6px; font-weight: 700; font-size: 12px; cursor: pointer; display: flex; flex-direction: column; align-items: center; min-width: 90px;">
            <span>${t}</span>
            <span style="font-size: 9px; opacity: 0.85; margin-top: 2px;">AVAILABLE</span>
        </button>
    `).join('');
}

let currentWebSlots = [];

function selectParticularTimeSlot(timeStr) {
    const apptTimeInput = document.getElementById('appointmentTime');
    const infoContainer = document.getElementById('particularTimeInfo');
    if (apptTimeInput) apptTimeInput.value = timeStr;

    const slotObj = currentWebSlots.find(s => s.time === timeStr);
    const statusLower = slotObj ? (slotObj.status || '').toLowerCase() : 'available';

    // Highlight selected pill button
    const container = document.getElementById('webTimeSlotsContainer');
    if (container) {
        const buttons = container.querySelectorAll('.time-slot-pill');
        buttons.forEach(btn => {
            if (btn.getAttribute('data-time') === timeStr) {
                btn.style.border = '2px solid #28a745';
                btn.style.boxShadow = '0 0 6px rgba(40, 167, 69, 0.4)';
            } else {
                btn.style.border = '1px solid #ccc';
                btn.style.boxShadow = 'none';
            }
        });
    }

    if (infoContainer) {
        infoContainer.style.display = 'block';
        if (statusLower === 'available') {
            infoContainer.style.background = '#e8f5e9';
            infoContainer.style.color = '#2e7d32';
            infoContainer.style.border = '1px solid #a5d6a7';
            infoContainer.innerHTML = `✅ <strong>${timeStr}</strong> is <strong>AVAILABLE</strong> for booking!`;
        } else if (statusLower === 'booked') {
            infoContainer.style.background = '#ffebee';
            infoContainer.style.color = '#c62828';
            infoContainer.style.border = '1px solid #ef9a9a';
            infoContainer.innerHTML = `❌ <strong>${timeStr}</strong> is already <strong>BOOKED</strong>. Please select another slot.`;
        } else if (statusLower === 'blocked') {
            infoContainer.style.background = '#fff3e0';
            infoContainer.style.color = '#e65100';
            infoContainer.style.border = '1px solid #ffe0b2';
            infoContainer.innerHTML = `⚠️ <strong>${timeStr}</strong> is <strong>BLOCKED</strong> in provider schedule.`;
        } else {
            infoContainer.style.background = '#f5f5f5';
            infoContainer.style.color = '#616161';
            infoContainer.style.border = '1px solid #e0e0e0';
            infoContainer.innerHTML = `ℹ️ <strong>${timeStr}</strong> status: <strong>${statusLower.toUpperCase()}</strong>`;
        }
    }
}

async function fetchWebAvailability() {
    const container = document.getElementById('webTimeSlotsContainer');
    const infoContainer = document.getElementById('particularTimeInfo');
    const apptTimeInput = document.getElementById('appointmentTime');

    if (!container) return;
    if (infoContainer) infoContainer.style.display = 'none';
    if (apptTimeInput) apptTimeInput.value = '';

    const treatmentType = document.getElementById('treatmentType').value || 'Consultation';
    const providerType = treatmentType === 'Consultation' ? 'doctor' : 'therapist';
    const providerId = treatmentType === 'Consultation'
        ? document.getElementById('preferredDoctor').value
        : document.getElementById('preferredTherapist').value;
    const date = document.getElementById('appointmentDate').value || getTodayDateStr();

    if (!providerId || !date) {
        renderDefaultWebSlots();
        return;
    }

    try {
        const avail = await authFetch(`${API_URL}/appointments/availability?providerId=${providerId}&providerType=${providerType}&date=${date}`);
        if (avail && avail.slots) {
            currentWebSlots = avail.slots;
            container.innerHTML = avail.slots.map(s => {
                const statusLower = (s.status || '').toLowerCase();
                let bg = '#e8f5e9', color = '#2e7d32', border = '#a5d6a7', label = 'AVAILABLE';
                let cursor = 'pointer';

                if (statusLower === 'booked') {
                    bg = '#f0f0f0'; color = '#757575'; border = '#bdbdbd'; label = 'BOOKED';
                } else if (statusLower === 'blocked') {
                    bg = '#ffebee'; color = '#c62828'; border = '#ef9a9a'; label = 'BLOCKED';
                } else if (statusLower !== 'available') {
                    bg = '#fafafa'; color = '#9e9e9e'; border = '#e0e0e0'; label = statusLower.toUpperCase();
                }

                return `
                    <button type="button" 
                            class="time-slot-pill"
                            data-time="${s.time}"
                            onclick="selectParticularTimeSlot('${s.time}')" 
                            style="background: ${bg}; color: ${color}; border: 1px solid ${border}; padding: 8px 12px; border-radius: 6px; font-weight: 700; font-size: 12px; cursor: ${cursor}; display: flex; flex-direction: column; align-items: center; min-width: 90px;">
                        <span>${s.time}</span>
                        <span style="font-size: 9px; opacity: 0.85; margin-top: 2px;">${label}</span>
                    </button>
                `;
            }).join('');
        } else {
            renderDefaultWebSlots();
        }
    } catch (err) {
        console.error("Error fetching web availability:", err);
        renderDefaultWebSlots();
    }
}

async function showBookAppointmentModal() {
    document.getElementById('appointmentDate').value = getTodayDateStr();
    document.getElementById('treatmentType').value = 'Consultation';
    toggleAppointmentFields(); 
    showModal('bookAppointmentModal');

    renderDefaultWebSlots();
    await populateDoctorDropdown();
    await populateTherapistDropdown();
    fetchWebAvailability();

    const apptDateEl = document.getElementById('appointmentDate');
    const prefDocEl = document.getElementById('preferredDoctor');
    const prefTherEl = document.getElementById('preferredTherapist');
    const treatTypeEl = document.getElementById('treatmentType');

    if (apptDateEl) apptDateEl.onchange = fetchWebAvailability;
    if (prefDocEl) prefDocEl.onchange = fetchWebAvailability;
    if (prefTherEl) prefTherEl.onchange = fetchWebAvailability;
    if (treatTypeEl) treatTypeEl.onchange = () => { toggleAppointmentFields(); fetchWebAvailability(); };
}

async function bookAppointment(event) {
    event.preventDefault();
    
    const treatmentType = document.getElementById('treatmentType').value;
    const therapistId = document.getElementById('preferredTherapist').value;
    const doctorId = document.getElementById('preferredDoctor').value; 

    const appointmentData = {
        patientId: currentUser._id,
        therapistId: (treatmentType !== 'Consultation' && therapistId) ? therapistId : null,
        doctorId: (treatmentType === 'Consultation' && doctorId) ? doctorId : null,
        treatment: treatmentType,
        appointment_date: document.getElementById('appointmentDate').value,
        appointment_time: document.getElementById('appointmentTime').value,
        specialRequirements: document.getElementById('specialRequirements').value
    };

    if (treatmentType === 'Consultation' && !appointmentData.doctorId) {
        showNotification('Error', 'Please select a doctor for your consultation.', 'error');
        return; 
    }

    try {
        await authFetch(`${API_URL}/appointments`, {
            method: 'POST',
            body: JSON.stringify(appointmentData)
        });

        loadPatientAppointments();
        updatePatientStats();
        loadPatientPayments();
        
        closeModal('bookAppointmentModal');
        showNotification('Appointment Booked', `Your ${treatmentType} appointment is scheduled.`);
        event.target.reset(); 
    } catch (error) {
        showNotification('Booking Conflict', error.message, 'error');
        fetchWebAvailability();
    }
}

async function saveVitals(event) {
    event.preventDefault();
    
    const vitals = {
        heartRate: document.getElementById('vitalHeartRate').value,
        bloodPressure: document.getElementById('vitalBloodPressure').value,
        weight: document.getElementById('vitalWeight').value,
        temperature: document.getElementById('vitalTemperature').value
    };

    try {
        const updatedUser = await authFetch(`${API_URL}/users/profile`, {
            method: 'PUT',
            body: JSON.stringify(vitals) 
        });

        currentUser = { ...currentUser, ...updatedUser };
        sessionStorage.setItem('ayurUser', JSON.stringify(currentUser));
        loadPatientProfile();
        
        closeModal('editVitalsModal');
        showNotification('Vitals Updated', 'Vital signs have been successfully updated');
        event.target.reset();

    } catch (error) {
        showNotification('Error', error.message, 'error');
    }
}

async function uploadReport(event) {
    event.preventDefault();
    
    const name = document.getElementById('reportName').value;
    const type = document.getElementById('reportType').value;
    const fileInput = document.getElementById('reportFile');
    const file = fileInput.files[0];

    // 1. Validation
    if (!file) {
        showNotification('Error', 'Please select a file to upload.', 'error');
        return;
    }

    // Check if it is a PDF or Image
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
        showNotification('Error', 'Only PDF, JPG, and PNG files are allowed.', 'error');
        return;
    }

    // Limit file size (e.g., 5MB)
    if (file.size > 5 * 1024 * 1024) {
        showNotification('Error', 'File is too large. Max limit is 5MB.', 'error');
        return;
    }

    // 2. Helper to convert file to Base64 string
    const toBase64 = file => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file); // This works for PDF and Images
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });

    try {
        // 3. Convert and Upload
        showNotification('Uploading...', 'Please wait while we upload your document.');
        const fileData = await toBase64(file);

        await authFetch(`${API_URL}/documents`, {
            method: 'POST',
            body: JSON.stringify({ name, type, fileData })
        });

        showNotification('Success', 'Document uploaded successfully!');
        closeModal('uploadReportModal');
        event.target.reset();
        
        // 4. Refresh the list immediately
        loadPatientDocuments(); 

    } catch (error) {
        console.error(error);
        showNotification('Error', 'Upload failed: ' + error.message, 'error');
    }
}

async function loadPatientPayments() {
    const paymentList = document.getElementById('payment-list');
    if (!paymentList) return;

    try {
        const appointments = await authFetch(`${API_URL}/appointments?patientId=${currentUser._id}`);
        
        // ⭐️ MODIFIED FILTER: Show all non-cancelled, unpaid bills
        const unpaidBills = appointments.filter(a => a.status !== 'cancelled' && !a.isPaid);

        if (unpaidBills.length === 0) {
            paymentList.innerHTML = '<p style="margin-top: 20px;">No pending payments found. Thank you!</p>';
            return;
        }

        paymentList.innerHTML = unpaidBills.map(bill => {
            // ⭐️ ADDED LOGIC: Customize text based on status
            let buttonStyle = "";
            let statusText = `Scheduled for: ${formatDate(bill.appointment_date)}`;

            if (bill.status === 'completed') {
                 statusText = `Completed on: ${formatDate(bill.updatedAt)}`;
                 buttonStyle = "background: #ffc107; color: #333;"; // Yellow for completed-but-pending
            } else if (bill.status !== 'scheduled') {
                 statusText = `Status: ${bill.status} (Due: ${formatDate(bill.appointment_date)})`;
            }
            
            return `
            <div style="display: flex; justify-content: space-between; align-items: center; background: #f9f9f9; padding: 20px; border-radius: 10px; margin-top: 15px; border: 1px solid #eee;">
                <div>
                    <h4 style="margin: 0;">${bill.treatment}</h4>
                    <p style="margin: 5px 0 0 0; color: #6c757d;">${statusText}</p>
                </div>
                <div>
                    <p style="font-size: 1.2rem; font-weight: 600; margin: 0;">₹${bill.cost}</p>
                    <button class="btn btn-small" style="margin-top: 5px; ${buttonStyle}" onclick="showPaymentQR('${bill._id}', ${bill.cost})">Pay Now</button>
                </div>
            </div>
            `
        }).join('');

    } catch (error) {
        paymentList.innerHTML = '<p style="color: red;">Error loading payment info.</p>';
    }
}

function showPaymentQR(appointmentId, cost) {
    const paymentAmount = document.getElementById('paymentAmount');
    if (paymentAmount) {
        paymentAmount.textContent = `Amount: ₹${cost}`;
    }
    const confirmBtn = document.getElementById('confirmPaymentBtn');
    if (confirmBtn) {
        confirmBtn.onclick = () => markAsPaid(appointmentId);
    }
    showModal('paymentModal');
}

async function markAsPaid(appointmentId) {
    try {
        await authFetch(`${API_URL}/appointments/${appointmentId}/pay`, {
            method: 'PUT'
        });
        
        closeModal('paymentModal');
        showNotification('Payment Confirmed', 'Thank you! Your payment has been recorded.');
        
        loadPatientPayments();
        loadPatientAppointments(); // Also refresh the main appointments list
    } catch (error) {
        showNotification('Error', 'Could not confirm payment. Please contact support.', 'error');
    }
}

async function generateMyReport() {
    showNotification('Generating...', 'Fetching your report, please wait.');

    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const reportData = await authFetch(`${API_URL}/reports/my-report`);
        const { user, appointments, prescriptions, notes } = reportData;

        // --- Build the PDF ---
        let y = 20; 
        doc.setFontSize(22); doc.text('AyurSutra Patient Report', 20, y); y += 15;
        doc.setFontSize(16); doc.text('My Details', 20, y); y += 7;
        doc.setFontSize(12);
        doc.text(`Name: ${user.full_name}`, 20, y); doc.text(`Email: ${user.email}`, 100, y); y += 7;
        doc.text(`Phone: ${user.phone || 'N/A'}`, 20, y); doc.text(`Assigned Doctor: ${user.assignedDoctor ? user.assignedDoctor.full_name : 'N/A'}`, 100, y); y += 7;
        doc.text(`Condition: ${user.condition || 'N/A'}`, 20, y); y += 15;
        
        doc.setFontSize(16); doc.text('My Prescriptions', 20, y); y += 7; doc.setFontSize(10);
        if (prescriptions.length === 0) { doc.text('No prescriptions found.', 20, y); y += 10; }
        else {
            prescriptions.forEach(p => {
                if (y > 270) { doc.addPage(); y = 20; }
                doc.text(`- Treatment: ${p.treatment} (${p.status})`, 25, y); y += 5;
                doc.text(`  Prescribed by: Dr. ${p.doctorId.full_name}`, 25, y); y += 5;
                doc.text(`  Progress: ${p.progressCompleted} / ${p.duration} sessions`, 25, y); y += 7;
            });
        }
        y += 10;
        
        doc.setFontSize(16); doc.text('My Appointment History', 20, y); y += 7; doc.setFontSize(10);
        if (appointments.length === 0) { doc.text('No appointments found.', 20, y); y += 10; }
        else {
            appointments.forEach(a => {
                if (y > 270) { doc.addPage(); y = 20; }
                const staff = a.therapistId ? a.therapistId.full_name : (a.doctorId ? a.doctorId.full_name : 'Unknown');
                doc.text(`- ${formatDate(a.appointment_date)}: ${a.treatment} with ${staff} (${a.status})`, 25, y); y += 7;
            });
        }
        y += 10;
        
        doc.setFontSize(16); doc.text('My Session Notes', 20, y); y += 7; doc.setFontSize(10);
        if (notes.length === 0) { doc.text('No notes found.', 20, y); y += 10; }
        else {
            notes.forEach(n => {
                if (y > 270) { doc.addPage(); y = 20; }
                doc.text(`- ${formatDate(n.createdAt)} (${n.authorId.full_name}):`, 25, y); y += 5;
                const noteLines = doc.splitTextToSize(n.note, 150);
                doc.text(noteLines, 30, y);
                y += (noteLines.length * 5) + 3;
            });
        }

        // --- Show the Preview ---
        const pdfDataUri = doc.output('datauristring');
        document.getElementById('pdfPreviewFrame').src = pdfDataUri;
        document.getElementById('pdfPreviewTitle').textContent = `My AyurSutra Report`;
        
        const saveName = `My_AyurSutra_Report.pdf`;
        document.getElementById('pdfSaveBtn').onclick = () => doc.save(saveName);
        document.getElementById('pdfPrintBtn').onclick = () => printReceipt();
        
        showModal('pdfPreviewModal');

    } catch (error) {
        console.error('Error generating report:', error);
        showNotification('Error', error.message, 'error');
    }
}

async function showReceipt(appointmentId) {
    try {
        const appt = await authFetch(`${API_URL}/appointments/${appointmentId}`);
        if (!appt) {
            showNotification('Error', 'Could not find appointment data.', 'error');
            return;
        }

        document.getElementById('receiptTitle').textContent = `${appt.treatment} Receipt`;
        document.getElementById('receiptPatientName').textContent = appt.patientId.full_name;
        document.getElementById('receiptTreatment').textContent = appt.treatment;
        document.getElementById('receiptDate').textContent = formatDate(appt.appointment_date);
        
        const staffName = appt.doctorId ? appt.doctorId.full_name : (appt.therapistId ? appt.therapistId.full_name : 'N/A');
        document.getElementById('receiptStaffName').textContent = staffName;

        document.getElementById('receiptAmount').textContent = `₹${appt.cost}`;
        document.getElementById('receiptStatus').textContent = appt.isPaid ? 'PAID' : 'PENDING';
        document.getElementById('receiptId').textContent = appt._id;

        showModal('receiptModal');

    } catch (error) {
        showNotification('Error', error.message, 'error');
    }
}

function printReceipt() {
    // This targets the specific modal content for printing
    const printContent = document.getElementById('printableReceipt');
    
    if (printContent) {
        // We use window.print() which is controlled by our @media print CSS
        window.print();
    } else if (document.getElementById('pdfPreviewFrame')) {
        // This handles printing for the PDF report preview
        document.getElementById('pdfPreviewFrame').contentWindow.print();
    }
}
async function loadFeedbackForm() {
    try {
        // 1. Get Doctor info (already on currentUser)
        if (currentUser.assignedDoctor && currentUser.assignedDoctor.full_name) {
            document.getElementById('doctorFeedbackName').textContent = `Doctor Feedback (Dr. ${currentUser.assignedDoctor.full_name})`;
        } else {
            // Hide if no doctor is assigned
            document.getElementById('doctorFeedbackSection').style.display = 'none';
        }

        // 2. Get Therapist info (from active prescription)
        const prescriptions = await authFetch(`${API_URL}/prescriptions/patient/${currentUser._id}`);
        const activePrescription = prescriptions.find(p => p.status === 'in-progress');

        if (activePrescription && activePrescription.therapistId) {
            document.getElementById('therapistFeedbackName').textContent = `Therapist Feedback (${activePrescription.therapistId.full_name})`;
        } else {
            // Hide if no therapist is assigned
            document.getElementById('therapistFeedbackSection').style.display = 'none';
        }
    } catch (error) {
        console.error('Error loading feedback form:', error);
        showNotification('Error', 'Could not load feedback form details.', 'error');
    }
}

// ⭐️ NEW FUNCTION
// This submits the feedback to the backend
async function submitFeedback(event) {
    event.preventDefault();

    const data = {
        doctorRating: document.getElementById('doctorRating').value || null,
        doctorFeedback: document.getElementById('doctorFeedbackText').value,
        therapistRating: document.getElementById('therapistRating').value || null,
        therapistFeedback: document.getElementById('therapistFeedbackText').value,
        overallRating: document.getElementById('overallRating').value,
        overallFeedback: document.getElementById('overallFeedbackText').value
    };

    if (!data.overallRating) {
        showNotification('Error', 'Please provide an overall rating.', 'error');
        return;
    }

    try {
        await authFetch(`${API_URL}/feedback`, {
            method: 'POST',
            body: JSON.stringify(data)
        });

        showNotification('Feedback Submitted', 'Thank you for your valuable feedback!');
        document.getElementById('feedbackForm').reset();
        // Go back to the main appointments tab
        showTab(event, 'patientAppointments');
    } catch (error) {
        showNotification('Error', error.message, 'error');
    }
}

// ⭐️ NEW FUNCTION
// A helper to render stars from a rating number
function renderStars(rating) {
    if (!rating) return '<span style="color: #999;">No Rating</span>';
    let stars = '';
    for (let i = 0; i < 5; i++) {
        stars += i < rating ? '⭐' : '☆';
    }
    return stars;
}


// --- Utility Functions ---

function getStatusBadge(status) {
    const badgeMap = {
        'completed': 'success',
        'in-progress': 'warning',
        'scheduled': 'info',
        'cancelled': 'danger',
        'confirmed': 'success'
    };
    return badgeMap[status] || 'info';
}

function getLocalDateStr(dateInput) {
    if (!dateInput) return '';
    if (typeof dateInput === 'string') {
        const cleanStr = dateInput.trim();
        if (/^\d{4}-\d{2}-\d{2}/.test(cleanStr)) {
            return cleanStr.substring(0, 10);
        }
    }
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return '';
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

function getTodayDateStr() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

function getTomorrowDateStr() {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

function formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    try {
        return new Date(dateStr).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    } catch (_) { return dateStr; }
}

function formatTime(timeStr) {
     if (!timeStr) return 'N/A';
    try {
        const [h,m] = (timeStr||'').split(':');
        const d = new Date(); d.setHours(parseInt(h||'0'), parseInt(m||'0'), 0, 0);
        return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch(_) { return timeStr; }
}

// Close modals when clicking outside
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('active');
    }
});

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal.active').forEach(modal => {
            modal.classList.remove('active');
        });
    }
});
// Add this new function to script.js
async function updateAppointmentStatus(appointmentId, newStatus) {
    // Ask for confirmation before cancelling
    if (newStatus === 'cancelled') {
        if (!confirm('Are you sure you want to cancel this appointment?')) {
            return;
        }
    }

    try {
        // Call the backend API to update the status
        await authFetch(`${API_URL}/appointments/${appointmentId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status: newStatus })
        });

        // Show a success message
        showNotification(
            'Status Updated', 
            `Appointment has been marked as ${newStatus}.`
        );

        // Refresh the doctor's schedule table to show the change
        loadDoctorSchedule(); //

    } catch (error) {
        showNotification('Error', error.message, 'error');
    }
}
// Add this new function to script.js
function showCreatePrescriptionModal() {
    // This simply calls your existing showModal function 
    // to open the modal defined in index.html
    showModal('createPrescriptionModal');
}
// ⭐️ NEW FUNCTION: Generates the Doctor's Detailed Report
async function generatePDFReport() {
    showNotification('Generating...', 'Compiling your detailed performance report.');

    try {
        // 1. Fetch all necessary data in parallel for speed
        const [appointments, prescriptions, feedback] = await Promise.all([
            authFetch(`${API_URL}/appointments?doctorId=${currentUser._id}`),
            authFetch(`${API_URL}/prescriptions/doctor/${currentUser._id}`),
            authFetch(`${API_URL}/feedback/doctor`)
        ]);

        // 2. Initialize jsPDF
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        let y = 20; // Vertical position tracker

        // --- Header ---
        doc.setFontSize(22);
        doc.setTextColor(40, 167, 69); // Green color for brand
        doc.text('AyurSutra - Doctor Performance Report', 20, y);
        y += 10;

        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0); // Black
        doc.text(`Doctor: ${currentUser.full_name}`, 20, y);
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, 140, y);
        y += 15;

        // --- Section 1: Summary Statistics ---
        doc.setFontSize(16);
        doc.text('Summary Statistics', 20, y);
        doc.line(20, y + 2, 190, y + 2); // Horizontal line
        y += 10;
        
        doc.setFontSize(12);
        const activePatients = new Set(prescriptions.map(p => p.patientId?._id)).size;
        
        doc.text(`• Total Active Patients: ${activePatients}`, 25, y); y += 7;
        doc.text(`• Total Appointments Scheduled: ${appointments.length}`, 25, y); y += 7;
        doc.text(`• Prescriptions Issued: ${prescriptions.length}`, 25, y); y += 7;
        
        // Calculate Average Rating
        let avgRating = 0;
        if (feedback.length > 0) {
            const total = feedback.reduce((acc, curr) => acc + (curr.doctorRating || 0), 0);
            avgRating = (total / feedback.length).toFixed(1);
        }
        doc.text(`• Average Patient Rating: ${avgRating} / 5.0 (${feedback.length} reviews)`, 25, y); 
        y += 15;

        // --- Section 2: Recent Appointments ---
        if (y > 250) { doc.addPage(); y = 20; }
        doc.setFontSize(16);
        doc.text('Recent Appointments', 20, y);
        doc.line(20, y + 2, 190, y + 2);
        y += 10;
        doc.setFontSize(10);
        
        if (appointments.length === 0) {
            doc.text('No recent appointments found.', 25, y); y+= 10;
        } else {
            // Sort by date descending and take top 10
            const recent = appointments.sort((a,b) => new Date(b.appointment_date) - new Date(a.appointment_date)).slice(0, 10);
            
            recent.forEach(app => {
                if (y > 270) { doc.addPage(); y = 20; }
                const patientName = app.patientId ? app.patientId.full_name : 'Unknown';
                const date = formatDate(app.appointment_date);
                // e.g. "Nov 27, 2025 - 10:00 AM: John Doe (Consultation) - CONFIRMED"
                doc.text(`${date} - ${formatTime(app.appointment_time)}: ${patientName} (${app.treatment}) - [${app.status.toUpperCase()}]`, 25, y);
                y += 7;
            });
        }
        y += 10;

        // --- Section 3: Patient Feedback ---
        if (y > 250) { doc.addPage(); y = 20; }
        doc.setFontSize(16);
        doc.text('Recent Patient Feedback', 20, y);
        doc.line(20, y + 2, 190, y + 2);
        y += 10;
        doc.setFontSize(10);

        if (feedback.length === 0) {
            doc.text('No feedback received yet.', 25, y);
        } else {
            feedback.slice(0, 5).forEach(fb => {
                if (y > 260) { doc.addPage(); y = 20; }
                const patientName = fb.patientId ? fb.patientId.full_name : 'Anonymous';
                const ratingStars = "★".repeat(fb.doctorRating) + "☆".repeat(5 - fb.doctorRating);
                
                doc.setFont(undefined, 'bold');
                doc.text(`${patientName} (${ratingStars}):`, 25, y);
                doc.setFont(undefined, 'normal');
                y += 5;
                
                // Wrap long text
                const comment = fb.doctorFeedback ? `"${fb.doctorFeedback}"` : "No comment provided.";
                const lines = doc.splitTextToSize(comment, 160);
                doc.text(lines, 30, y);
                y += (lines.length * 5) + 5;
            });
        }

        // --- Show Preview ---
        const pdfDataUri = doc.output('datauristring');
        document.getElementById('pdfPreviewFrame').src = pdfDataUri;
        document.getElementById('pdfPreviewTitle').textContent = `Report: Dr. ${currentUser.full_name}`;
        
        const saveName = `Doctor_Report_${new Date().toISOString().split('T')[0]}.pdf`;
        document.getElementById('pdfSaveBtn').onclick = () => doc.save(saveName);
        
        // Fix print button for PDF preview
        document.getElementById('pdfPrintBtn').onclick = () => {
            const iframe = document.getElementById('pdfPreviewFrame');
            if (iframe.contentWindow) iframe.contentWindow.print();
        };
        
        showModal('pdfPreviewModal');

    } catch (error) {
        console.error('Report Generation Error:', error);
        showNotification('Error', 'Failed to generate report: ' + error.message, 'error');
    }
}

// ⭐️ NEW FUNCTION: Filter Doctor's Patient Table
function filterDoctorPatients() {
    const input = document.getElementById('patientSearch');
    const filter = input.value.toLowerCase();
    const tbody = document.getElementById('patientsTableBody');
    const rows = tbody.getElementsByTagName('tr');

    for (let i = 0; i < rows.length; i++) {
        // Get the first cell (Patient Name)
        const nameColumn = rows[i].getElementsByTagName('td')[0];
        
        if (nameColumn) {
            const nameText = nameColumn.textContent || nameColumn.innerText;
            
            // If the name contains the search text, show it; otherwise, hide it
            if (nameText.toLowerCase().indexOf(filter) > -1) {
                rows[i].style.display = "";
            } else {
                rows[i].style.display = "none";
            }
        }
    }
}
// Opens the upload modal
function showUploadModal() {
    // This ID must match the ID in your index.html
    showModal('uploadReportModal');
}