const express = require('express');
const morgan = require('morgan');
const path = require('path');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const toursRouter = require('./routes/tours');
const usersRouter = require('./routes/users');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const reviewRouter = require('./routes/review');
const viewRouter = require('./routes/viewRoutes')

const app = express();

app.set('view engine', 'pug'); //*this is basically like a setting so we are setting the view engine as pug
//*out of box we get some template engines pre installed
//*we use views in node for templates bcoz of mvc controll(doubt )

app.set('views', path.join(__dirname, 'views')); //*we use this path method becoz we dont know whenever we recive a path has a slash or not so its better to use this

//? Serving static files
app.use(express.static(path.join(__dirname, 'public')));
// app.use(express.static(`${__dirname}/public`));
//this is used to serve static files like html,css,imgs etc from our file system in broswer

//? Development logging
//use of morgan
//this helps to show the data like the req type(get,post....) status code the time api took to send back the res and also the size of the res
//GET /api/v1/tours/ 200 2.840 ms - 8703(this is how you get the data by using morgan)
//this is a third party middleware
//we can acess this NODE_ENV variable without importing config file because this is a global variable
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
//? Set security HTTP headers
app.use(helmet());

//? Limit requests from same API
const limiter = rateLimit({
  //*this is used to limit the no of reqs from a same ip address in order to overcome brut froce attacks
  max: 90, //*max no of reqs windowMs time
  windowMs: 60 * 60 * 1000, //*no of reqs per this time here we have given 1hr so for every 1hr the limiter is resetted
  message: 'To many reqs from this IP,please try again after one hour',
});
//*check in headers  of res
app.use('/api', limiter); //*for every api which contain this /api(all reqs) go thourgh this middleware(limiter) if there is err then message is displayed

//? Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' })); //* also limiting data from a req to a max of 10kb

//? Data sanitization against NoSQL query injection
//*this is one of the imp bcoz using {$gt:""} for email field in login will get logged in becoz this is a true condition in order to eradicate this we use this middleware
app.use(mongoSanitize());

//? Data sanitization against XSS
app.use(xss());

//? Test middleware
app.use((req, res, next) => {
  // console.log(req.headers);
  next();
});

//? Prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  })
);

//*routes
app.get('/',viewRouter);
app.use('/api/v1/tours', toursRouter);
app.use('/api/v1/users', usersRouter);
app.use('/api/v1/reviews', reviewRouter);

//?wild card routes
//*for all routes which dont have route handlers i mean for bad routes (wild card routes)
//*we are declaring it here because this piece of code is executed in the last when there is not accepetd by any handler
app.all('*', (req, res, next) => {
  //*all is used for all http methods like get,post...
  // res.status(404).json({
  //   status: 'failed',
  //   message: `cant find ${req.originalUrl} on this page`,
  // });
  // const err = new Error(`cant find ${req.originalUrl} on this page`);
  // err.status = 'fail';
  // err.statusCode = 404

  const err = new AppError(404, `cant find ${req.originalUrl} on this page`);
  next(err); //*if next gets any argument express will autometically know that it is an error and it will skip all other middlewares in the middleware stack  and send the err to the global error handler we decalred
});

//*calling errorhandler which we have declared in error controller
//*this below middleware gets called when next(err)
app.use(globalErrorHandler);

module.exports = app;
