// This file contains initialization code and utilities that are shared across the application

// Handle clicks outside the modal to close it
window.addEventListener('click', (e) => {
    if (e.target === document.getElementById('task-form-modal')) {
        document.getElementById('task-form-modal').classList.add('hidden');
    }
});

// Error handler for fetch requests
async function handleResponse(response) {
    if (!response.ok) {
        let errorMessage = 'An error occurred';
        try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
        } catch (e) {
            errorMessage = `${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
    }
    return response.json();
}

// Format date to YYYY-MM-DD
function formatDate(date) {
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day].join('-');
}

// Add a loading indicator
function showLoading(element) {
    element.innerHTML = '<div class="loading-spinner"></div>';
}

// Remove loading indicator
function hideLoading(element) {
    const spinner = element.querySelector('.loading-spinner');
    if (spinner) {
        spinner.remove();
    }
}

// Utility function to validate form inputs
function validateForm(formId) {
    const form = document.getElementById(formId);
    const inputs = form.querySelectorAll('input[required], textarea[required], select[required]');
    
    let isValid = true;
    
    inputs.forEach(input => {
        if (!input.value.trim()) {
            isValid = false;
            input.classList.add('invalid');
        } else {
            input.classList.remove('invalid');
        }
    });
    
    return isValid;
}

// Log for debugging purposes
console.log('Task Management System initialized');

// Handle page refresh to properly restore authentication state
window.addEventListener('load', () => {
    console.log('Page loaded/reloaded - verifying authentication state');
    
    // Make sure auth container is hidden when authenticated
    const token = localStorage.getItem('token');
    if (token) {
        const authContainer = document.getElementById('auth-container');
        if (authContainer) {
            authContainer.classList.add('hidden');
        }
        
        const userInfo = document.getElementById('user-info');
        if (userInfo) {
            userInfo.classList.remove('hidden');
        }
    }
}); 