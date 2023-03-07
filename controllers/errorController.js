//!global error handling middleware
//*any middleware function with four arguments will be a error handeling middleware express will autometically recognizes it as a error handling middleware
//*whenever ther is an error this middleware is called and executed
//*that is done with next(err)
const AppError = require('../utils/appError');

const sendErrDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    errName: err.name,
    err: err,
    stack: err.stack,
  });
};

const sendErrProd = (err, res) => {
  //*operational errors are trusted errors so send them to the client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    //*programming or any unknown error:dont leak error deatils
    //*1 log error
    console.log(`Error:${err}`);
    //*2 send generic message
    res.status(500).json({
      status: 'error',
      message: 'Somthing went wrong!',
    });
  }
};

const handelCastErrorDb = (err) => {
  const message = `Invalid ${err.path}:${err.value}`;
  return new AppError(400, message);
};
const handleDuplicateFieldsDB = (err) => {
  const value = err.message.match(/(["'])(\\?.)*?\1/)[0];
  // console.log(value)
  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new AppError(400, message);
};
const handelValidationError = (err) => {
  const value = Object.values(err.errors).map((ele) => ele.message); //*Object.values(obj) ==> this itterates the objs and in each ittretation we return only message of that element using map
  const message = `Invalid inputs : ${value.join(', ')}`;
  return new AppError(400, message);
};
const handelJsonWebTokenError = () => {
  const message = 'invalid Json Web Token please login agian';
  return new AppError(401, message);
};
const handelTokenExpiredError = () => {
  return new AppError(401, 'JWT is expired please login agian');
};
//exporting error controller
module.exports = (err, req, res, next) => {
  // console.log(err)
  err.status = err.status || 'error';
  err.statusCode = err.statusCode || 500;

  if (process.env.NODE_ENV === 'development') {
    sendErrDev(err, res);
  } else if (process.env.NODE_ENV.trim() === 'production') {
    let error = { ...err };
    //*mongo db gives 3 errors cast,duplicate,validation but there is no need of showing these errors to the client
    if (err.name === 'CastError') {
      //*for cast errors any improper id given in parameter
      error = handelCastErrorDb(error);
    }6
    if (err.code === 11000) {
      // console.log(err.message)
      error = handleDuplicateFieldsDB(err);
    }
    if (err.name === 'ValidationError') {
      error = handelValidationError(err);
    }
    if (err.name === 'JsonWebTokenError') {
      error = handelJsonWebTokenError();
    }
    if (err.name === 'TokenExpiredError') {
      error = handelTokenExpiredError();
    }
    sendErrProd(error, res);
  }
};
