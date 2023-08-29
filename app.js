// Todo Class
class Todo {
    constructor(id, text, completed = false, priority = 'low') {
        this.id = id;
        this.text = text;
        this.completed = completed;
        this.priority = priority;
        this.createdAt = new Date();
    }
}

// TodoApp Class
class TodoApp {
    constructor() {
        this.todos = this.loadTodos();
        this.initializeElements();
        this.setupEventListeners();
        this.loadTheme();
        this.renderTodos();
    }

    initializeElements() {
        this.todoInput = document.getElementById('todo-input');
        this.addButton = document.getElementById('add-todo');
        this.todosContainer = document.getElementById('todos-container');
        this.themeToggle = document.getElementById('theme-toggle');
        this.prioritySelect = document.getElementById('priority');
        this.filterPriority = document.getElementById('filter-priority');
    }

    setupEventListeners() {
        this.addButton.addEventListener('click', () => this.addTodo());
        this.todoInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTodo();
        });
        this.themeToggle.addEventListener('click', () => this.toggleTheme());
        this.filterPriority.addEventListener('change', () => this.renderTodos());
        
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

    loadTodos() {
        const savedTodos = localStorage.getItem('todos');
        if (savedTodos) {
            const todos = JSON.parse(savedTodos);
            return todos.map(todo => {
                const newTodo = new Todo(todo.id, todo.text, todo.completed, todo.priority);
                newTodo.createdAt = new Date(todo.createdAt);
                return newTodo;
            });
        }
        return [];
    }

    saveTodos() {
        localStorage.setItem('todos', JSON.stringify(this.todos));
    }

    loadTheme() {
        const theme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', theme);
        this.themeToggle.textContent = theme === 'light' ? '🌙' : '☀️';
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        this.themeToggle.textContent = newTheme === 'light' ? '🌙' : '☀️';
    }

    addTodo() {
        const text = this.todoInput.value.trim();
        if (!text) return;

        const todo = new Todo(
            Date.now(),
            text,
            false,
            this.prioritySelect.value
        );

        this.todos.unshift(todo);
        this.saveTodos();
        this.renderTodos();
        this.resetInputs();
    }

    toggleTodo(id) {
        const todo = this.todos.find(t => t.id === parseInt(id));
        if (todo) {
            todo.completed = !todo.completed;
            this.saveTodos();
            this.renderTodos();
        }
    }

    deleteTodo(id) {
        this.todos = this.todos.filter(t => t.id !== parseInt(id));
        this.saveTodos();
        this.renderTodos();
    }

    filterTodos() {
        let filtered = [...this.todos];
        const priorityFilter = this.filterPriority.value;

        if (priorityFilter !== 'all') {
            filtered = filtered.filter(todo => todo.priority === priorityFilter);
        }

        return filtered;
    }

    renderTodos() {
        const filtered = this.filterTodos();
        this.todosContainer.innerHTML = filtered.map(todo => this.createTodoElement(todo)).join('');
    }

    createTodoElement(todo) {
        return `
            <div class="todo-item priority-${todo.priority} ${todo.completed ? 'completed' : ''}" id="todo-${todo.id}">
                <input type="checkbox" ${todo.completed ? 'checked' : ''}>
                <div class="todo-content">
                    <div class="todo-text">${todo.text}</div>
                    <div class="todo-meta">
                        Priority: ${todo.priority.charAt(0).toUpperCase() + todo.priority.slice(1)}
                    </div>
                </div>
                <button class="delete-todo">❌</button>
            </div>
        `;
    }

    resetInputs() {
        this.todoInput.value = '';
        this.prioritySelect.value = 'low';
        this.todoInput.focus();
    }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    new TodoApp();
}); 