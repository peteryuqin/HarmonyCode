


// Session 2: Express middleware setup
const express = require('express');
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session 1: Adding API logic
const todoAPI = {
    todos: [],
    
    create(todo) {
        const newTodo = {
            id: Date.now(),
            text: todo.text,
            completed: false,
            createdAt: new Date()
        };
        this.todos.push(newTodo);
        return newTodo;
    },
    
    getAll() {
        return this.todos;
    },
    
    update(id, updates) {
        const todo = this.todos.find(t => t.id === id);
        if (todo) {
            Object.assign(todo, updates);
            return todo;
        }
        return null;
    },
    
    delete(id) {
        const index = this.todos.findIndex(t => t.id === id);
        if (index !== -1) {
            return this.todos.splice(index, 1)[0];
        }
        return null;
    }
};

// Session 3: Adding Database Layer
class TodoDatabase {
    constructor() {
        this.todos = new Map();
        this.nextId = 1;
    }
    
    addTodo(todoData) {
        const todo = {
            id: this.nextId++,
            text: todoData.text,
            completed: todoData.completed || false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        this.todos.set(todo.id, todo);
        return todo;
    }
    
    getAllTodos() {
        return Array.from(this.todos.values());
    }
    
    getTodoById(id) {
        return this.todos.get(parseInt(id));
    }
    
    updateTodo(id, updates) {
        const todo = this.todos.get(parseInt(id));
        if (todo) {
            Object.assign(todo, updates, {
                updatedAt: new Date().toISOString()
            });
            return todo;
        }
        return null;
    }
    
    deleteTodo(id) {
        const todo = this.todos.get(parseInt(id));
        if (todo) {
            this.todos.delete(parseInt(id));
            return todo;
        }
        return null;
    }
}

const db = new TodoDatabase();

// Session 2: Express Routes
// POST /todos
app.post('/todos', (req, res) => {
    const todo = db.addTodo(req.body);
    res.status(201).json(todo);
});

// GET /todos
app.get('/todos', (req, res) => {
    res.json(db.getAllTodos());
});

// GET /todos/:id
app.get('/todos/:id', (req, res) => {
    const todo = db.getTodoById(req.params.id);
    if (todo) {
        res.json(todo);
    } else {
        res.status(404).json({ error: 'Todo not found' });
    }
});

// PUT /todos/:id
app.put('/todos/:id', (req, res) => {
    const todo = db.updateTodo(req.params.id, req.body);
    if (todo) {
        res.json(todo);
    } else {
        res.status(404).json({ error: 'Todo not found' });
    }
});

// DELETE /todos/:id
app.delete('/todos/:id', (req, res) => {
    const todo = db.deleteTodo(req.params.id);
    if (todo) {
        res.json(todo);
    } else {
        res.status(404).json({ error: 'Todo not found' });
    }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Todo API server running on port ${PORT}`);
    console.log('Built collaboratively by Session 1, Session 2, and Session 3!');
});
