// Task service configuration
const TASK_API_URL = 'http://localhost:8082/api/tasks';

// DOM Elements
const tasksList = document.getElementById('tasks-list');
const newTaskBtn = document.getElementById('new-task-btn');
const taskFormModal = document.getElementById('task-form-modal');
const closeModalBtn = document.querySelector('.close');
const taskForm = document.getElementById('task-form');
const taskFormTitle = document.getElementById('task-form-title');
const saveTaskBtn = document.getElementById('save-task-btn');
const cancelTaskBtn = document.getElementById('cancel-task-btn');
const taskIdInput = document.getElementById('task-id');
const statusFilter = document.getElementById('status-filter');
const priorityFilter = document.getElementById('priority-filter');
const filterBtn = document.getElementById('filter-btn');
const showOverdueBtn = document.getElementById('show-overdue-btn');
const dashboardAddTaskBtn = document.getElementById('dashboard-add-task-btn');

// Add event listeners when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Only add event listeners if elements exist
    if (newTaskBtn) {
        newTaskBtn.addEventListener('click', openAddTaskModal);
    }
    
    if (dashboardAddTaskBtn) {
        dashboardAddTaskBtn.addEventListener('click', openAddTaskModal);
    }
    
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeModal);
    }
    
    if (cancelTaskBtn) {
        cancelTaskBtn.addEventListener('click', closeModal);
    }
    
    if (taskForm) {
        taskForm.addEventListener('submit', handleTaskFormSubmit);
    }
    
    if (filterBtn) {
        filterBtn.addEventListener('click', applyFilters);
    }
    
    if (showOverdueBtn) {
        showOverdueBtn.addEventListener('click', showOverdueTasks);
    }
});

// Load all tasks
async function loadTasks() {
    if (!tasksList) return;
    
    showLoading(tasksList);
    
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('No token found');
            window.router.navigateTo('/login');
            return;
        }

        console.log('Loading tasks with token:', token.substring(0, 15) + '...');
        
        const response = await fetch(TASK_API_URL, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('Tasks response status:', response.status);

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                // Unauthorized or Forbidden - token expired or invalid
                console.error('Authentication failed. Clearing token and redirecting to login');
                localStorage.removeItem('token');
                window.router.navigateTo('/login');
                return;
            }
            throw new Error(`Failed to load tasks: ${response.status}`);
        }

        const tasks = await response.json();
        console.log(`Loaded ${tasks.length} tasks`);
        renderTasks(tasks);
    } catch (error) {
        console.error('Error loading tasks:', error);
        tasksList.innerHTML = `<p class="error">Error: ${error.message}</p>`;
    } finally {
        hideLoading(tasksList);
    }
}

// Render tasks in the UI
function renderTasks(tasks) {
    if (!tasksList) return;
    
    tasksList.innerHTML = '';

    if (tasks.length === 0) {
        tasksList.innerHTML = '<p class="no-tasks">No tasks found. Create a new task to get started.</p>';
        return;
    }

    tasks.forEach(task => {
        const taskElement = createTaskElement(task);
        tasksList.appendChild(taskElement);
    });
}

// Create a task card element
function createTaskElement(task) {
    const taskCard = document.createElement('div');
    taskCard.className = `task-card ${task.priority.toLowerCase()}-priority`;
    
    if (task.overdue) {
        taskCard.classList.add('overdue');
    }

    const dueDate = new Date(task.dueDate).toLocaleDateString();
    
    taskCard.innerHTML = `
        <h3>${task.title}</h3>
        <div class="task-meta">
            <span>Status: ${formatStatus(task.status)}</span>
            <span>Priority: ${formatPriority(task.priority)}</span>
            <span>Due: ${dueDate}</span>
            ${task.overdue ? '<span class="overdue-label">OVERDUE</span>' : ''}
        </div>
        <p>${task.description || 'No description provided.'}</p>
        <div class="task-actions">
            <button class="edit-btn" data-id="${task.id}">Edit</button>
            <button class="delete-btn" data-id="${task.id}">Delete</button>
        </div>
    `;

    // Add event listeners to buttons
    taskCard.querySelector('.edit-btn').addEventListener('click', () => openEditTaskModal(task));
    taskCard.querySelector('.delete-btn').addEventListener('click', () => deleteTask(task.id));

    return taskCard;
}

// Format status for display
function formatStatus(status) {
    switch (status) {
        case 'TODO':
            return 'To-Do';
        case 'IN_PROGRESS':
            return 'In Progress';
        case 'DONE':
            return 'Done';
        case 'BLOCKER':
            return 'Blocker';
        default:
            return status;
    }
}

// Format priority for display
function formatPriority(priority) {
    switch (priority) {
        case 'LOW':
            return 'Low';
        case 'MEDIUM':
            return 'Medium';
        case 'HIGH':
            return 'High';
        default:
            return priority;
    }
}

// Open modal for adding a new task
function openAddTaskModal() {
    taskFormTitle.textContent = 'Add New Task';
    taskIdInput.value = '';
    taskForm.reset();
    
    // Set default values
    document.getElementById('task-status').value = 'TODO';
    document.getElementById('task-priority').value = 'MEDIUM';
    document.getElementById('task-due-date').value = new Date().toISOString().split('T')[0];
    
    taskFormModal.classList.remove('hidden');
}

