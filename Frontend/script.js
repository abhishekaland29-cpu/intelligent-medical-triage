// 1. Run this when the page first loads
document.addEventListener('DOMContentLoaded', () => {
    loadQueue();
    setupPainVisualizer();
});

// 2. Setup the Pain Visualizer
function setupPainVisualizer() {
    const pPain = document.getElementById('pPain');
    const painBar = document.getElementById('painBar');
    
    if (!pPain || !painBar) return;

    pPain.addEventListener('input', () => {
        const val = pPain.value;
        const width = (val / 10) * 100;
        painBar.style.width = width + '%';
        
        if (val < 4) painBar.style.background = '#198754';
        else if (val < 7) painBar.style.background = '#ffc107';
        else painBar.style.background = '#dc3545';
    });
}

// 3. Handle Form Submission - UPDATED FOR DEPLOYMENT
document.getElementById('patientForm').addEventListener('submit', async (e) => {
    e.preventDefault(); 

    const nameValue = document.getElementById('pName').value.trim();
    const symptomsValue = document.getElementById('pSymptoms').value.trim();
    const painValue = document.getElementById('pPain').value;

    if (!nameValue || !symptomsValue) {
        alert("Please fill in both the Name and Symptoms!");
        return;
    }

    const data = {
        name: nameValue,
        symptoms: symptomsValue,
        painLevel: painValue
    };

    try {
        // REMOVED localhost:3000 -> Uses relative path for Render
        const response = await fetch('/api/triage', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (response.ok) {
            alert(`Success! Priority: ${result.ai_decision.priority}\nReason: ${result.ai_decision.reason}`);
            document.getElementById('patientForm').reset();
            loadQueue(); 
        }
    } catch (err) {
        console.error("Submission error:", err);
        alert("Server is not responding.");
    }
});

// ... (Your existing Sections 1, 2, and 3 stay the same) ...

// 4. Fetch and Display the Queue
async function loadQueue() {
    try {
        const response = await fetch('/api/queue');
        const patients = await response.json();
        
        const listDiv = document.getElementById('queueList');
        if (!listDiv) return;

        listDiv.innerHTML = ''; 

        patients.forEach(p => {
            // Add a "Mark as Treated" button if the status isn't already 'Treated'
            const actionButton = p.status !== 'Treated' 
                ? `<button onclick="updateStatus(${p.id}, 'Treated')" class="btn btn-sm btn-outline-light mt-2">Mark as Treated</button>` 
                : `<span class="badge bg-success mt-2">Treated</span>`;

            listDiv.innerHTML += `
                <div class="queue-item priority-${p.priority} mb-3 p-3 border rounded shadow-sm">
                    <div class="d-flex justify-content-between align-items-start">
                        <div>
                            <h5 class="text-white mb-1">${p.name}</h5>
                            <p class="text-white-50 small mb-0">${p.symptoms}</p>
                        </div>
                        <div class="badge bg-primary">Priority ${p.priority}</div>
                    </div>
                    <div class="mt-2 text-white-50 small">
                        <strong>AI Analysis:</strong> ${p.ai_reason || 'Processing...'}
                    </div>
                    ${actionButton} 
                </div>
            `;
        });
    } catch (err) {
        console.error("Queue load error:", err);
    }
}

// 5. NEW: Function to update status in the database
async function updateStatus(id, newStatus) {
    try {
        const response = await fetch(`/api/status/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });

        if (response.ok) {
            loadQueue(); // Refresh the list to show the change
        } else {
            alert("Failed to update status");
        }
    } catch (err) {
        console.error("Update error:", err);
    }
}