const userModel = require('../models/userModels');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factoryController = require('../controllers/factoryController');



const filterObj = (reqBody, ...allowedFields) => {
  const newObj = {};
  Object.keys(reqBody).forEach((element) => {
    if (allowedFields.includes(element)) {
      newObj[element] = reqBody[element];
    }
  });
  return newObj;
};


exports.updateMe = catchAsync(async (req, res, next) => {

  //1 check if the user is trying to change password fields if yes throw an error  stating that this route is not for password update
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        400,
        'This route is not for updating password if you want to update password then go to /updatePassword '
        )
        );
      }
      // console.log(req.body);
      // 2) Filtered out unwanted fields names that are not allowed to be updated so that the users wont be  to change their role to  admin or some  unrestricted roles
      const filterBody = filterObj(req.body, 'name', 'email');
      //3 if everything is ok then update the fields
      const updatedUser = await userModel.findByIdAndUpdate(
        req.user._id,
        filterBody,
        {
          new: true,
          //*runvalidators will validate the data with the validation we declare in schema
          runValidators: true, //todo: for more go to https://mongoosejs.com/docs/queries.html
        }
        );
        
        res.status(200).json({
          status: 'sucess',
          message: 'fields has been updated sucessfully',
          updatedUser
        });
});

exports.deleteMe = catchAsync(async (req,res,next)=>{
  await userModel.findByIdAndUpdate(req.user._id,{active:false},)
  res.status(200).json({
    status:'sucess',
    message:'user deactivated sucessfully',
    data:null
  })
})

exports.getMe = (req,res,next) =>{
  req.params.id = req.user._id  
  next()
}

exports.getAllusers = factoryController.getAll(userModel)
exports.updateUser = factoryController.updateOne(userModel)
exports.deleteUser = factoryController.deleteOne(userModel) 
exports.getUser = factoryController.getOne(userModel)


exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'this route is not yet defined /signup',
  });
};


