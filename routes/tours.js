// json.parse()--this method converts json in to javascript object or an array of js objects
// jsend specification
//Object.assign()---this creates a new obj by merging two objs together
const express = require('express');
const router = express.Router();
const tourController = require('../controllers/tourController');
const authController = require('../controllers/authController');
const reviewRouter = require('../routes/review');

// router.param('id',tourController.checkid)
/*this is called param middleware in this middleware we have acess to 4 parameter in call back fuction
(req,res,next,val)=.{} val is where we get the value of parameter*/

router.route('/tour-stats').get(tourController.getTourStats);
router
  .route('/top-5-cheap')
  .get(tourController.aliasTopFive, tourController.getAllTours);
router
  .route('/get-month-plan/:year')
  .get(
    authController.protect,
    authController.restrict('admin', 'lead-guid', 'guid'),
    tourController.getmonthlyplan
  );
router
  .route('/distance/:distance/center/:latlng/unit/:unit')
  .get(tourController.getToursWithin);
router.route('/distances/:latlng/unit/:unit').get(tourController.getDistances);
router.use('/:tourId/review', reviewRouter);
// /tour/:tourid/center/:latlng/unit/:km
// /tours-within?distance=233&center=-40,45&unit=mi//*we can also do it in this way using querys
// /tours-within/233/center/-40,45/unit/mi

router
  .route('/')
  .get(tourController.getAllTours)
  .post(
    authController.protect,
    authController.restrict('admin', 'lead-guid'),
    tourController.createTour
  );

//post(middleware,tourController.createTour)
// this is called chaining of multiple middlewares
//this middleware runs first and if everthing is done properly then it will call next() which here is createtour middleware
//if middleware is not executed then it will throw error(operational error)
//this is used to check various like user is logged in or not or does the user have acess to hit the endpoint
// we can chain as many middlewares as we want for various works
//here bodycheck is a middleware which we have created in tourcontroller to check the body of the req obj

router
  .route('/:id')
  .get(tourController.getTour)
  .patch(
    authController.protect,
    authController.restrict('admin', 'lead-guid'),
    tourController.updateTour
  )
  .delete(
    authController.protect,
    authController.restrict('admin', 'lead-guid'),
    tourController.deleteTour
  );

module.exports = router;
