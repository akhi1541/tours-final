const Tour = require('../models/toursModel');
const catchAsync = require('../utils/catchAsync');
const factoryFuction = require('./factoryController');

exports.getAllTours = factoryFuction.getAll(Tour);
exports.createTour = factoryFuction.createOne(Tour);
exports.deleteTour = factoryFuction.deleteOne(Tour);
exports.updateTour = factoryFuction.updateOne(Tour);
exports.getTour = factoryFuction.getOne(
  Tour,
  { path: 'reviews', select: '-__v' },
  'reviewsCount'
);
exports.aliasTopFive = (req, res, next) => {
  (req.query.limit = 5), (req.query.sort = 'price');
  req.query.fields = 'name,duration,discription price';
  next()
};

//*aggregation

exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    //*this returns an aggregate object so we await it
    //*syntax is .aggregate([{$k:{k:{}}},{}...])
    {
      $match: { ratingsAverage: { $gte: 4.5 } }, //*this returns querys that are ratingAverage = gte 4.5 this works like a filter
    },
    {
      $group: {
        _id: { $toUpper: '$difficulty' }, //*to acess the element from the query you need to specify '$fieldName'
        noOfTours: { $sum: 1 }, //*in aggretation each element(document) of our collection goes in to this pipeline its like itteration so in each we add 1 so we get total no of documents in our collection
        avgRating: { $avg: '$ratingsAverage' }, //*$avg - average
        avgPrice: { $avg: '$price' },
        minprice: { $min: '$price' },
        maxprice: { $max: '$price' },
      },
    },
    {
      $sort: { avgprice: 1 }, //*here we specify the fields we create in $group or anywhere in this aggerigte sec here not the query elements
      //* 1 - assecending and -1 - decending
    },
    // {
    //   $match:{_id:{$ne:'EASY'}}//*we can use same stage for even multiple times in pipeline
    //   //*this above stage excludes EASY group in the aggregate query
    // }
  ]);
  res.status(200).json({
    status: 'sucess',
    data: {
      stats,
    },
  });
});

exports.getmonthlyplan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1; // 2021
  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates', //*what this does is deconstruct an array field from our query and output one element for each document
      //*in simple works if in a document we have an array with 3 elemnts unwind will split it and generate 3 documents of the same doc with that 3 elements
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numOfTours: { $sum: 1 },
        tours: { $push: '$name' }, //*to create an array of name tous
      },
    },
    {
      $addFields: { month: '$_id' }, //*adds field with this value
    },
    {
      $project: {
        //*project removes the field from the result
        _id: 0,
      },
    },
    {
      $sort: { numOfTours: -1 },
    },
    // {
    //   $limit:6
    // },
  ]);
  res.status(200).json({
    status: 'sucess',
    data: {
      plan,
    },
  });
});

exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');
  if (!lat || !lng) {
    next(
      new AppError(
        'Please provide latitutr and longitude in the format lat,lng.',
        400
      )
    );
  }
  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;
  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });

  res.status(200).json({
    status: 'sucess',
    results: tours.length,
    data: {
      tours,
    },
  });
});

exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

  if (!lat || !lng) {
    next(
      new AppError(
        'Please provide latitutr and longitude in the format lat,lng.',
        400
      )
    );
  }

  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1],
        },
        distanceField: 'distance',
        distanceMultiplier: multiplier,
      },
    },
    {
      $project: {
        //*only show this fields in the output
        distance: 1,
        name: 1,
      },
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      data: distances,
    },
  });
});
