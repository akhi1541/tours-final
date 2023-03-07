const mongoose = require('mongoose');
const dotenv = require('dotenv');

//*uncaught exception -synchronis  
process.on('uncaughtException', (err) => {
  //*this should be in the top of code so there is no uncaught error before it
  console.log(err.name, err.message);
  console.log('UNCAUGHT EXCEPTION! shutting down');
  process.exit(1); //*0 for sucess and 1 for exception
});



dotenv.config({ path: './config.env' }); //what it does is it will read this .env file and load it to nodejs environment variables
const app = require('./app');

//console.log(process.env);
console.log(process.env.NODE_ENV);
const DB = process.env.DB_LOCAL_URL;
// mongoose.connect(process.env.DB_LOCAL_URL)
// const DB = process.env.DB_URL.replace('<PASSWORD>', process.env.DB_PASSWORD);
mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useFindAndModify: false,
    useCreateIndex: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    //this is a promose in which we get acess to the connection object
    // console.log(con.connections);
    console.log('db connected');
  });

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`server is running on ${port}`);
});
process.on('unhandledRejection', (err) => {
  console.log(err.name, err.message);
  console.log('UNHANDELED REJECTION! shutting down');
  server.close(() => {
    process.exit(1); //*0 for sucess and 1 for exception
  });
});

