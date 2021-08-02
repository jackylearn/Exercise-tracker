const express = require('express')
const app = express()
const cors = require('cors')
const bodyParser = require('body-parser')
require('dotenv').config()

app.use(cors())
app.use(express.static('public'))
app.use(bodyParser.urlencoded({ extended: false }))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

// Create Username and get id
const User = require('./db.js').User
const createNewUser = require('./db.js').createNewUser
app.post('/api/users', (req, res) => {
  let newUser = req.body['username']

  User.findOne({username: newUser})
      .exec((err, doc) => {
        if (err) return console.log(err)
        if (doc) {
          res.send('Username already taken')
          return
        }
        createNewUser(newUser, (err, doc) => {
            res.json({username: doc['username'], _id: doc['_id']})
          })
      })
 
})


// Add exercise logs
const addNewLogs = require('./db.js').addNewLogs
app.post('/api/users/:_id/exercises', (req, res) => {
  let _id = req.params._id /*|| req.body[':_id']*/
  let description = req.body['description']
  let duration = parseInt(req.body['duration']) || null
  let date = req.body['date'] || new Date()

  console.log(`New post request from ${_id}: 
        description: ${description},
        duration: ${duration},
        date: ${date}`)

  addNewLogs(_id, description, duration, date, (err, doc) => {

    if (!doc) {
      if (!err) {
        res.send('Unknown userid')
        return
      }
      res.send(err.message)
      return
    }

    if (err) {
      let errKeys = Object.keys(err.errors)
      let firstErrorMessage = err.errors[errKeys[0]].message
      res.send(firstErrorMessage)
      return
    }

    let latestLog = doc.logs[doc.logs.length - 1]
    let response = {
      _id: doc['_id'],
      username: doc['username'],
      date: latestLog['date'].toDateString(),
      duration: latestLog['duration'],
      description: latestLog['description']
    }

    res.json(response)
  })

})


// check logs
const checkLogs = require('./db.js').checkLogs
app.get('/api/users/:_id/logs', (req, res) => {
  let fromDate = !!Date.parse(req.query['from']) ? new Date(req.query['from']) : null
  let toDate = !!Date.parse(req.query['to']) ? new Date(req.query['to']) : null
  let limit = parseInt(req.query['limit'])
  let _id = req.params['_id']
  

  checkLogs(_id, fromDate, toDate, limit, (response) => {
    res.json(response)
  })

})

// get all userdata
app.get('/api/users', (req, res) => {
  User.find({}, (err, doc) => {
    let response = doc.map(user => {
      return {
        _id: user['_id'],
        username: user['username']
      }
    })

    res.send(response)
  })
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
