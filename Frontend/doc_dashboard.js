// Check authentication on page load
document.addEventListener('DOMContentLoaded', function() {
    // If not logged in, send to login page
    if (!sessionStorage.getItem('isLoggedIn')) {
        window.location.href = 'doctor_login.html'; 
        return;
    }

    initializeDashboard();
    loadQueue();
    // Auto-refresh the queue every 30 seconds
    setInterval(loadQueue, 30000);
});

// Dashboard initialization
function initializeDashboard() {
    const mobileToggle = document.querySelector('.mobile-menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    
    if (mobileToggle && sidebar) {
        mobileToggle.addEventListener('click', () => {
            sidebar.classList.toggle('mobile-open');
        });
    }
    
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 992 && 
            sidebar && !sidebar.contains(e.target) && 
            mobileToggle && !mobileToggle.contains(e.target)) {
            sidebar.classList.remove('mobile-open');
        }
    });
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && e.target.classList.contains('treat-btn')) {
            e.target.click();
        }
    });
}

// Load queue from MySQL database
async function loadQueue() {
    const refreshBtn = document.querySelector('.btn-refresh');
    if (refreshBtn) {
        refreshBtn.classList.add('loading');
        refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
    }
    
    try {
        // RELATIVE PATH: Works on localhost and Render
        const response = await fetch('/api/queue');
        if (!response.ok) throw new Error('Network response was not ok');
        
        const patients = await response.json();
        
        updateStats(patients);
        renderPatients(patients);
        
    } catch (error) {
        console.error('Error loading queue:', error);
        showErrorToast('Failed to load patient queue');
    } finally {
        if (refreshBtn) {
            setTimeout(() => {
                refreshBtn.classList.remove('loading');
                refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh';
            }, 800);
        }
    }
}

// 2. Mark as Treated - FIXED ROUTE AND URL
async function markAsTreated(patientId) {
    const btn = event.target.closest('.treat-btn');
    if (!btn) return;

    createRipple(btn);
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Treating...';
    btn.disabled = true;
    
    try {
        // FIXED: URL matches server.js app.put('/api/status/:id')
        const response = await fetch(`/api/status/${patientId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'Treated' }) 
        });
        
        if (!response.ok) throw new Error('Failed to treat patient');
        
        showSuccessToast('Patient marked as treated! 🎉');
        loadQueue(); // Refresh list immediately
        
    } catch (error) {
        console.error('Error:', error);
        showErrorToast('Failed to update patient status');
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

// Update statistics cards
function updateStats(patients) {
    // We only count patients who are NOT yet 'Treated'
    const activePatients = patients.filter(p => p.status !== 'Treated');

    const criticalCount = activePatients.filter(p => p.priority === 1).length;
    const urgentCount = activePatients.filter(p => p.priority === 2).length;
    const routineCount = activePatients.filter(p => p.priority === 3).length;
    
    animateCounter('criticalCount', criticalCount);
    animateCounter('urgentCount', urgentCount);
    animateCounter('routineCount', routineCount);
    animateCounter('totalCount', activePatients.length);
}

// Animate counters
// Keep track of active timers so we can stop them
let counterIntervals = {};

function animateCounter(elementId, target) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    // 1. Clear any existing timer for this specific element
    if (counterIntervals[elementId]) {
        clearInterval(counterIntervals[elementId]);
    }
    
    const start = parseInt(element.textContent) || 0;
    
    // If the number is already correct, don't do anything
    if (start === target) return;

    // 2. Determine if we are counting up or down
    const increment = target > start ? 1 : -1;
    let current = start;
    
    // 3. Start the new timer
    counterIntervals[elementId] = setInterval(() => {
        current += increment;
        element.textContent = current;
        
        // 4. Stop exactly when we hit the target
        if (current === target) {
            clearInterval(counterIntervals[elementId]);
            delete counterIntervals[elementId];
        }
    }, 20); // Speed of animation (ms)
}

// Render patient cards - UPDATED to be instant
function renderPatients(patients) {
    const container = document.getElementById('queueContainer');
    const noPatients = document.getElementById('noPatients');
    
    if (!container || !noPatients) return;
    
    // Only show patients that are "Waiting" or "In Progress"
    const activePatients = patients.filter(p => p.status !== 'Treated');
    
    if (activePatients.length === 0) {
        container.style.display = 'none';
        noPatients.style.display = 'block';
        return;
    }
    
    container.style.display = 'block';
    noPatients.style.display = 'none';
    container.innerHTML = '';
    
    activePatients.forEach((patient) => {
        const patientCard = createPatientCard(patient);
        container.appendChild(patientCard);
    });
}

// Create individual patient card - UPDATED to remove fade-in class
function createPatientCard(patient) {
    const card = document.createElement('div');
    // REMOVED: 'fade-in' class
    card.className = `patient-card priority-${patient.priority}`;
    
    // REMOVED: Initial opacity: 0 and transform: translateY
    card.style.opacity = '1';
    card.style.transform = 'none';
    card.style.transition = 'none'; // Disables the slide effect
    
    card.innerHTML = `
        <div class="patient-header">
            <h2 class="patient-name">${patient.name || 'Unknown'}</h2>
            <div class="patient-priority priority-${patient.priority === 1 ? 'critical' : patient.priority === 2 ? 'urgent' : 'routine'}">
                Priority ${patient.priority || '?'}
            </div>
        </div>
        
        <div class="patient-meta">
            <div class="meta-item">
                <i class="fas fa-stethoscope"></i>
                <div>
                    <div style="font-size: 12px; color: #64748b; font-weight: 500;">Symptoms</div>
                    <div style="font-weight: 600; color: #1e293b;">${patient.symptoms || 'N/A'}</div>
                </div>
            </div>
            <div class="meta-item">
                <i class="fas fa-robot"></i>
                <div>
                    <div style="font-size: 12px; color: #64748b; font-weight: 500;">AI Analysis</div>
                    <div style="font-weight: 600; color: #0d6efd; font-size: 14px;">${patient.ai_reason || 'No AI analysis'}</div>
                </div>
            </div>
            <div class="meta-item">
                <i class="fas fa-thermometer-half"></i>
                <div>
                    <div style="font-size: 12px; color: #64748b;">Pain Level</div>
                    <div class="meta-value pain">${patient.pain_level || 0}/10</div>
                </div>
            </div>
            <div class="meta-item">
                <i class="fas fa-clock"></i>
                <div>
                    <div style="font-size: 12px; color: #64748b;">Wait Time</div>
                    <div style="font-weight: 700; color: #1e293b;">${patient.wait_time || 0}min</div>
                </div>
            </div>
        </div>
        
        <div style="text-align: right;">
            <button class="treat-btn" onclick="markAsTreated(${patient.id})">
                <i class="fas fa-check-circle"></i>
                Mark as Treated
            </button>
        </div>
    `;
    
    return card;
}

async function markAsTreated(patientId) {
    const btn = event.target.closest('.treat-btn');
    createRipple(btn);
    
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Treating...';
    btn.disabled = true;
    
    try {
        // FIXED: Using backticks `` and matching your server.js route
        const response = await fetch(`http://localhost:3000/api/queue`, {
            method: 'PUT', // Your server.js expects PUT
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'Treated' }) // Sending the new status
        });
        
        if (!response.ok) throw new Error('Failed to treat patient');
        
        showSuccessToast('Patient marked as treated! 🎉');
        loadQueue(); // Refresh the list
        
    } catch (error) {
        console.error('Error:', error);
        showErrorToast('Failed to update patient status');
    } finally {
        setTimeout(() => {
            if (btn) {
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
        }, 1500);
    }
}

