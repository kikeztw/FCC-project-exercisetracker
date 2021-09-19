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
  username: { type: String, required: true },
  logs: [{ type: Schema.Types.ObjectId, ref: 'Exercises' }],
});

const exercisesSchema = new Schema({
  user: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: { type: Date },
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
  const _date = new Date(date).toDateString();

  if(!_id){
   throw new Error('user id no found.');
  }

  let user = await User.findById(_id).exec();

  const newExercises = new Exercises({
    description,
    duration,
    date: _date,
    user: user.id,
  })

  await newExercises.save();

  const logs = user.logs || [];
  user.logs = [...logs, newExercises._id];

  await user.save();
  
  res.json({
    description,
    duration,
    date: _date,
    username: user.username,
    _id: user.id,
  });
}) 



app.get('/api/users/:_id/logs', async (req, res) => {
  const { limit, from, to } = req.query;
  const { _id } = req.params;

  let options = {}

  if(limit){
    options = {
      limit: Number(limit), 
    }
  }
  
  console.log(options);

  const user = await User.findById(_id).exec();

  const find = {
    user: user.id,
  }

  if(from && to){
    Object.assign(find, {
      date:{
        $gte: new Date(from),
        $lte: new Date(to),
      }
    })
  }

  const logs = await Exercises.find(
    find, 
    null, 
    options
  ).select('description date duration -_id').exec();

  const data = {
    _id: user._id,
    username: user.username,
    count: 0,
    logs
  }

  res.json(data)
})  


app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.use((error, req, res, next) => {
  res.status(error.status || 500).send({
    error: {
      status: error.status || 500,
      message: error.message || 'Internal Server Error',
    },
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
