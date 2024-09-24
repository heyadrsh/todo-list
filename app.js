// Todo Class
class Todo {
    constructor(id, text, completed = false, priority = 'low', dueDate = null, category = 'none', isImportant = false, notes = '', remindAt = null, subtasks = [], recurrence = null, tags = [], estimatedTime = null, syncStatus = 'synced') {
        this.id = id;
        this.text = text;
        this.completed = completed;
        this.priority = priority;
        this.dueDate = dueDate;
        this.category = category;
        this.isImportant = isImportant;
        this.notes = notes;
        this.createdAt = new Date();
        this.completedAt = null;
        this.remindAt = remindAt;
        this.subtasks = subtasks;
        this.recurrence = recurrence; // null, 'daily', 'weekly', 'monthly', 'custom'
        this.tags = tags;
        this.estimatedTime = estimatedTime; // in minutes
        this.syncStatus = syncStatus; // 'synced', 'pending', 'failed'
    }

    isOverdue() {
        if (!this.dueDate || this.completed) return false;
        return new Date(this.dueDate) < new Date().setHours(0, 0, 0, 0);
    }

    isDueToday() {
        if (!this.dueDate) return false;
        const today = new Date().setHours(0, 0, 0, 0);
        return new Date(this.dueDate).setHours(0, 0, 0, 0) === today;
    }

    isDueThisWeek() {
        if (!this.dueDate) return false;
        
        const today = new Date();
        const dueDate = new Date(this.dueDate);
        
        // Set to beginning of day
        today.setHours(0, 0, 0, 0);
        dueDate.setHours(0, 0, 0, 0);
        
        // Calculate beginning of week (Sunday)
        const beginOfWeek = new Date(today);
        beginOfWeek.setDate(today.getDate() - today.getDay());
        
        // Calculate end of week (Saturday)
        const endOfWeek = new Date(beginOfWeek);
        endOfWeek.setDate(beginOfWeek.getDate() + 6);
        
        return dueDate >= beginOfWeek && dueDate <= endOfWeek;
    }

    addSubtask(text, completed = false) {
        const subtask = {
            id: Date.now().toString(),
            text,
            completed
        };
        this.subtasks.push(subtask);
        return subtask;
    }

    deleteSubtask(subtaskId) {
        this.subtasks = this.subtasks.filter(subtask => subtask.id !== subtaskId);
    }

    toggleSubtask(subtaskId) {
        const subtask = this.subtasks.find(subtask => subtask.id === subtaskId);
        if (subtask) {
            subtask.completed = !subtask.completed;
            
            // Check if all subtasks are completed and update parent task
            const allSubtasksCompleted = this.subtasks.every(subtask => subtask.completed);
            if (allSubtasksCompleted && this.subtasks.length > 0) {
                this.completed = true;
                this.completedAt = new Date();
            } else {
                this.completed = false;
                this.completedAt = null;
            }
        }
    }

    setCompleted(completed) {
        this.completed = completed;
        if (completed) {
            this.completedAt = new Date();
            
            // If completed and has recurrence rule, create next occurrence
            if (this.recurrence) {
                return this.createNextOccurrence();
            }
        } else {
            this.completedAt = null;
        }
        return null;
    }

    createNextOccurrence() {
        const nextDueDate = this.calculateNextDueDate();
        if (!nextDueDate) return null;
        
        // Create a new task based on this one
        const newTask = new Todo(
            Date.now().toString(),
            this.text,
            false,
            this.priority,
            nextDueDate,
            this.category,
            this.isImportant,
            this.notes,
            null, // No reminder for next occurrence yet
            [], // No subtasks for next occurrence
            this.recurrence,
            this.tags,
            this.estimatedTime
        );
        
        return newTask;
    }

