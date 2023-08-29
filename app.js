// Todo Class
class Todo {
    constructor(id, text, completed = false, priority = 'low', dueDate = null) {
        this.id = id;
        this.text = text;
        this.completed = completed;
        this.priority = priority;
        this.dueDate = dueDate;
        this.createdAt = new Date();
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
}

// TodoApp Class
class TodoApp {
    constructor() {
        this.todos = this.loadTodos();
        this.initializeElements();
        this.setupEventListeners();
        this.loadTheme();
        this.setMinDueDate();
        this.renderTodos();
        this.updateStatistics();
    }

    initializeElements() {
        this.todoInput = document.getElementById('todo-input');
        this.addButton = document.getElementById('add-todo');
        this.todosContainer = document.getElementById('todos-container');
        this.themeToggle = document.getElementById('theme-toggle');
        this.prioritySelect = document.getElementById('priority');
        this.filterPriority = document.getElementById('filter-priority');
        this.filterDue = document.getElementById('filter-due');
        this.dueDateInput = document.getElementById('due-date');
        this.totalTasksElement = document.getElementById('total-tasks');
        this.completedTasksElement = document.getElementById('completed-tasks');
        this.pendingTasksElement = document.getElementById('pending-tasks');
    }

    setupEventListeners() {
        this.addButton.addEventListener('click', () => this.addTodo());
        this.todoInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTodo();
        });
        this.themeToggle.addEventListener('click', () => this.toggleTheme());
        this.filterPriority.addEventListener('change', () => this.renderTodos());
        this.filterDue.addEventListener('change', () => this.renderTodos());
        
        this.todosContainer.addEventListener('click', (e) => {
            const todoItem = e.target.closest('.todo-item');
            if (!todoItem) return;

            if (e.target.type === 'checkbox') {
                this.toggleTodo(todoItem.id.replace('todo-', ''));
            }
            if (e.target.classList.contains('delete-todo')) {
                this.deleteTodo(todoItem.id.replace('todo-', ''));
            }
        });
    }

    setMinDueDate() {
        const today = new Date().toISOString().split('T')[0];
        this.dueDateInput.min = today;
    }

    updateStatistics() {
        const total = this.todos.length;
        const completed = this.todos.filter(todo => todo.completed).length;
        const pending = total - completed;

        this.totalTasksElement.textContent = total;
        this.completedTasksElement.textContent = completed;
        this.pendingTasksElement.textContent = pending;
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
                    todo.dueDate
                );
                newTodo.createdAt = new Date(todo.createdAt);
                return newTodo;
            });
        }
        return [];
    }

    addTodo() {
        const text = this.todoInput.value.trim();
        if (!text) return;

        const todo = new Todo(
            Date.now(),
            text,
            false,
            this.prioritySelect.value,
            this.dueDateInput.value || null
        );

        this.todos.unshift(todo);
        this.saveTodos();
        this.renderTodos();
        this.updateStatistics();
        this.resetInputs();
    }

    toggleTodo(id) {
        const todo = this.todos.find(t => t.id === parseInt(id));
        if (todo) {
            todo.completed = !todo.completed;
            this.saveTodos();
            this.renderTodos();
            this.updateStatistics();
        }
    }

    deleteTodo(id) {
        this.todos = this.todos.filter(t => t.id !== parseInt(id));
        this.saveTodos();
        this.renderTodos();
        this.updateStatistics();
    }

    filterTodos() {
        let filtered = [...this.todos];
        const priorityFilter = this.filterPriority.value;
        const dueFilter = this.filterDue.value;

        if (priorityFilter !== 'all') {
            filtered = filtered.filter(todo => todo.priority === priorityFilter);
        }

        if (dueFilter !== 'all') {
            const today = new Date().setHours(0, 0, 0, 0);
            filtered = filtered.filter(todo => {
                switch (dueFilter) {
                    case 'overdue':
                        return todo.isOverdue();
                    case 'today':
                        return todo.isDueToday();
                    case 'upcoming':
                        return todo.dueDate && new Date(todo.dueDate) > today;
                    default:
                        return true;
                }
            });
        }

        return filtered;
    }

    createTodoElement(todo) {
        const dueDate = todo.dueDate ? new Date(todo.dueDate).toLocaleDateString() : 'No due date';
        const dueDateClass = todo.isOverdue() ? 'overdue' : todo.isDueToday() ? 'due-today' : '';
        
        return `
            <div class="todo-item priority-${todo.priority} ${todo.completed ? 'completed' : ''}" id="todo-${todo.id}">
                <input type="checkbox" ${todo.completed ? 'checked' : ''}>
                <div class="todo-content">
                    <div class="todo-text">${todo.text}</div>
                    <div class="todo-meta">
                        <span>Priority: ${todo.priority.charAt(0).toUpperCase() + todo.priority.slice(1)}</span>
                        <span class="${dueDateClass}">Due: ${dueDate}</span>
                    </div>
                </div>
                <button class="delete-todo">❌</button>
            </div>
        `;
    }

    resetInputs() {
        this.todoInput.value = '';
        this.prioritySelect.value = 'low';
        this.dueDateInput.value = '';
        this.todoInput.focus();
    }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    new TodoApp();
}); 