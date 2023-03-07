const express = require('express');
const router = express.Router({ mergeParams: true }); //*mergeparams:true will merge all parameters in Router middleware so we get acess to all params recived in this router
//*in tours route we have called this review route for /:tourId/review this route so we can acess this tourId here in this route also
const reviewController = require('../controllers/reviewController');
const authcontroller = require('../controllers/authController');

router.use(authcontroller.protect);

router
  .route('/')
  .get(reviewController.getAllReviews)
  .post(
    authcontroller.restrict('user'),
    reviewController.userTourUpdate,
    reviewController.createReview
  );
router
  .route('/:id')
  .get(reviewController.getReview)
  .patch(
    authcontroller.restrict('user', 'admin'),
    reviewController.updateReview
  )
  .delete(
    authcontroller.restrict('user', 'admin'),
    reviewController.deleteReview
  );

module.exports = router;