    calculateNextDueDate() {
        if (!this.dueDate || !this.recurrence) return null;
        
        const currentDueDate = new Date(this.dueDate);
        let nextDueDate = new Date(currentDueDate);
        
        switch (this.recurrence) {
            case 'daily':
                nextDueDate.setDate(currentDueDate.getDate() + 1);
                break;
            case 'weekdays':
                // Skip to the next weekday (Mon-Fri)
                nextDueDate.setDate(currentDueDate.getDate() + 1);
                // If it's a weekend, adjust
                if (nextDueDate.getDay() === 0) { // Sunday
                    nextDueDate.setDate(nextDueDate.getDate() + 1);
                } else if (nextDueDate.getDay() === 6) { // Saturday
                    nextDueDate.setDate(nextDueDate.getDate() + 2);
                }
                break;
            case 'weekly':
                nextDueDate.setDate(currentDueDate.getDate() + 7);
                break;
            case 'biweekly':
                nextDueDate.setDate(currentDueDate.getDate() + 14);
                break;
            case 'monthly':
                nextDueDate.setMonth(currentDueDate.getMonth() + 1);
                break;
            case 'quarterly':
                nextDueDate.setMonth(currentDueDate.getMonth() + 3);
                break;
            case 'yearly':
                nextDueDate.setFullYear(currentDueDate.getFullYear() + 1);
                break;
            default:
                return null;
        }
        
        return nextDueDate.toISOString().split('T')[0];
    }

    shouldRemind() {
        if (!this.remindAt || this.completed) return false;
        
        const now = new Date();
        const reminderTime = new Date(this.remindAt);
        
        // Return true if the reminder time is less than 1 minute in the future
        // or up to 5 minutes in the past (to catch any reminders that might have been missed)
        const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
        return reminderTime <= now && reminderTime >= fiveMinutesAgo;
    }

    getReminderOptions() {
        return {
            title: this.isImportant ? '⭐ ' + this.text : this.text,
            body: `Due: ${this.dueDate ? new Date(this.dueDate).toLocaleDateString() : 'No due date'} (${this.priority} priority)`,
            url: '/',
            taskId: this.id
        };
    }
}

// TodoApp Class
class TodoApp {
    constructor() {
        this.todos = this.loadTodos();
        this.currentView = 'all';
        this.initializeElements();
        this.setupEventListeners();
        this.loadTheme();
        this.setMinDueDate();
        this.renderTodos();
        this.updateStatistics();
        this.registerServiceWorker();
        this.initNotifications();
        this.startReminderCheck();
        this.setupSyncManager();
        this.setupVoiceRecognition();
    }

    initializeElements() {
        // Input and main elements
        this.todoInput = document.getElementById('todo-input');
        this.addButton = document.getElementById('add-todo');
        this.todosContainer = document.getElementById('todos-container');
        this.emptyState = document.querySelector('.empty-state');
        
        // Task form elements
        this.prioritySelect = document.getElementById('priority');
        this.dueDateInput = document.getElementById('due-date');
        this.categorySelect = document.getElementById('category');
        this.importantCheckbox = document.getElementById('important');
        this.reminderDateInput = document.getElementById('reminder-date');
        this.reminderTimeInput = document.getElementById('reminder-time');
        this.repeatOption = document.getElementById('repeat-option');
        this.estimatedTimeInput = document.getElementById('estimated-time');
        
        // Quick add button
        this.quickAddBtn = document.getElementById('quick-add-btn');
        this.taskInputContainer = document.querySelector('.task-input-container');
        
        // Filter elements
        this.filterPriority = document.getElementById('filter-priority');
        this.filterCategory = document.getElementById('filter-category');
        this.filterDue = document.getElementById('filter-due');
        this.sortBy = document.getElementById('sort-by');
        this.searchInput = document.getElementById('search-input');
        this.voiceSearchBtn = document.getElementById('voice-search-btn');
        
        // Statistics
        this.totalTasksElement = document.getElementById('total-tasks');
        this.completedTasksElement = document.getElementById('completed-tasks');
        this.pendingTasksElement = document.getElementById('pending-tasks');
        
        // Navigation
        this.navItems = document.querySelectorAll('.nav-item');
        this.currentViewTitle = document.getElementById('current-view-title');
        
        // Theme toggle
        this.themeToggle = document.getElementById('theme-toggle');
        
        // Modal elements
        this.taskModal = document.getElementById('task-details-modal');
        this.closeModalBtn = document.querySelector('.close-modal');
        this.editTextInput = document.getElementById('edit-text');
        this.editPrioritySelect = document.getElementById('edit-priority');
        this.editDueDateInput = document.getElementById('edit-due-date');
        this.editCategorySelect = document.getElementById('edit-category');
        this.editImportantCheckbox = document.getElementById('edit-important');
        this.editNotesTextarea = document.getElementById('edit-notes');
        this.editReminderDateInput = document.getElementById('edit-reminder-date');
        this.editReminderTimeInput = document.getElementById('edit-reminder-time');
        this.editRepeatOption = document.getElementById('edit-repeat-option');
        this.editEstimatedTimeInput = document.getElementById('edit-estimated-time');
        this.createdDateSpan = document.getElementById('created-date');
        this.saveTaskBtn = document.getElementById('save-task-btn');
        this.deleteTaskBtn = document.getElementById('delete-task-btn');
        this.completedDateSpan = document.getElementById('completed-date');
        
        // Subtasks elements
        this.subtasksContainer = document.getElementById('subtasks-container');
        this.addSubtaskBtn = document.getElementById('add-subtask-btn');
        this.subtaskInput = document.getElementById('subtask-input');
        
        // Toast container
        this.toastContainer = document.getElementById('toast-container');
        
        // Data import/export buttons
        this.exportDataBtn = document.getElementById('export-data-btn');
        this.importDataBtn = document.getElementById('import-data-btn');
        this.importFileInput = document.getElementById('import-file-input');
    }

