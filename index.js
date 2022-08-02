const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()

const bodyParser = require("body-parser");
const crypto = require("crypto");

const users = [
  {"username":"32183882","_id":"31b50bd4d7732189b7680209e9b80ac9"}
]
const exercises = [
  {"username":"32183882","description":"prueba 1","duration":1,"date":"Sat Jul 30 2022","_id":"31b50bd4d7732189b7680209e9b80ac9"},
  {"username":"32183882","description":"prueba 2","duration":2,"date":"Fri Jul 29 2022","_id":"31b50bd4d7732189b7680209e9b80ac9"}
]
const logs = []

app.use(bodyParser.urlencoded({ extended: "false" }));
app.use(bodyParser.json());

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post('/api/users', (req, res) => {
  console.log('POST /api/users')
  const {username} = req.body
  
  if(!username) 
    throw new Error('ValidationError: Users validation failed: username: Path `username` is required.')
  
  const _id = crypto.randomBytes(16).toString("hex");

  const newUser = {
    username,
    _id
  }
  
  users.unshift(newUser)

  console.log(newUser)
  res.send(newUser)
})

app.post('/api/users/:_id/exercises', (req, res) => {
  console.log('POST /api/users/:_id/exercises')
  const params = req.params
  const body = req.body
  //console.log(body)
  
  const user = users.find(user => user["_id"] === params["_id"])

  if (!user)
    throw new Error(`CastError: Cast to ObjectId failed for value ${params["_id"]} (type string) at path "_id" for model "Users"`)    

  const duration = parseInt(body.duration)

  let date = new Date()
  if (body.date) 
    date = new Date(body.date)
  
  const newExercise = {
    username: user.username,
    description: body.description,
    duration: duration,
    date: date.toDateString(),
    _id: params["_id"]
  }

  exercises.unshift(newExercise)
  
  console.log(newExercise)
  res.send(newExercise)
})

app.get('/api/users', (req, res) => {
  console.log('GET /api/users')
  res.send(users)
})

app.get('/api/users/:_id/logs', (req, res) => {
  console.log('GET /api/users/:_id/logs')
  const {_id} = req.params
  const {from, to, limit} = req.query
  const fromDate = from ? new Date(from) : undefined
  const toDate = to ? new Date(to) : undefined
  //console.log("query: ",Object.keys(req.query).length === 0)
  console.log("query: ",req.query)
  
  const user = users.find(user => user["_id"] === _id)

  if (!user)
    throw new Error(`CastError: Cast to ObjectId failed for value  ${user["_id"]} (type string) at path "_id" for model "Users"`)  
  
  const userExercises = exercises.filter(e => e["_id"] === _id)

  let fromTo = []
  let cont = 0
  // !fromDate && !toDate && !limit
  if (Object.keys(req.query).length === 0) {
    console.log('SIN QUERY')
    userExercises.map(e => {
      fromTo.push(e)
    })
  } else {
    console.log('CON QUERY')
    userExercises.map(e => {
      const date = new Date(e.date)
      // limite
      if (limit) {
        console.log('CON LIMIT')
        if (cont < limit) {
          // fecha y limite
          if (fromDate && toDate) {
            console.log('CON FROM || TO: ', fromDate, toDate)
            if (date.valueOf() >= fromDate && date.valueOf() <= toDate.valueOf()) {
              fromTo.push(e)
              ++cont
            }          
          } else {
            console.log('SOLO LIMIT')
            // solo limite
            fromTo.push(e)
            ++cont
          }          
        }
      } else {
        console.log('SIN LIMIT')
        // sin limite, solo fecha
        if (fromDate || toDate) {
          console.log('SIN LIMIT, CON FECHA')
          
          if (date.valueOf() >= fromDate && date.valueOf() <= toDate.valueOf()) {
            fromTo.push(e)
          }          
        } else {
          console.log('SIN LIMIT, SIN FECHA')
          // sin limite, sin fecha
          fromTo.push(e)
        }
      }
    })
  }

  console.log("fromTo: ", fromTo)

  const logs = {
    username: user.username,
    count: fromTo.length,
    _id: user["_id"],
    log: fromTo.map(e => {
      let obj = {}
      obj.description = e.description
      obj.duration = e.duration
      obj.date = e.date
      return obj
    })
  }
  console.log("logs: ", logs)
  
  res.send(logs)
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
