// Todo Class
class Todo {
    constructor(id, text, completed = false) {
        this.id = id;
        this.text = text;
        this.completed = completed;
        this.createdAt = new Date();
    }
}

// TodoApp Class
class TodoApp {
    constructor() {
        this.todos = [];
        this.initializeElements();
        this.setupEventListeners();
        this.loadTheme();
    }

    initializeElements() {
        this.todoInput = document.getElementById('todo-input');
        this.addButton = document.getElementById('add-todo');
        this.todosContainer = document.getElementById('todos-container');
        this.themeToggle = document.getElementById('theme-toggle');
    }

    setupEventListeners() {
        this.addButton.addEventListener('click', () => this.addTodo());
        this.todoInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTodo();
        });
        this.themeToggle.addEventListener('click', () => this.toggleTheme());
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

        const todo = new Todo(Date.now(), text);
        this.todos.unshift(todo);
        this.renderTodos();
        this.resetInputs();
    }

    toggleTodo(id) {
        const todo = this.todos.find(t => t.id === parseInt(id));
        if (todo) {
            todo.completed = !todo.completed;
            this.renderTodos();
        }
    }

    deleteTodo(id) {
        this.todos = this.todos.filter(t => t.id !== parseInt(id));
        this.renderTodos();
    }

    renderTodos() {
        this.todosContainer.innerHTML = this.todos.map(todo => this.createTodoElement(todo)).join('');
    }

    createTodoElement(todo) {
        return `
            <div class="todo-item ${todo.completed ? 'completed' : ''}" id="todo-${todo.id}">
                <input type="checkbox" ${todo.completed ? 'checked' : ''}>
                <span>${todo.text}</span>
                <button class="delete-todo">❌</button>
            </div>
        `;
    }

    resetInputs() {
        this.todoInput.value = '';
        this.todoInput.focus();
    }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    new TodoApp();
}); 