// Open modal for editing a task
function openEditTaskModal(task) {
    taskFormTitle.textContent = 'Edit Task';
    taskIdInput.value = task.id;
    
    document.getElementById('task-title').value = task.title;
    document.getElementById('task-description').value = task.description || '';
    document.getElementById('task-status').value = task.status;
    document.getElementById('task-priority').value = task.priority;
    document.getElementById('task-due-date').value = task.dueDate;
    
    taskFormModal.classList.remove('hidden');
}

// Close the task modal
function closeModal() {
    taskFormModal.classList.add('hidden');
}

// Handle task form submission (create/update)
async function handleTaskFormSubmit(e) {
    e.preventDefault();
    
    const token = localStorage.getItem('token');
    if (!token) {
        console.error('No token found');
        window.router.navigateTo('/login');
        return;
    }
    
    const taskId = taskIdInput.value;
    const isEditMode = !!taskId;
    
    const taskData = {
        title: document.getElementById('task-title').value,
        description: document.getElementById('task-description').value,
        status: document.getElementById('task-status').value,
        priority: document.getElementById('task-priority').value,
        dueDate: document.getElementById('task-due-date').value
    };
    
    try {
        let url = TASK_API_URL;
        let method = 'POST';
        
        if (isEditMode) {
            url = `${TASK_API_URL}/${taskId}`;
            method = 'PUT';
        }
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(taskData)
        });
        
        if (!response.ok) {
            if (response.status === 401) {
                localStorage.removeItem('token');
                window.router.navigateTo('/login');
                return;
            }
            throw new Error(`Failed to ${isEditMode ? 'update' : 'create'} task`);
        }
        
        // Close modal and reload tasks & dashboard
        closeModal();
        loadTasks();
        
        // Refresh dashboard if it's available
        if (typeof loadDashboard === 'function') {
            loadDashboard();
        }
        
    } catch (error) {
        console.error(`Error ${isEditMode ? 'updating' : 'creating'} task:`, error);
    }
}

// Delete a task
async function deleteTask(taskId) {
    if (!confirm('Are you sure you want to delete this task?')) {
        return;
    }
    
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('No token found');
            window.router.navigateTo('/login');
            return;
        }
        
        const response = await fetch(`${TASK_API_URL}/${taskId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            if (response.status === 401) {
                localStorage.removeItem('token');
                window.router.navigateTo('/login');
                return;
            }
            throw new Error('Failed to delete task');
        }
        
        // Reload tasks and dashboard
        loadTasks();
        
        // Refresh dashboard if it's available
        if (typeof loadDashboard === 'function') {
            loadDashboard();
        }
        
    } catch (error) {
        console.error('Error deleting task:', error);
    }
}

// Apply status and priority filters
function applyFilters() {
    const status = statusFilter.value;
    const priority = priorityFilter.value;
    
    if (status === 'ALL' && priority === 'ALL') {
        loadTasks();
        return;
    }
    
    fetchFilteredTasks(status, priority);
}

// Fetch tasks with filters
async function fetchFilteredTasks(status, priority) {
    if (!tasksList) return;
    
    showLoading(tasksList);
    
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('No token found');
            window.router.navigateTo('/login');
            return;
        }
        
        let url = TASK_API_URL;
        
        if (status !== 'ALL' && priority === 'ALL') {
            url = `${TASK_API_URL}/status/${status}`;
        } else if (status === 'ALL' && priority !== 'ALL') {
            url = `${TASK_API_URL}/priority/${priority}`;
        } else {
            // For both filters, fetch all and filter in memory
            // This is a simplification - in a real app you'd have an API endpoint for combined filters
            const response = await fetch(TASK_API_URL, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                if (response.status === 401) {
                    localStorage.removeItem('token');
                    window.router.navigateTo('/login');
                    return;
                }
                throw new Error('Failed to load tasks');
            }
            
            const allTasks = await response.json();
            const filteredTasks = allTasks.filter(task => 
                (status === 'ALL' || task.status === status) && 
                (priority === 'ALL' || task.priority === priority)
            );
            
            renderTasks(filteredTasks);
            hideLoading(tasksList);
            return;
        }
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            if (response.status === 401) {
                localStorage.removeItem('token');
                window.router.navigateTo('/login');
                return;
            }
            throw new Error('Failed to load filtered tasks');
        }
        
        const tasks = await response.json();
        renderTasks(tasks);
        
    } catch (error) {
        console.error('Error fetching filtered tasks:', error);
        if (tasksList) {
            tasksList.innerHTML = `<p class="error">Error: ${error.message}</p>`;
        }
    } finally {
        if (tasksList) {
            hideLoading(tasksList);
        }
    }
}

// Show overdue tasks
async function showOverdueTasks() {
    if (!tasksList) return;
    
    showLoading(tasksList);
    
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('No token found');
            window.router.navigateTo('/login');
            return;
        }
        
        const response = await fetch(`${TASK_API_URL}/overdue`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            if (response.status === 401) {
                localStorage.removeItem('token');
                window.router.navigateTo('/login');
                return;
            }
            throw new Error('Failed to load overdue tasks');
        }
        
        const tasks = await response.json();
        renderTasks(tasks);
        
    } catch (error) {
        console.error('Error fetching overdue tasks:', error);
        tasksList.innerHTML = `<p class="error">Error: ${error.message}</p>`;
    } finally {
        hideLoading(tasksList);
    }
} 