// Ripple effect for buttons
function createRipple(element) {
    const circle = document.createElement('span');
    const diameter = Math.max(element.clientWidth, element.clientHeight);
    const radius = diameter / 2;
    
    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${event.clientX - element.getBoundingClientRect().left - radius}px`;
    circle.style.top = `${event.clientY - element.getBoundingClientRect().top - radius}px`;
    circle.classList.add('ripple');
    
    const ripple = element.getElementsByClassName('ripple')[0];
    if (ripple) ripple.remove();
    
    element.appendChild(circle);
}

// Toast notifications
function showSuccessToast(message) {
    showToast(message, 'success');
}

function showErrorToast(message) {
    showToast(message, 'error');
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 100);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Add CSS for ripple and toast animations
const style = document.createElement('style');
style.textContent = `
    .ripple {
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.6);
        transform: scale(0);
        animation: ripple-animation 0.6s linear;
        pointer-events: none;
    }
    
    @keyframes ripple-animation {
        to { transform: scale(4); opacity: 0; }
    }
    
    .toast {
        position: fixed;
        top: 24px;
        right: -400px;
        padding: 16px 24px;
        border-radius: 12px;
        font-weight: 600;
        color: white;
        z-index: 10000;
        box-shadow: 0 20px 40px rgba(0,0,0,0.15);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        max-width: 350px;
        word-wrap: break-word;
    }
    
    .toast.show { right: 24px; transform: translateY(0); }
    .toast-success { background: linear-gradient(135deg, #10b981, #059669); }
    .toast-error { background: linear-gradient(135deg, #ef4444, #dc2626); }
    
    .mobile-menu-toggle { display: none; }
    @media (max-width: 992px) {
        .mobile-menu-toggle {
            display: block;
            background: none;
            border: none;
            font-size: 20px;
            color: #1e293b;
            padding: 8px;
            border-radius: 8px;
            cursor: pointer;
        }
    }
`;
document.head.appendChild(style);

function logout() {
    sessionStorage.removeItem('isLoggedIn'); // Clear the "key"
    window.location.href = 'doctor_login.html'; // Go back to login
}