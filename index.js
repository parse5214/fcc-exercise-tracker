const express = require('express')
const app = express()
const cors = require('cors')
const mongoose = require('mongoose')
const { Schema } = require('mongoose')

require('dotenv').config()

// Middleware

app.use(express.json())
app.use(express.urlencoded({extended: false}))
app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

// Config

mongoose.connect(`${process.env.DB_URI}`)

// Schemas

const userSchema = new Schema({
  username: String
})

const exerciseSchema = new Schema({
  userId: String,
  description: String,
  duration: Number,
  date: Date
})

// Models

const UserModel = mongoose.model('UserModel', userSchema)
const ExerciseModel = mongoose.model('ExerciseModel', exerciseSchema)

// Api Endpoints

// #1

app.post('/api/users', (req, res) => {
  const newUser = new UserModel({
    username: req.body.username
  })
  newUser.save((err, data) => {
    if(err) console.log(err, " <= err")
    else {
      res.json({
        username: data.username,
        _id: data.id
      })
    }
  })
})

// #2

app.get('/api/users', (req,res) => {
  UserModel.find({}, (err, data) => {
    if(err) console.log(err, " <= err")
    else {
      res.json(data)
    }
  })
})

// #3

app.post('/api/users/:_id/exercises', (req, res) => {
  let { description, duration, date} = req.body

  date = new Date(date)

  if(!(date instanceof Date && !isNaN(date))) date = new Date()
  
  const newExercise = new ExerciseModel({
    userId: req.params._id,
    description,
    duration,
    date: date.toDateString()
  })
  
  newExercise.save((err, exerciseData) => {
    if(err) console.log(err, " <= err")
    else {
      UserModel.findById(exerciseData.userId, (err, userData) => {
        if(err) console.log(err, " <= err")
        else if(!userData) console.log("No user")
        else {
          res.json({
            username: userData.username,
            description: exerciseData.description,
            duration: exerciseData.duration,
            date: exerciseData.date.toDateString(),
            _id: userData.id
          })
        }
      })
    }
  })
})

// #4

app.get('/api/users/:_id/logs', (req, res) => {
  let { from, to, limit} = req.query
  let id = req.params._id
  UserModel.findById(id, (err, userData) => {
    if(err) console.log(err, " <= err");
    else if(!userData) console.log("No user")
    else {
      let filter = {
        userId: id
      }
      let dateFilter = {}
      
      if(from) dateFilter["$gte"] = new Date(from)
      if(to) dateFilter["$lte"] = new Date(to)

      if(from || to) filter.date = dateFilter

      if(limit) {
        ExerciseModel.find(filter).limit(limit).exec((err, exerciseData) => {
          if(err) console.log(err, " <= err")
          else {
            let count = exerciseData.length
            let {username, _id} = userData
            let log = exerciseData.map((data) => {
              return {
                description: data.description,
                duration: data.duration,
                date: data.date.toDateString()
              }
            })
            res.json({
              username,
              count,
              _id,
              log
            })
          }
        })
      } else {
        ExerciseModel.find(filter).exec((err, exerciseData) => {
          if(err) console.log(err, " <= err")
          else {
            let count = exerciseData.length
            let {username, _id} = userData
            let log = exerciseData.map((data) => {
              return {
                description: data.description,
                duration: data.duration,
                date: data.date.toDateString()
              }
            })
            res.json({
              username,
              count,
              _id,
              log
            })
          }
        })
      }
    }
  })
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})

