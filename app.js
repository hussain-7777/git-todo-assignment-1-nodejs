const express = require('express')
const app = express()
app.use(express.json())
const path = require('path')
const dbPath = path.join(__dirname, 'todoApplication.db')
const sqlite3 = require('sqlite3')
const {open} = require('sqlite')
const {format} = require('date-fns')
const {isValid} = require('date-fns')

let db = null
const initDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}
initDBAndServer()

const isValidPriority = priority =>
  priority === 'HIGH' || priority === 'MEDIUM' || priority === 'LOW'
    ? true
    : false

const isValidStatus = status =>
  status === 'TO DO' || status === 'IN PROGRESS' || status === 'DONE'
    ? true
    : false

const isValidCategory = category =>
  category === 'WORK' || category === 'HOME' || category === 'LEARNING'
    ? true
    : false

const isValidDueDate = date => isValid(new Date(date))
const formattedDate = date => format(new Date(date), 'yyyy-MM-dd')

const convertDueDate = todo => {
  return {
    id: todo.id,
    todo: todo.todo,
    priority: todo.priority,
    status: todo.status,
    category: todo.category,
    dueDate: todo.due_date,
  }
}

// API 1
app.get('/todos/', async (request, response) => {
  const {status, category, priority, search_q = ''} = request.query
  let getTodosQuery = null
  let data = null

  switch (true) {
    case status !== undefined:
      getTodosQuery = `select * from todo where status = '${status}';`
      if (isValidStatus(status)) {
        data = await db.all(getTodosQuery)
        response.send(data.map(todo => convertDueDate(todo)))
      } else {
        response.status(400)
        response.send('Invalid Todo Status')
      }
      break
    case priority !== undefined:
      getTodosQuery = `select * from todo where priority = '${priority}';`
      if (isValidPriority(priority)) {
        data = await db.all(getTodosQuery)
        response.send(data.map(todo => convertDueDate(todo)))
      } else {
        response.status(400)
        response.send('Invalid Todo Priority')
      }
      break
    case category !== undefined:
      console.log(category)
      getTodosQuery = `select * from todo where category = '${category}';`
      if (isValidCategory(category)) {
        data = await db.all(getTodosQuery)
        response.send(data.map(todo => convertDueDate(todo)))
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
      break
    case priority !== undefined && status !== undefined:
      getTodosQuery = `select * from todo where priority = '${category}', 
      status = '${status}';`
      if (isValidPriority(priority) && isValidStatus(status)) {
        data = await db.all(getTodosQuery)
        response.send(data.map(todo => convertDueDate(todo)))
      } else if (isValidPriority(priority)) {
        response.status(400)
        response.send('Invalid Todo Status')
      } else {
        response.status(400)
        response.send('Invalid Todo Priority')
      }
      break
    case category !== undefined && status !== undefined:
      getTodosQuery = `select * from todo where category = '${category}';`
      if (isValidCategory(category) && isValidStatus(status)) {
        data = await db.all(getTodosQuery)
        response.send(data.map(todo => convertDueDate(todo)))
      } else if (isValidCategory(category)) {
        response.status(400)
        response.send('Invalid Todo Status')
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
      break
    case category !== undefined && priority !== undefined:
      getTodosQuery = `select * from todo where category = '${category}', 
      priority = '${priority}';`
      if (isValidCategory(category) && isValidPriority(priority)) {
        data = await db.all(getTodosQuery)
        response.send(data.map(todo => convertDueDate(todo)))
      } else if (isValidCategory(category)) {
        response.status(400)
        response.send('Invalid Todo Priority')
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
      break
    default:
      getTodosQuery = `select * from todo where todo like '%${search_q}%';`
      data = await db.all(getTodosQuery)
      response.send(data.map(todo => convertDueDate(todo)))
      break
  }
})

// API 2
app.get('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const getTodoQuery = `select * from todo where id = ${todoId};`
  const data = await db.get(getTodoQuery)
  response.send(convertDueDate(data))
})

// API 3
app.get('/agenda/', async (request, response) => {
  const {date} = request.query

  if (date === undefined) {
    response.status(400)
    response.send('Invalid Due Date')
    console.log('invalid1')
  } else {
    if (isValidDueDate(date)) {
      const formatDate = formattedDate(date)
      const getTodosQuery = `select * from todo where due_date = '${formatDate}';`
      const todos = await db.all(getTodosQuery)
      response.send(todos.map(todo => convertDueDate(todo)))
      console.log(date)
      console.log(formatDate)
    } else {
      response.status(400)
      response.send('Invalid Due Date')
      console.log('invalid2')
    }
  }
})

// API 4
app.post('/todos/', async (request, response) => {
  const {id, todo, category, priority, status, dueDate} = request.body

  switch (false) {
    case isValidCategory(category):
      response.status(400)
      response.send('Invalid Todo Category')
      break
    case isValidPriority(priority):
      response.status(400)
      response.send('Invalid Todo Priority')
      break
    case isValidStatus(status):
      response.status(400)
      response.send('Invalid Todo Status')
      break
    case isValidDueDate(dueDate):
      response.status(400)
      response.send('Invalid Due Date')
      break
    default:
      const formatDate = formattedDate(dueDate)
      const createTodoQuery = `insert into todo (id, todo, category, priority, 
      status, due_date) values ('${id}', '${todo}', '${category}', '${priority}', 
  '${status}', '${formatDate}');`
      const newTodo = await db.run(createTodoQuery)
      response.send('Todo Successfully Added')
      break
  }
})

// API 5
app.put('/todos/:todoId', async (request, response) => {
  const {todoId} = request.params
  const {todo, category, priority, status, dueDate} = request.body
  let updateTodoQuery = null
  let data = null

  switch (true) {
    case category !== undefined:
      updateTodoQuery = `update todo set category = '${category}' 
    where id = ${todoId};`
      if (isValidCategory(category)) {
        data = await db.run(updateTodoQuery)
        console.log(data)
        response.send('Category Updated')
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
      break
    case priority !== undefined:
      updateTodoQuery = `update todo set priority = '${priority}' 
    where id = ${todoId};`
      if (isValidPriority(priority)) {
        data = await db.run(updateTodoQuery)
        console.log(data)
        response.send('Priority Updated')
      } else {
        response.status(400)
        response.send('Invalid Todo Priority')
      }
      break
    case status !== undefined:
      updateTodoQuery = `update todo set status = '${status}' 
    where id = ${todoId};`
      if (isValidStatus(status)) {
        data = await db.run(updateTodoQuery)
        response.send('Status Updated')
      } else {
        response.status(400)
        response.send('Invalid Todo Status')
      }
      break
    case dueDate !== undefined:
      if (isValidDueDate(dueDate)) {
        console.log(dueDate)
        const formatDueDate = formattedDate(dueDate)
        updateTodoQuery = `update todo set due_date = '${formatDueDate}' 
    where id = ${todoId};`
        data = await db.run(updateTodoQuery)
        response.send('Due Date Updated')
      } else {
        response.status(400)
        response.send('Invalid Due Date')
      }
      break
    default:
      updateTodoQuery = `update todo set todo = '${todo}' 
    where id = ${todoId};`
      data = await db.run(updateTodoQuery)
      console.log(data)
      response.send('Todo Updated')
      break
  }
})

// API 6
app.delete('/todos/:todoId', async (request, response) => {
  const {todoId} = request.params

  const deleteTodoQuery = `delete from todo where id = ${todoId};`
  await db.run(deleteTodoQuery)
  response.send('Todo Deleted')
})

module.exports = app
