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
        const response = await fetch('/api/branches', {
            headers: {
                Authorization: `Bearer ${localStorage.getItem('authToken')}`,
            },
        });
        if (!response.ok) {
            throw new Error('Failed to load branches');
        }
        const branches = await response.json();
        branchDropdown.innerHTML = ''; // Clear existing options
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
        loadBranches(); // Load branches after confirming authentication
    } else {
        authContainer.style.display = 'block';
        mainContent.style.display = 'none';
    }
};

// Handle registration
document.getElementById('register-btn').addEventListener('click', async () => {
    const username = document.getElementById('reg-username').value;
    const password = document.getElementById('reg-password').value;

    const response = await fetch('/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
    });

    const data = await response.json();
    regMessage.textContent = response.ok ? 'Registration successful!' : data.error;
});

// Handle login
document.getElementById('login-btn').addEventListener('click', async () => {

    try {
        const response = await fetch('/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });
    
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Login failed');
        }
    
        const data = await response.json();
        localStorage.setItem('authToken', data.token);
        checkAuth(); // Reload content after successful login
    } catch (error) {
        loginMessage.textContent = error.message;
    }

});


// Handle sales report upload
document.getElementById('sales-form').addEventListener('submit', event => {
    event.preventDefault(); // Prevent page refresh
    const fileInput = document.getElementById('sales-file');
    const formData = new FormData();
    formData.append('file', fileInput.files[0]);

    fetch('http://localhost:3000/api/upload/temp', {
        method: 'POST',
        body: formData,
    })
        .then(response => response.json())
        .then(data => {
            alert('Sales report uploaded successfully!');
            uploadedSalesFile = data.tempFilePath; // Save the temporary file path
        })
        .catch(console.error);
});

// Handle warehouse report upload
document.getElementById('warehouse-form').addEventListener('submit', event => {
    event.preventDefault(); // Prevent page refresh
    const fileInput = document.getElementById('warehouse-file');
    const formData = new FormData();
    formData.append('file', fileInput.files[0]);

    fetch('http://localhost:3000/api/upload/temp', {
        method: 'POST',
        body: formData,
    })
        .then(response => response.json())
        .then(data => {
            alert('Warehouse report uploaded successfully!');
            uploadedWarehouseFile = data.tempFilePath; // Save the temporary file path
        })
        .catch(console.error);
});

// Handle removed items upload
document.getElementById('removed-items-form').addEventListener('submit', event => {
    event.preventDefault(); // Prevent page refresh
    const fileInput = document.getElementById('removed-file');
    const formData = new FormData();
    formData.append('file', fileInput.files[0]);

    fetch('http://localhost:3000/api/upload/temp', {
        method: 'POST',
        body: formData,
    })
        .then(response => response.json())
        .then(data => {
            alert('Removed items uploaded successfully!');
            uploadedRemoveFile = data.tempFilePath; // Save the temporary file path
        })
        .catch(console.error);
});

// Handle generate button click
document.getElementById('generate-button').addEventListener('click', async () => {
    const branchId = document.getElementById('branch').value;

    // Check if branch is selected
    if (!branchId) {
        alert('Please select a branch');
        return;
    }

    // Check if required files are uploaded
    if (!uploadedSalesFile || !uploadedWarehouseFile) {
        alert('Please upload both sales and warehouse reports');
        return;
    }

    try {
        // Make a POST request to the "generate" endpoint
        const response = await fetch('http://localhost:3000/api/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${localStorage.getItem('authToken')}`, // Pass the token
            },
            body: JSON.stringify({
                branch_id: branchId,
                salesFilePath: uploadedSalesFile,
                warehouseFilePath: uploadedWarehouseFile,
                removedFilePath: uploadedRemoveFile || null, // Optional field
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
    checkAuth(); // Redirect to login after logout
});

// Check authentication on page load
window.onload = checkAuth;


