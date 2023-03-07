const catchAsync = require('../utils/catchAsync');
const reviewsModel = require('../models/reviewsModel');
const factoryController = require('../controllers/factoryController');

//POST /tour/dlafnhfaoijfo/review this route will come here 


exports.getAllReviews = factoryController.getAll(reviewsModel);

exports.userTourUpdate = (req, res, next) => {
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user._id;
  next();
};

exports.getReview = factoryController.getOne(reviewsModel);
exports.deleteReview = factoryController.deleteOne(reviewsModel);
exports.updateReview = factoryController.updateOne(reviewsModel);

exports.createReview = factoryController.createOne(reviewsModel);
