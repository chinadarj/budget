// Set API base URL
// const API_BASE = 'https://budget-4mvuv2ggo-chinadarjs-projects.vercel.app'; // Change this if backend is hosted elsewhere
const API_BASE = 'http://localhost:3000'; // Change this if backend is hosted elsewhere


const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const authContainer = document.getElementById('auth-container');
const mainContent = document.getElementById('main-content');
const toggleAuthBtn = document.getElementById('toggle-auth-btn');
const loginMessage = document.getElementById('login-message');
const regMessage = document.getElementById('reg-message');
const logoutBtn = document.getElementById('logout-btn');
const branchDropdown = document.getElementById('branch');

let isLogin = true;
let uploadedSalesFile = null;
let uploadedWarehouseFile = null;
let uploadedRemoveFile = null;

// Switch between login and registration
toggleAuthBtn.addEventListener('click', () => {
    isLogin = !isLogin;
    loginForm.style.display = isLogin ? 'block' : 'none';
    registerForm.style.display = isLogin ? 'none' : 'block';
    toggleAuthBtn.textContent = isLogin ? 'Switch to Register' : 'Switch to Login';
});

// Fetch branches and populate the dropdown
const loadBranches = async () => {
    try {
        const response = await fetch(`${API_BASE}/api/branches`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem('authToken')}`,
            },
        });
        if (!response.ok) {
            throw new Error('Failed to load branches');
        }
        const branches = await response.json();
        branchDropdown.innerHTML = '';
        branches.forEach(branch => {
            const option = document.createElement('option');
            option.value = branch._id;
            option.textContent = branch.name;
            branchDropdown.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading branches:', error);
    }
};

// Check authentication and load content
const checkAuth = () => {
    const token = localStorage.getItem('authToken');
    if (token) {
        authContainer.style.display = 'none';
        mainContent.style.display = 'block';
        loadBranches();
    } else {
        authContainer.style.display = 'block';
        mainContent.style.display = 'none';
    }
};

// Handle registration
document.getElementById('register-btn').addEventListener('click', async () => {
    const username = document.getElementById('reg-username').value;
    const password = document.getElementById('reg-password').value;

    const response = await fetch(`${API_BASE}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
    });

    const data = await response.json();
    regMessage.textContent = response.ok ? 'Registration successful!' : data.error;
});

// Handle login
document.getElementById('login-btn').addEventListener('click', async () => {
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    const response = await fetch(`${API_BASE}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

    if (response.ok) {
        localStorage.setItem('authToken', data.token);
        checkAuth();
    } else {
        loginMessage.textContent = data.error;
    }
});

// Handle sales report upload
document.getElementById('sales-form').addEventListener('submit', event => {
    event.preventDefault();
    const fileInput = document.getElementById('sales-file');
    const formData = new FormData();
    formData.append('file', fileInput.files[0]);

    fetch(`${API_BASE}/api/upload/temp`, {
        method: 'POST',
        body: formData,
    })
        .then(response => response.json())
        .then(data => {
            alert('Sales report uploaded successfully!');
            uploadedSalesFile = data.tempFilePath;
        })
        .catch(console.error);
});

// Handle warehouse report upload
document.getElementById('warehouse-form').addEventListener('submit', event => {
    event.preventDefault();
    const fileInput = document.getElementById('warehouse-file');
    const formData = new FormData();
    formData.append('file', fileInput.files[0]);

    fetch(`${API_BASE}/api/upload/temp`, {
        method: 'POST',
        body: formData,
    })
        .then(response => response.json())
        .then(data => {
            alert('Warehouse report uploaded successfully!');
            uploadedWarehouseFile = data.tempFilePath;
        })
        .catch(console.error);
});

// Handle removed items upload
document.getElementById('removed-items-form').addEventListener('submit', event => {
    event.preventDefault();
    const fileInput = document.getElementById('removed-file');
    const formData = new FormData();
    formData.append('file', fileInput.files[0]);

    fetch(`${API_BASE}/api/upload/temp`, {
        method: 'POST',
        body: formData,
    })
        .then(response => response.json())
        .then(data => {
            alert('Removed items uploaded successfully!');
            uploadedRemoveFile = data.tempFilePath;
        })
        .catch(console.error);
});

// Handle generate button click
document.getElementById('generate-button').addEventListener('click', async () => {
    const branchId = document.getElementById('branch').value;

    if (!branchId) {
        alert('Please select a branch');
        return;
    }

    if (!uploadedSalesFile || !uploadedWarehouseFile) {
        alert('Please upload both sales and warehouse reports');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/api/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${localStorage.getItem('authToken')}`,
            },
            body: JSON.stringify({
                branch_id: branchId,
                salesFilePath: uploadedSalesFile,
                warehouseFilePath: uploadedWarehouseFile,
                removedFilePath: uploadedRemoveFile || null,
            }),
        });

        const data = await response.json();

        if (response.ok) {
            alert(data.message || 'Sales order generated successfully!');
        } else {
            alert(data.error || 'Failed to generate sales order');
        }
    } catch (error) {
        console.error('Error generating sales order:', error);
        alert('An error occurred while generating the sales order. Please try again.');
    }
});

// Handle logout
logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('authToken');
    checkAuth();
});

// Check authentication on page load
window.onload = checkAuth;
