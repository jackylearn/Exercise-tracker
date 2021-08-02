const mongoose = require("mongoose")
mongoose.connect(process.env.DB_URI, {useNewUrlParser: true, useUnifiedTopology: true})
mongoose.set('useFindAndModify', false)

const db = mongoose.connection
db.on('error', console.error.bind(console, 'connection error: '))
db.once('open', () => {console.log('db is connected')})

const userSchema = mongoose.Schema({
  username: {
    type: String,
    required: true
  },
  logs: [{
    description: {
      type: String,
      required: true
    },
    duration: {
      type: Number,
      required: true
    },
    date: {
      type: Date,
      default: Date.now
    }
  }]
})

const User = mongoose.model('User', userSchema)

// Create
const createUserAndSave = (username, done) => {
  let newUser = new User({username: username})

  newUser.save((err, doc) => {
    if (err) return console.log(err)
    console.log('New user is added in db: ' + doc['username'])
    done(null, doc)
  })
}
// Read
const checkLogs = (_id, fromDate, toDate, limit, done) => {
  let query = User.findById(_id)

  query.exec((err, doc) => {
        if (err) return console.log(err)
        let logs = doc['logs'].sort((log1, log2)=> log2.date - log1.date)
        if (fromDate) logs = logs.filter(log => log.date >= fromDate)
        if (toDate) logs = logs.filter(log => log.date <= toDate)
        if (limit) logs = logs.slice(0, limit)

        let response = {
          _id: doc['id'],
          username: doc['username'],
          count: logs.length,
          log: logs
        }

        if (fromDate) response.from = fromDate.toDateString()
        if (toDate) response.to = toDate.toDateString()

        done(response)
      })
}

// find and update
const addNewLogs = (_id, description, duration, date, done) => {
  User.findById(_id)
      .exec((err, doc) => {
        if (err || !doc) return done(err, null)
        
        doc.logs.push({
          description: description,
          duration:  duration,
          date: date
        })

        doc.save((err, doc) => {
          if (!err) console.log(`New exercise log for ${doc['username']} is updated in db.`)
          done(err, doc)
        })
      })
}

exports.User = User
exports.createNewUser = createUserAndSave
exports.addNewLogs = addNewLogs
exports.checkLogs = checkLogs