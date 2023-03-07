const mongoose = require('mongoose');
const Tour = require('../models/toursModel');
const reviewSchema = mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'review can not be empty!'],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      set:val=>Math.round(val*10)/10 //*if we have 4.6666 we need to show 4.7 so we take it *10 so 46.666 ==> math.round(46.66)=47 / 10 =4.7 
    },
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    tour: [
      //*here we  are parent referencing this both documents(tour,user) which get acessed from their respective collections
      //*But in parent referencing parents wont have any acess to this docs(review) directly for that we use "virtual polupate" to acess this child in parent document
      {
        type: mongoose.Schema.ObjectId,
        ref: 'Tours',
        required: [true, 'tour is Required!'],
      },
    ],
    user: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'Users',
        required: [true, 'user is required!'],
      },
    ],
  },
  {
    //*schema options
    toJSON: { virtuals: true }, //*this grants acess to virtuals in our output if it is converted in to json --with out this declaration we can see virtuals in our output json
    toObject: { virtuals: true }, //*this grants acess to virtuals in our output if it is converted in to object
  }
);

reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

reviewSchema.statics.caliculateRatings = async function (tourId) {
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: '$tour', //*this is the field in the doc which you want to group by
        reviewcount: { $sum: 1 },
        average: { $avg: '$rating' },
      },
    },
  ]);
  // console.log(stats)
  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsAverage: stats[0].average,
      ratingsQuantity: stats[0].reviewcount,
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsAverage: 4.5,
      ratingsQuantity: 0,
    });
  }
};

reviewSchema.pre(/^find/, function (next) {
  // this.populate({
  //   path: 'tour',
  //   select:'name',

  // });
  this.populate({
    path: 'user',
    select: 'name photo',
  });
  next();
});

reviewSchema.post('save', function () {
  //*here logic is document.costructor is model becoz document is created with the model
  this.constructor.caliculateRatings(this.tour); //*this is current document and this.constructer is the model as caliculateRatings is a static method we call it using this.constructor model
});
//*for every update and delete of review we need to call caliculateRatings() every tym after this query so we take a query middleware
reviewSchema.pre(/^findOneAnd/, async function (next) {
  const rev = await this.findOne();
  this.tourDoc = rev;
  next();
});
reviewSchema.post(/^findOneAnd/, function () {
  // console.log(this.tourDoc.tour)
  this.tourDoc.constructor.caliculateRatings(this.tourDoc.tour);
  //   (this)
});

const reviewsModel = mongoose.model('Reviews', reviewSchema);
// reviewsModel.watch().on("change", (data) => console.log(new Date(), data)); 


module.exports = reviewsModel;
