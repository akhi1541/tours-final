const userModel = require('../models/userModels');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const sendEmail = require('../utils/email');
const crypto = require('crypto');

const loginTo = (id) => {
  return jwt.sign({ id: id }, process.env.JWT_SECURITY_KEY, {
    expiresIn: process.env.JWT_EXPIRE_TIME,
  });
};
const createSendToken = (user, statusCode, message, res) => {
  //*cookie is just a piece of txt which is sent from server to client which client stores it and sends it back to the server for (like jwt to get acess) all future reqs

  const token = loginTo(user.id);
  //*jwt.sign(payload(data),securityKey,options)
  const cookieOptions = {
    //*to send cookie res.cookie(cookie name,cookie,{options})
    expires: new Date(
      Date.now() + process.env.JWT_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    // secure: true, //*with this the cookie will be only sent through encrypted connection(https)
    httpOnly: true, //*if we store our cookie in this httpOnly then the broweser can only read it and wont be able to  modify  it or acess it so it will be protected from cross-site-scripting attacks
  };
  if(process.env.NODE_ENV === 'production') cookieOptions.secure = true //*because here in devolopment we use http
  res.cookie('jwt', token,cookieOptions);
  //*removes password only from the output not from database because after this below step we are not saving to database just sending the response
  //* we are able to see the password in the output of the signup though we have select property  to false because we are creating a new document we are not find querying the doc so we do it here
  user.password = undefined
  res.status(statusCode).json({
    status: 'sucess',
    token,
    message: message,
    data: user,
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await userModel.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordModifiedAt: req.body.passwordModifiedAt,
    role: req.body.role,
  });
  createSendToken(newUser, 200, 'user created sucesfully', res);
});

exports.login = catchAsync(async (req, res, next) => {
  // const email = req.body.email
  // const password = req.body.password
  //*same as up but as in ES6 this is a shorthand
  const { email, password } = req.body;
  //*1 check if email password exists
  if (!email || !password) {
    return next(new AppError(400, 'please provide email and password'));
  }
  //*2 check  if user  exists  in database and password is correct
  const user = await userModel.findOne({ email }).select('+password'); //*select is for accesing the password field which we made hidden in schema to access it select('+fieldname')
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError(400, 'Incorrect email or password'));
  }
  //*3 if everything is of generate the token and send it to the client
  createSendToken(user, 200, 'login sucessful', res);
});

exports.protect = catchAsync(async (req, res, next) => {
  let token;
  //1.check token n if its there
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    return next(new AppError(401, 'you are not logged in please login'));
  }
  //2.verify token using jwt verify to get payload(id)
  const decoded = await promisify(jwt.verify)(
    token,
    process.env.JWT_SECURITY_KEY
  );
  //*decode is the payload
  // console.log(decoded.id)
  //*if some third party middleware changes this token then the verification throws false
  //*or it might be because of the validity of jwt if it expires then it returns an error
  //* if the verification is done sucessfully then the payload(id) is returned
  if (!decoded) {
    return next(new AppError(401, 'jwt verification is failed'));
  }
  //3.check if user still exists
  const currentUser = await userModel.findOne({ _id: decoded.id });
  if (!currentUser) {
    return next(
      new AppError(401, 'The user belong to this token does no longer exists')
    );
  }

  //4.check if password is modified or not afer token is issued
  //*this is a situation where there is an unknown login you want to reset the password so that that all unknoewn logins are logged out
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(new AppError(401, 'password is changed please login agian'));
  }
  //5.grant acess
  req.user = currentUser;
  next();
});

exports.restrict = (...roles) => {
  //*(...arrayName)==>is called rest takes parameters and convert them in to an array
  return (req, res, next) => {
    //roles:[admin,lead-guid] req.user.role-admin or lead guid then give permission or else forbid
    // console.log(req.user.role)
    if (!roles.includes(req.user.role)) {
      //*because of closer we have acess to roles array here
      return next(
        new AppError(403, 'you are not allowed to perform this action')
      );
    }
    next();
  };
};

exports.forgetPassword = catchAsync(async (req, res, next) => {
  //1)get user based on posted email in the req body(findOne)
  const user = await userModel.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError(404, 'User not found with given email'));
  }
  //2)generate the random reset token (crypto)
  const resetToken = user.passwordResetTokenGenerate();
  await user.save({ validateBeforeSave: false }); //this will  turn off  all the validators which we have declared in schema for password to be required and a lot
  //*user.save will update the date in the data base with two new fields when u hit this route(forgetpassword) reset and expires
  // res.send('ahii')
  //3)create a reset url
  const resetUrl = `${req.protocol}://${req.get(
    'host'
  )}api/v1/users/${resetToken}`;
  const message = `this is your reset password url plese click this to  change password ${resetUrl}.If you remember the password just ignore this mail`;
  //4)send it back to the user email to reset password
  try {
    await sendEmail({
      email: user.email,
      subject: 'Your password reset token valid for 10min',
      message: message,
    });
    res.status(200).json({
      status: 'sucess',
      message: 'token has sent to email sucessfully',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    console.log(err);
    return next(
      new AppError(
        500,
        'There was an error in sending email! Please retry again '
      )
    );
  }
});
exports.resetPassword = catchAsync(async (req, res, next) => {
  //1a check if resetToken is still not expired
  //1b get the user from db using resetToken by encrpting it and finding it in db
  const token = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');
  const user = await userModel.findOne({
    passwordResetToken: token,
    passwordResetExpires: { $gt: Date.now() },
  });
  if (!user) {
    return next(new AppError(404, 'Token is invalid or expired'));
  }
  //2 take data form req obj and update password field with validations=true
  //2b remove reset token and expiry time from data base
  //user is a document in our database
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  //*with above 4 lines we are updating the schema use .save() update in the database
  await user.save();
  //3 update passwordChangedAt field in doc pre middleware

  //5 send jwt in res
  createSendToken(user, 200, 'password reset sucessfull', res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  //1 get the user form the database
  const user = await userModel.findById(req.user._id).select('+password');
  //*here as the user is already already logged in we need not check the user exists or  not
  //2 check if posted password is correct
  if (!(await user.correctPassword(req.body.password, user.password))) {
    return next(
      new AppError(
        403,
        'Given current password is incorrect please check it in order to update the password'
      )
    );
  }
  //3 update the password
  user.password = req.body.newPassword;
  user.passwordConfirm = req.body.newPasswordConfirm;
  await user.save();
  //4 Login user,send jwt

  createSendToken(user, 200, 'password updated sucessfull', res);
});
