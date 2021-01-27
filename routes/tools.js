const express = require('express');
const router = express.Router();
const {ensureAuthenticated } = require('../config/auth');
const mongoose = require('mongoose');
const axios = require('axios');
const User = require('../models/User');
const Todo = require('../models/Todo');

// Tools Home
router.get('/', (req, res) => {

  res.render('tools-home');

});

router.get('/dictionary', (req, res) => {
  res.render('tools-dictionary');
})
router.post('/dictionary', (req, res) => {
  const word = req.body.word;
  res.redirect(`/tools/dictionary-definition/${word}`);
})
router.get('/dictionary-definition/:word', (req, res) => {
    const word = req.params.word;

	const options = {
  method: 'GET',
  url: `https://wordsapiv1.p.rapidapi.com/words/${word}`,
  headers: {
    'x-rapidapi-key': '7e45ec5e4fmsh4f3dac417f9eaa7p179a33jsnbfe4cb2e4c79',
    'x-rapidapi-host': 'wordsapiv1.p.rapidapi.com'
  }
};

axios.request(options).then(function (response) {
    const returnedData = response.data;
	console.log(returnedData);
    res.render('tools-dictionary-word', {returnedData});
}).catch(function (error) {
	console.error(error);
});
});

router.get('/todos', async (req, res) => {
  const user = req.user.id;
  const thisUser = await User.findById(user);
  const todoLists = await Todo.find({todoOwner: {$eq: user}})
  res.render('todo-lists', {thisUser, todoLists})
})

router.post('/todos/new', (req, res) => {
  const todo = new Todo({
    todoOwner: req.body.todoOwner,
    todoName: req.body.todoName,
    todoDescription: req.body.todoDescription,
    todoDue: req.body.todoDue,
    todoColor: req.body.todoColor
  })
  todo.save()
  res.redirect('/tools/todos')
})

router.post('/todos/:todoListId/add-todo', async (req, res) => {
  const user = req.user.id;
  const todoListId = req.params.todoListId;

  await Todo.findByIdAndUpdate(todoListId, 
    {$addToSet: {todos: {todoName: req.body.todoName, todoPriority: req.body.todoPriority, complete: false}}}
    );
  res.redirect('/tools/todos')
})
module.exports = router;