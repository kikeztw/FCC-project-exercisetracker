require('dotenv').config()
const express = require('express')
const app = express()
const cors = require('cors')
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const Schema = mongoose.Schema;


mongoose.connect(process.env.DATA_BASE_URL, { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));

const userSchema = new Schema({
  username: { type: String, required: true }
});

const exercisesSchema = new Schema({
  _id : { type : String, required : true },
  username: { type: String, required: true },
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: { type: Date },
});

exercisesSchema.virtual('id').get(function() {
  return this._id;
});


const User = mongoose.model('User', userSchema);
const Exercises = mongoose.model('Exercises', exercisesSchema);

app.use(bodyParser.urlencoded({ extended: "false" }));
app.use(bodyParser.json());
app.use(cors());
app.use(express.static('public'))

// routes 
app.post('/api/users', async (req, res) => {
  const { username  } = req.body;
  const  newUser = new User({ username });
  try{
    const response = await  newUser.save();
    res.json({
      _id: response._id,
      username
    });
  }catch(error){
    return res.json({
      error: JSON.stringify(error),
    })
  }
})

app.get('/api/users', async (req, res) => {
  try {
    const response = await User.find();
    console.log(response);
    res.json(response);
  } catch (error) {
    res.json({
      error: JSON.stringify(error),
    })
  }
})  

app.post('/api/users/:_id/exercises', async (req, res) => {
  const { _id } = req.params;
  const { description, duration, date } = req.body;
  const _date = date || new Date().toDateString();

  const newExercises = new Exercises({
    _id,
    description,
    duration,
    date: _date,
    username: 'test'
  })

  try {
    const response = await newExercises.save();
    console.log(response);
    res.json(response);
  } catch (error) {
    res.json({
      error: JSON.stringify(error),
    })
  }
})  


app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
