const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

function checksExistsUserAccount(request, response, next) {
  const { username } = request.headers;

  const user = users.find( (user) => user.username === username );

  if(!user) return response.json({ error: 'Usuário não encontrado!' }).send();

  request.user = user;

  return next();
}

function checkUsernameAvailable(request, response, next) {
  const { username } = request.body;

  const user = users.find( (user) => user.username === username );

  if(user) return response.status(400).json({ error: 'Username não disponível!' }).send();

  return next();
}

function checkExistsTodo(request, response, next) {
  const { id } = request.params;
  const { user } = request;

  const todo = user.todos.find( (todo) => todo.id === id );

  if( !todo ) return response.status(404).json({ error: 'Erro! Todo não encontrado.' }).send();

  request.id = id;

  return next();
}

// Create new user
app.post('/users', checkUsernameAvailable, (request, response) => {
  const { name, username } = request.body;

  users.push({
    id: uuidv4(),
    name,
    username,
    todos: []
  });

  const user = users.find( (user) => user.username === username );

  return response.status(201).json(user).send();
});

// List all Todo's
app.get('/todos', checksExistsUserAccount, (request, response) => {
  const { user } = request;

  const todos = user.todos;

  return response.status(200).json({ todos: todos }).send();
});

// Create a Todo
app.post('/todos', checksExistsUserAccount, (request, response) => {
  const { user } = request;
  const { title, deadline } = request.body;
  
  user.todos.push({
    id: uuidv4(),
    title,
    done: false,
    deadline: new Date(deadline),
    created_at: new Date()
  });

  const todo = user.todos.find( (todo) => todo.title === title );

  return response.status(201).json({ todo: todo }).send();
});

// Update a Todo
app.put('/todos/:id', checksExistsUserAccount, checkExistsTodo, (request, response) => {
  const { user, id } = request;
  const { title, deadline } = request.body;  

  user.todos.map( (todo) => {
    if( todo.id === id) {
      todo.title = title;
      todo.deadline = new Date(deadline);
    }
  });

  const todo = user.todos.find( (todo) => todo.id === id );

  return response.status(200).json({ todo: todo  }).send();
});

// Flag Todo as done
app.patch('/todos/:id/done', checksExistsUserAccount, checkExistsTodo, (request, response) => {
  const { user, id } = request;

  user.todos.map( (todo) => { if( todo.id === id ) todo.done = true; } );

  const todo = user.todos.find( (todo) => todo.id === id );

  return response.status(200).json({ todo: todo }).send();
});

// Delete a Todo
app.delete('/todos/:id', checksExistsUserAccount, checkExistsTodo, (request, response) => {
  const { user, id } = request;

  const todo = user.todos.findIndex( (todo) => todo.id === id );

  user.todos.splice(todo, 1);

  return response.status(204).send();
});

module.exports = app;