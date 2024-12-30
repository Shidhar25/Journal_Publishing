import { auth, db } from '../../../config/firebase.js';
import { signInWithEmailAndPassword, signOut } from '/node_modules/firebase/auth/dist/esm/index.esm.js';
import { collection, getDocs, doc, deleteDoc, getDoc } from '/node_modules/firebase/firestore/dist/esm/index.esm.js';

// DOM Elements
const loginContainer = document.getElementById('loginContainer');
const dashboardContainer = document.getElementById('dashboardContainer');
const adminEmail = document.getElementById('adminEmail');
const adminPassword = document.getElementById('adminPassword');
const adminLoginBtn = document.getElementById('adminLoginBtn');
const adminEmailDisplay = document.getElementById('adminEmailDisplay');
const logoutBtn = document.getElementById('logoutBtn');
const papersView = document.getElementById('papersView');
const usersView = document.getElementById('usersView');
const paperSearch = document.getElementById('paperSearch');
const userSearch = document.getElementById('userSearch');
const navLinks = document.querySelectorAll('[data-view]');
const paperDetailsModal = new bootstrap.Modal(document.getElementById('paperDetailsModal'));
const deletePaperBtn = document.getElementById('deletePaperBtn');

// Check Authentication State
auth.onAuthStateChanged(async (user) => {
    if (user) {
        // Check if user is admin
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists() && userDoc.data().isAdmin) {
            showDashboard(user);
        } else {
            await signOut(auth);
            showLogin();
        }
    } else {
        showLogin();
    }
});

// Show/Hide Containers
function showLogin() {
    loginContainer.classList.remove('d-none');
    dashboardContainer.classList.add('d-none');
}

function showDashboard(user) {
    loginContainer.classList.add('d-none');
    dashboardContainer.classList.remove('d-none');
    adminEmailDisplay.textContent = user.email;
    loadPapers();
}

// Login Handler
adminLoginBtn.addEventListener('click', async () => {
    try {
        const email = adminEmail.value;
        const password = adminPassword.value;
        await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
        console.error('Login error:', error);
        alert('Failed to login. Please check your credentials.');
    }
});

// Logout Handler
logoutBtn.addEventListener('click', async () => {
    try {
        await signOut(auth);
    } catch (error) {
        console.error('Logout error:', error);
        alert('Failed to logout');
    }
});

// Navigation
navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const view = e.target.dataset.view;
        showView(view);
    });
});

function showView(view) {
    papersView.classList.add('d-none');
    usersView.classList.add('d-none');
    
    if (view === 'papers') {
        papersView.classList.remove('d-none');
        loadPapers();
    } else if (view === 'users') {
        usersView.classList.remove('d-none');
        loadUsers();
    }
    
    // Update active nav link
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.dataset.view === view) {
            link.classList.add('active');
        }
    });
}

// Load Papers
async function loadPapers() {
    try {
        const papersRef = collection(db, 'papers');
        const snapshot = await getDocs(papersRef);
        const papers = [];
        
        snapshot.forEach(doc => {
            papers.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        displayPapers(papers);
    } catch (error) {
        console.error('Error loading papers:', error);
        alert('Failed to load papers');
    }
}

function displayPapers(papers) {
    const tbody = document.getElementById('papersTableBody');
    tbody.innerHTML = '';
    
    papers.forEach(paper => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${paper.title}</td>
            <td>${paper.author}</td>
            <td>${new Date(paper.submissionDate).toLocaleDateString()}</td>
            <td><span class="badge bg-${getStatusBadgeColor(paper.status)}">${paper.status}</span></td>
            <td>
                <button class="btn btn-sm btn-primary view-paper" data-paper-id="${paper.id}">View</button>
                <button class="btn btn-sm btn-danger delete-paper" data-paper-id="${paper.id}">Delete</button>
            </td>
        `;
        
        tbody.appendChild(row);
    });
    
    // Add event listeners
    document.querySelectorAll('.view-paper').forEach(btn => {
        btn.addEventListener('click', () => viewPaperDetails(btn.dataset.paperId));
    });
    
    document.querySelectorAll('.delete-paper').forEach(btn => {
        btn.addEventListener('click', () => deletePaper(btn.dataset.paperId));
    });
}

function getStatusBadgeColor(status) {
    switch (status.toLowerCase()) {
        case 'pending': return 'warning';
        case 'approved': return 'success';
        case 'rejected': return 'danger';
        default: return 'secondary';
    }
}

// Load Users
async function loadUsers() {
    try {
        const usersRef = collection(db, 'users');
        const snapshot = await getDocs(usersRef);
        const users = [];
        
        snapshot.forEach(doc => {
            const userData = doc.data();
            users.push({
                id: doc.id,
                email: userData.email,
                name: userData.name,
                papersCount: userData.papersCount || 0
            });
        });
        
        displayUsers(users);
    } catch (error) {
        console.error('Error loading users:', error);
        alert('Failed to load users');
    }
}

function displayUsers(users) {
    const tbody = document.getElementById('usersTableBody');
    tbody.innerHTML = '';
    
    users.forEach(user => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td>${user.papersCount}</td>
            <td>
                <button class="btn btn-sm btn-primary view-user-papers" data-user-id="${user.id}">View Papers</button>
            </td>
        `;
        
        tbody.appendChild(row);
    });
    
    // Add event listeners
    document.querySelectorAll('.view-user-papers').forEach(btn => {
        btn.addEventListener('click', () => loadUserPapers(btn.dataset.userId));
    });
}

// Paper Details
async function viewPaperDetails(paperId) {
    try {
        const paperDoc = await getDoc(doc(db, 'papers', paperId));
        if (paperDoc.exists()) {
            const paper = paperDoc.data();
            document.getElementById('paperDetailsContent').innerHTML = `
                <div class="mb-3">
                    <h6>Title</h6>
                    <p>${paper.title}</p>
                </div>
                <div class="mb-3">
                    <h6>Author</h6>
                    <p>${paper.author}</p>
                </div>
                <div class="mb-3">
                    <h6>Abstract</h6>
                    <p>${paper.abstract}</p>
                </div>
                <div class="mb-3">
                    <h6>Status</h6>
                    <p><span class="badge bg-${getStatusBadgeColor(paper.status)}">${paper.status}</span></p>
                </div>
                <div class="mb-3">
                    <h6>Submission Date</h6>
                    <p>${new Date(paper.submissionDate).toLocaleString()}</p>
                </div>
                <div class="mb-3">
                    <h6>Download</h6>
                    <a href="${paper.fileUrl}" class="btn btn-primary" target="_blank">Download Paper</a>
                </div>
            `;
            
            deletePaperBtn.dataset.paperId = paperId;
            paperDetailsModal.show();
        }
    } catch (error) {
        console.error('Error loading paper details:', error);
        alert('Failed to load paper details');
    }
}

// Delete Paper
async function deletePaper(paperId) {
    if (confirm('Are you sure you want to delete this paper?')) {
        try {
            await deleteDoc(doc(db, 'papers', paperId));
            paperDetailsModal.hide();
            loadPapers();
        } catch (error) {
            console.error('Error deleting paper:', error);
            alert('Failed to delete paper');
        }
    }
}

// Search Functionality
paperSearch.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const rows = document.querySelectorAll('#papersTableBody tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
});

userSearch.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const rows = document.querySelectorAll('#usersTableBody tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}); 