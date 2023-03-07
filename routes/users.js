const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authcontroller = require('../controllers/authController');

router.post('/signup', authcontroller.signup);
router.post('/login', authcontroller.login);
router.post('/forgetPassword', authcontroller.forgetPassword);
router.patch('/resetPassword/:token', authcontroller.resetPassword);

router.use(authcontroller.protect)//*this is a middelware from which the router passes through so that after this middelware every route is protected(logged in) we need not to mention .protect in all routes
//*router is also a mini application in which we can use middlewares to make our route pass through it
//*as this above line executes it means all the below routes like (updateme,getall...) will have to be looged in to acess them
router.patch('/updateMe', userController.updateMe);
router.delete('/deleteMe',userController.deleteMe)
router.get('/getMe',userController.getMe,userController.getUser)

router.patch(
  '/updatePassword',
  // authcontroller.protect,
  authcontroller.updatePassword
);
router.use(authcontroller.restrict('admin'))
//*to acess below routes only this roles are allowed
router
  .route('/')
  .get(userController.getAllusers)
  .post(userController.createUser);

router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete( userController.deleteUser);

module.exports = router;