    setupEventListeners() {
        // Add task events
        this.addButton.addEventListener('click', () => this.addTodo());
        this.todoInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTodo();
        });
        
        // Quick add button
        this.quickAddBtn.addEventListener('click', () => {
            this.taskInputContainer.classList.toggle('hidden');
            if (!this.taskInputContainer.classList.contains('hidden')) {
                this.todoInput.focus();
            }
        });
        
        // Theme toggle
        this.themeToggle.addEventListener('click', () => this.toggleTheme());
        
        // Filter and sort events
        this.filterPriority.addEventListener('change', () => this.renderTodos());
        this.filterCategory.addEventListener('change', () => this.renderTodos());
        this.filterDue.addEventListener('change', () => this.renderTodos());
        this.sortBy.addEventListener('change', () => this.renderTodos());
        this.searchInput.addEventListener('input', () => this.renderTodos());
        
        // Todo item events (using event delegation)
        this.todosContainer.addEventListener('click', (e) => {
            const todoItem = e.target.closest('.todo-item');
            if (!todoItem) return;
            
            const todoId = todoItem.getAttribute('data-id');
            
            // Check if checkbox was clicked
            if (e.target.closest('.todo-checkbox')) {
                this.toggleTodo(todoId);
                return;
            }
            
            // Check if edit button was clicked
            if (e.target.closest('.edit-todo-btn')) {
                this.openEditModal(todoId);
                return;
            }
            
            // Check if delete button was clicked
            if (e.target.closest('.delete-todo-btn')) {
                this.deleteTodo(todoId);
                return;
            }
            
            // If text was clicked, open edit modal
            if (e.target.closest('.todo-content')) {
                this.openEditModal(todoId);
            }
        });
        
        // Navigation events
        this.navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                this.navItems.forEach(nav => nav.classList.remove('active'));
                item.classList.add('active');
                
                this.currentView = item.getAttribute('data-view');
                this.currentViewTitle.textContent = item.querySelector('span').textContent;
                this.renderTodos();
            });
        });
        
        // Modal events
        this.closeModalBtn.addEventListener('click', () => this.closeEditModal());
        this.saveTaskBtn.addEventListener('click', () => this.saveEditedTask());
        this.deleteTaskBtn.addEventListener('click', () => {
            const todoId = this.taskModal.getAttribute('data-todo-id');
            this.deleteTodo(todoId);
            this.closeEditModal();
        });
        
        // Close modal when clicking outside
        this.taskModal.addEventListener('click', (e) => {
            if (e.target === this.taskModal) {
                this.closeEditModal();
            }
        });
        
        // ESC key to close modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.taskModal.classList.contains('show')) {
                this.closeEditModal();
            }
        });
    }

    setMinDueDate() {
        const today = new Date().toISOString().split('T')[0];
        this.dueDateInput.min = today;
        this.editDueDateInput.min = today;
    }

    updateStatistics() {
        const total = this.todos.length;
        const completed = this.todos.filter(todo => todo.completed).length;
        const pending = total - completed;

        this.totalTasksElement.textContent = total;
        this.completedTasksElement.textContent = completed;
        this.pendingTasksElement.textContent = pending;
    }

    loadTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        
        if (savedTheme === 'dark') {
            this.themeToggle.innerHTML = '<i class="fas fa-sun"></i><span>Light Mode</span>';
        } else {
            this.themeToggle.innerHTML = '<i class="fas fa-moon"></i><span>Dark Mode</span>';
        }
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        
        if (newTheme === 'dark') {
            this.themeToggle.innerHTML = '<i class="fas fa-sun"></i><span>Light Mode</span>';
        } else {
            this.themeToggle.innerHTML = '<i class="fas fa-moon"></i><span>Dark Mode</span>';
        }
    }

    loadTodos() {
        const savedTodos = localStorage.getItem('todos');
        if (savedTodos) {
            const todos = JSON.parse(savedTodos);
            return todos.map(todo => {
                const newTodo = new Todo(
                    todo.id,
                    todo.text,
                    todo.completed,
                    todo.priority,
                    todo.dueDate,
                    todo.category || 'none',
                    todo.isImportant || false,
                    todo.notes || '',
                    todo.remindAt,
                    todo.subtasks || [],
                    todo.recurrence,
                    todo.tags || [],
                    todo.estimatedTime,
                    todo.syncStatus || 'synced'
                );
                newTodo.createdAt = new Date(todo.createdAt);
                newTodo.completedAt = todo.completedAt ? new Date(todo.completedAt) : null;
                return newTodo;
            });
        }
        return [];
    }

    saveTodos() {
        localStorage.setItem('todos', JSON.stringify(this.todos));
    }

    addTodo() {
        const text = this.todoInput.value.trim();
        if (!text) {
            this.showToast('Error', 'Task text cannot be empty', 'error');
            return;
        }

        // Get reminder date and time if set
        let remindAt = null;
        const reminderDate = this.reminderDateInput.value;
        const reminderTime = this.reminderTimeInput.value;
        
        if (reminderDate && reminderTime) {
            remindAt = `${reminderDate}T${reminderTime}`;
        }
        
        const newTodo = new Todo(
            Date.now().toString(),
            text,
            false,
            this.prioritySelect.value,
            this.dueDateInput.value || null,
            this.categorySelect.value,
            this.importantCheckbox.checked,
            '',
            remindAt,
            [],
            this.repeatOption.value !== 'never' ? this.repeatOption.value : null,
            [],
            this.estimatedTimeInput.value ? parseInt(this.estimatedTimeInput.value) : null,
            'synced'
        );
        
        this.todos.unshift(newTodo);
        this.saveTodos();
        this.renderTodos();
        this.updateStatistics();
        this.resetInputs();
        this.showToast('Success', 'Task added successfully', 'success');
        
        // Schedule reminder notification if set
        if (remindAt) {
            const reminderTime = new Date(remindAt);
            const now = new Date();
            
            // If reminder time is in the future, show a confirmation toast
            if (reminderTime > now) {
                const timeDiff = reminderTime - now;
                const minutesDiff = Math.round(timeDiff / 60000);
                
                let timeMessage;
                if (minutesDiff < 60) {
                    timeMessage = `${minutesDiff} minute${minutesDiff !== 1 ? 's' : ''}`;
                } else {
                    const hoursDiff = Math.round(minutesDiff / 60);
                    timeMessage = `${hoursDiff} hour${hoursDiff !== 1 ? 's' : ''}`;
                }
                
                this.showToast('Reminder Set', `You'll be reminded in ${timeMessage}`, 'info');
            }
        }
    }

    toggleTodo(id) {
        const todo = this.todos.find(t => t.id === parseInt(id));
        if (todo) {
            todo.completed = !todo.completed;
            this.saveTodos();
            this.renderTodos();
            this.updateStatistics();
            
            const message = todo.completed ? 'Task completed' : 'Task marked as incomplete';
            this.showToast('Success', message, 'success');
        }
    }

    deleteTodo(id) {
        this.todos = this.todos.filter(t => t.id !== parseInt(id));
        this.saveTodos();
        this.renderTodos();
        this.updateStatistics();
        this.showToast('Success', 'Task deleted', 'success');
    }

    openEditModal(todoId) {
        const todo = this.todos.find(t => t.id === parseInt(todoId));
        if (!todo) return;
        
        this.editTextInput.value = todo.text;
        this.editPrioritySelect.value = todo.priority;
        this.editDueDateInput.value = todo.dueDate || '';
        this.editCategorySelect.value = todo.category || 'none';
        this.editImportantCheckbox.checked = todo.isImportant;
        this.editNotesTextarea.value = todo.notes || '';
        
        // Fill in advanced fields
        if (todo.remindAt) {
            const [date, time] = todo.remindAt.split('T');
            this.editReminderDateInput.value = date;
            this.editReminderTimeInput.value = time;
        } else {
            this.editReminderDateInput.value = '';
            this.editReminderTimeInput.value = '';
        }
        
        this.editRepeatOption.value = todo.recurrence || 'never';
        this.editEstimatedTimeInput.value = todo.estimatedTime || '';
        
        const createdDate = new Date(todo.createdAt).toLocaleString();
        this.createdDateSpan.textContent = createdDate;
        
        // Show completed date if applicable
        if (todo.completedAt) {
            this.completedDateSpan.textContent = new Date(todo.completedAt).toLocaleString();
            this.completedDateSpan.parentElement.classList.remove('hidden');
        } else {
            this.completedDateSpan.parentElement.classList.add('hidden');
        }
        
        this.taskModal.setAttribute('data-todo-id', todoId);
        this.taskModal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    closeEditModal() {
        this.taskModal.classList.remove('show');
        document.body.style.overflow = '';
    }

    saveEditedTask() {
        const todoId = this.taskModal.getAttribute('data-todo-id');
        const todo = this.todos.find(t => t.id === parseInt(todoId));
        
        if (!todo) return;
        
        const newText = this.editTextInput.value.trim();
        if (!newText) {
            this.showToast('Error', 'Task text cannot be empty', 'error');
            return;
        }
        
        todo.text = newText;
        todo.priority = this.editPrioritySelect.value;
        todo.dueDate = this.editDueDateInput.value || null;
        todo.category = this.editCategorySelect.value;
        todo.isImportant = this.editImportantCheckbox.checked;
        todo.notes = this.editNotesTextarea.value;
        
        // Update advanced fields
        const reminderDate = this.editReminderDateInput.value;
        const reminderTime = this.editReminderTimeInput.value;
        
        if (reminderDate && reminderTime) {
            todo.remindAt = `${reminderDate}T${reminderTime}`;
        } else {
            todo.remindAt = null;
        }
        
        todo.recurrence = this.editRepeatOption.value !== 'never' ? this.editRepeatOption.value : null;
        todo.estimatedTime = this.editEstimatedTimeInput.value ? parseInt(this.editEstimatedTimeInput.value) : null;
        
        // Mark for sync
        todo.syncStatus = 'pending';
        
        this.saveTodos();
        this.renderTodos();
        this.closeEditModal();
        this.showToast('Success', 'Task updated successfully', 'success');
    }

    filterTodos() {
        // Start with all todos
        let filtered = [...this.todos];
        
        // Apply view filters
        switch (this.currentView) {
            case 'today':
                filtered = filtered.filter(todo => todo.isDueToday());
                break;
            case 'upcoming':
                filtered = filtered.filter(todo => todo.dueDate && !todo.isDueToday() && !todo.isOverdue());
                break;
            case 'important':
                filtered = filtered.filter(todo => todo.isImportant);
                break;
            case 'completed':
                filtered = filtered.filter(todo => todo.completed);
                break;
            default:
                // 'all' - no filter
                break;
        }
        
        // Apply priority filter
        const priorityFilter = this.filterPriority.value;
        if (priorityFilter !== 'all') {
            filtered = filtered.filter(todo => todo.priority === priorityFilter);
        }
        
        // Apply category filter
        const categoryFilter = this.filterCategory.value;
        if (categoryFilter !== 'all') {
            filtered = filtered.filter(todo => todo.category === categoryFilter);
        }
        
        // Apply due date filter
        const dueFilter = this.filterDue.value;
        if (dueFilter !== 'all') {
            switch (dueFilter) {
                case 'overdue':
                    filtered = filtered.filter(todo => todo.isOverdue());
                    break;
                case 'today':
                    filtered = filtered.filter(todo => todo.isDueToday());
                    break;
                case 'upcoming':
                    filtered = filtered.filter(todo => 
                        todo.dueDate && !todo.isDueToday() && !todo.isOverdue()
                    );
                    break;
                case 'no-date':
                    filtered = filtered.filter(todo => !todo.dueDate);
                    break;
            }
        }
        
        // Apply search filter
        const searchTerm = this.searchInput.value.trim().toLowerCase();
        if (searchTerm) {
            filtered = filtered.filter(todo => 
                todo.text.toLowerCase().includes(searchTerm) ||
                (todo.notes && todo.notes.toLowerCase().includes(searchTerm))
            );
        }
        
        // Apply sorting
        const sortOption = this.sortBy.value;
        switch (sortOption) {
            case 'created-desc':
                filtered.sort((a, b) => b.createdAt - a.createdAt);
                break;
            case 'created-asc':
                filtered.sort((a, b) => a.createdAt - b.createdAt);
                break;
            case 'due-asc':
                filtered.sort((a, b) => {
                    if (!a.dueDate) return 1;
                    if (!b.dueDate) return -1;
                    return new Date(a.dueDate) - new Date(b.dueDate);
                });
                break;
            case 'due-desc':
                filtered.sort((a, b) => {
                    if (!a.dueDate) return 1;
                    if (!b.dueDate) return -1;
                    return new Date(b.dueDate) - new Date(a.dueDate);
                });
                break;
            case 'priority-desc':
                const priorityValues = { high: 3, medium: 2, low: 1 };
                filtered.sort((a, b) => priorityValues[b.priority] - priorityValues[a.priority]);
                break;
            case 'priority-asc':
                const priorityValuesAsc = { high: 3, medium: 2, low: 1 };
                filtered.sort((a, b) => priorityValuesAsc[a.priority] - priorityValuesAsc[b.priority]);
                break;
        }
        
        return filtered;
    }

    createTodoElement(todo) {
        // Determine due date class and text
        let dueDateText = 'No due date';
        let dueDateClass = '';
        
        if (todo.dueDate) {
            dueDateText = new Date(todo.dueDate).toLocaleDateString();
            if (todo.isOverdue()) {
                dueDateClass = 'overdue';
            } else if (todo.isDueToday()) {
                dueDateClass = 'due-today';
            }
        }
        
        // Create category tag if category exists
        const categoryTag = todo.category !== 'none' 
            ? `<span class="category-tag category-${todo.category}">${todo.category.charAt(0).toUpperCase() + todo.category.slice(1)}</span>` 
            : '';
        
        // Create important star if task is important
        const importantStar = todo.isImportant 
            ? `<i class="fas fa-star important-star"></i>` 
            : '';
        
        // Build the todo element HTML
        return `
            <div class="todo-item priority-${todo.priority} ${todo.completed ? 'completed' : ''}" data-id="${todo.id}">
                <div class="todo-checkbox">
                    <input type="checkbox" id="checkbox-${todo.id}" ${todo.completed ? 'checked' : ''}>
                    <label for="checkbox-${todo.id}" class="checkmark"></label>
                </div>
                
                <div class="todo-content">
                    <div class="todo-text">
                        ${importantStar}
                        ${todo.text}
                    </div>
                    <div class="todo-meta">
                        <span class="meta-item">
                            <i class="fas fa-flag" style="color: var(--priority-${todo.priority})"></i>
                            ${todo.priority.charAt(0).toUpperCase() + todo.priority.slice(1)}
                        </span>
                        
                        <span class="meta-item ${dueDateClass}">
                            <i class="fas fa-calendar-alt"></i>
                            ${dueDateText}
                        </span>
                        
                        ${categoryTag ? `
                        <span class="meta-item">
                            ${categoryTag}
                        </span>` : ''}
                    </div>
                </div>
                
                <div class="todo-actions">
                    <button class="edit-todo-btn" title="Edit Task">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="delete-todo-btn" title="Delete Task">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }

    renderTodos() {
        const filteredTodos = this.filterTodos();
        
        if (filteredTodos.length === 0) {
            this.todosContainer.innerHTML = '';
            this.emptyState.classList.remove('hidden');
        } else {
            this.emptyState.classList.add('hidden');
            this.todosContainer.innerHTML = filteredTodos.map(todo => this.createTodoElement(todo)).join('');
        }
    }

    resetInputs() {
        this.todoInput.value = '';
        this.prioritySelect.value = 'low';
        this.dueDateInput.value = '';
        this.categorySelect.value = 'none';
        this.importantCheckbox.checked = false;
        this.reminderDateInput.value = '';
        this.reminderTimeInput.value = '';
        this.repeatOption.value = 'never';
        this.estimatedTimeInput.value = '';
        this.todoInput.focus();
    }

    showToast(title, message, type = 'info') {
        const toastId = Date.now();
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close" data-toast-id="${toastId}">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        // Add event listener to close button
        toast.querySelector('.toast-close').addEventListener('click', () => {
            this.toastContainer.removeChild(toast);
        });
        
        this.toastContainer.appendChild(toast);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (toast.parentNode === this.toastContainer) {
                this.toastContainer.removeChild(toast);
            }
        }, 5000);
    }

    registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/service-worker.js')
                .then(registration => {
                    console.log('ServiceWorker registration successful with scope: ', registration.scope);
                    
                    // Listen for messages from service worker
                    navigator.serviceWorker.addEventListener('message', event => {
                        if (event.data && event.data.type === 'COMPLETE_TASK') {
                            this.toggleTodo(event.data.taskId);
                        }
                    });
                })
                .catch(error => {
                    console.error('ServiceWorker registration failed: ', error);
                });
        }
    }

    initNotifications() {
        this.notificationsEnabled = false;
        
        if ('Notification' in window) {
            if (Notification.permission === 'granted') {
                this.notificationsEnabled = true;
            } else if (Notification.permission !== 'denied') {
                Notification.requestPermission().then(permission => {
                    this.notificationsEnabled = permission === 'granted';
                });
            }
        }
    }

    async requestNotificationPermission() {
        if (!('Notification' in window)) {
            this.showToast('Error', 'This browser does not support notifications', 'error');
            return false;
        }
        
        if (Notification.permission === 'granted') {
            return true;
        }
        
        const permission = await Notification.requestPermission();
        this.notificationsEnabled = permission === 'granted';
        
        if (permission === 'granted') {
            this.showToast('Notifications Enabled', 'You will now receive notifications for your tasks', 'success');
            return true;
        } else {
            this.showToast('Notifications Disabled', 'You will not receive notifications for your tasks', 'info');
            return false;
        }
    }

    async showNotification(title, options) {
        if (!this.notificationsEnabled) {
            const granted = await this.requestNotificationPermission();
            if (!granted) return;
        }
        
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            // Use push notification if service worker is active
            navigator.serviceWorker.ready.then(registration => {
                registration.showNotification(title, options);
            });
        } else {
            // Fallback to regular notification
            new Notification(title, options);
        }
    }

    startReminderCheck() {
        // Check for reminders every minute
        setInterval(() => {
            this.checkReminders();
        }, 60000);
        
        // Also check immediately on startup
        this.checkReminders();
    }

    checkReminders() {
        this.todos.forEach(todo => {
            if (todo.shouldRemind()) {
                const options = todo.getReminderOptions();
                this.showNotification(options.title, {
                    body: options.body,
                    icon: 'icons/icon-192x192.png',
                    badge: 'icons/icon-192x192.png',
                    vibrate: [100, 50, 100],
                    data: {
                        url: options.url,
                        taskId: options.taskId
                    },
                    actions: [
                        {
                            action: 'view',
                            title: 'View Task'
                        },
                        {
                            action: 'complete',
                            title: 'Mark Complete'
                        }
                    ]
                });
                
                // Mark reminder as shown by setting to null
                todo.remindAt = null;
                this.saveTodos();
            }
        });
    }

    setupSyncManager() {
        if ('serviceWorker' in navigator && 'SyncManager' in window) {
            // Register for background sync
            navigator.serviceWorker.ready.then(registration => {
                // Register sync
                registration.sync.register('sync-todos')
                    .catch(err => console.error('Background sync registration failed:', err));
            });
        }
    }

    setupVoiceRecognition() {
        if ('webkitSpeechRecognition' in window) {
            const recognition = new webkitSpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = false;
            recognition.lang = 'en-US';
            
            this.voiceSearchBtn.addEventListener('click', () => {
                recognition.start();
                this.showToast('Listening...', 'Speak now to search or add a task', 'info');
            });
            
            recognition.onresult = (event) => {
                const speechResult = event.results[0][0].transcript;
                
                // Check if it's a command to add a task
                if (speechResult.toLowerCase().includes('add task') || 
                    speechResult.toLowerCase().includes('create task') ||
                    speechResult.toLowerCase().includes('new task')) {
                    
                    // Extract the task text by removing the command part
                    let taskText = speechResult
                        .replace(/add task|create task|new task/i, '')
                        .trim();
                    
                    if (taskText) {
                        this.todoInput.value = taskText;
                        this.addTodo();
                        this.showToast('Task Added', `New task created: "${taskText}"`, 'success');
                    }
                } else {
                    // Use as search
                    this.searchInput.value = speechResult;
                    this.renderTodos();
                    this.showToast('Search', `Searching for: "${speechResult}"`, 'info');
                }
            };
            
            recognition.onerror = (event) => {
                this.showToast('Voice Recognition Error', event.error, 'error');
            };
        } else {
            this.voiceSearchBtn.style.display = 'none';
        }
    }

    exportData() {
        const data = {
            todos: this.todos,
            version: '1.0'
        };
        
        const dataStr = JSON.stringify(data);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileName = `taskflow_backup_${new Date().toISOString().slice(0,10)}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileName);
        linkElement.click();
        
        this.showToast('Export Successful', 'Your tasks have been exported to a file', 'success');
    }

    importData(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                
                if (data && data.todos && Array.isArray(data.todos)) {
                    // Convert plain objects to Todo instances
                    this.todos = data.todos.map(todo => {
                        const newTodo = new Todo(
                            todo.id,
                            todo.text,
                            todo.completed,
                            todo.priority,
                            todo.dueDate,
                            todo.category,
                            todo.isImportant,
                            todo.notes,
                            todo.remindAt,
                            todo.subtasks || [],
                            todo.recurrence,
                            todo.tags || [],
                            todo.estimatedTime
                        );
                        
                        newTodo.createdAt = new Date(todo.createdAt);
                        if (todo.completedAt) {
                            newTodo.completedAt = new Date(todo.completedAt);
                        }
                        
                        return newTodo;
                    });
                    
                    this.saveTodos();
                    this.renderTodos();
                    this.updateStatistics();
                    
                    this.showToast('Import Successful', `${this.todos.length} tasks have been imported`, 'success');
                } else {
                    throw new Error('Invalid data format');
                }
            } catch (error) {
                this.showToast('Import Failed', 'The file format is invalid', 'error');
                console.error('Import error:', error);
            }
        };
        
        reader.readAsText(file);
    }

    renderSubtasks(todo) {
        // Clear subtasks container
        this.subtasksContainer.innerHTML = '';
        
        // Add each subtask
        todo.subtasks.forEach(subtask => {
            const subtaskElement = document.createElement('div');
            subtaskElement.className = 'subtask-item';
            subtaskElement.innerHTML = `
                <div class="subtask-checkbox">
                    <input type="checkbox" id="subtask-${subtask.id}" ${subtask.completed ? 'checked' : ''}>
                    <label for="subtask-${subtask.id}" class="checkmark"></label>
                </div>
                <div class="subtask-text">${subtask.text}</div>
                <button class="delete-subtask-btn" data-id="${subtask.id}">
                    <i class="fas fa-times"></i>
                </button>
            `;
            
            // Add event listeners
            const checkbox = subtaskElement.querySelector(`#subtask-${subtask.id}`);
            checkbox.addEventListener('change', () => {
                todo.toggleSubtask(subtask.id);
                this.saveTodos();
                
                // If this completes the parent task, update the UI
                if (todo.completed) {
                    this.renderTodos();
                    this.updateStatistics();
                }
            });
            
            const deleteBtn = subtaskElement.querySelector('.delete-subtask-btn');
            deleteBtn.addEventListener('click', () => {
                todo.deleteSubtask(subtask.id);
                this.saveTodos();
                this.renderSubtasks(todo);
            });
            
            this.subtasksContainer.appendChild(subtaskElement);
        });
        
        // Setup add subtask functionality
        this.addSubtaskBtn.addEventListener('click', () => {
            const subtaskText = this.subtaskInput.value.trim();
            if (!subtaskText) return;
            
            todo.addSubtask(subtaskText);
            this.saveTodos();
            this.renderSubtasks(todo);
            this.subtaskInput.value = '';
        });
        
        this.subtaskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const subtaskText = this.subtaskInput.value.trim();
                if (!subtaskText) return;
                
                todo.addSubtask(subtaskText);
                this.saveTodos();
                this.renderSubtasks(todo);
                this.subtaskInput.value = '';
            }
        });
    }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    new TodoApp();
}); 