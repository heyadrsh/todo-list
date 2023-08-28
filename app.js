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
    }

    initializeElements() {
        this.todoInput = document.getElementById('todo-input');
        this.addButton = document.getElementById('add-todo');
        this.todosContainer = document.getElementById('todos-container');
    }

    setupEventListeners() {
        this.addButton.addEventListener('click', () => this.addTodo());
        this.todoInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTodo();
        });
    }

    addTodo() {
        const text = this.todoInput.value.trim();
        if (!text) return;

        const todo = new Todo(Date.now(), text);
        this.todos.unshift(todo);
        this.renderTodos();
        this.resetInputs();
    }

    renderTodos() {
        this.todosContainer.innerHTML = this.todos.map(todo => this.createTodoElement(todo)).join('');
    }

    createTodoElement(todo) {
        return `
            <div class="todo-item" id="todo-${todo.id}">
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