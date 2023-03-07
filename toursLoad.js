const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: './config.env' }); //what it does is it will read this .env file and load it to nodejs environment variables
const fs = require('fs');
const Tour = require('./models/toursModel');
const User = require('./models/userModels')
const Review = require('./models/reviewsModel')

const DB = process.env.DB_LOCAL_URL;
mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useFindAndModify: false,
    useCreateIndex: true,
    useUnifiedTopology: true,
  })
  .then((con) => {
    //this is a promose in which we get acess to the connection object
    // console.log(con.connections);
    console.log('db connected');
  });
//*read file
const tours = JSON.parse(
  fs.readFileSync(`${__dirname}/dev-data/data/tours.json`));
const users = JSON.parse(
  fs.readFileSync(`${__dirname}/dev-data/data/users.json`));
const reviews = JSON.parse(
  fs.readFileSync(`${__dirname}/dev-data/data/reviews.json`));

//*import data to db
const importdata = async () => {
  try {
    // await Tour.create(tours);
    // await User.create(users,{validateBeforeSave:false});
    await Review.create(reviews);
    console.log('uploaded sucessfully');
  } catch (err) {
    console.log('error', err);
  }
  process.exit();
};

// *delete all data from database
const deletedata = async () => {
  try {
    // await Tour.deleteMany();
    // await User.deleteMany();
    await Review.deleteMany();
    
    console.log('deleted sucessfully');
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

//node toursLoad.js --import ==> this array is returned[ 'C:\\Program Files\\nodejs\\node.exe','D:\\tours proj\\tours\\toursLoad.js','--import']
//*we acess the second element which is import or delete so that we can do somthing on that bases
//*basically we are trying to create a command line application
//*if we give --import we call import data function
//node toursLoad.js --delete
// console.log(process.argv[2]);

if (process.argv[2] === '--import') {
  importdata();
} else if (process.argv[2] === '--delete') {
  deletedata();
}
