const Tour = require('../models/toursModel');
const APIFeatures = require('../utils/apiFeatures');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
// const tours = JSON.parse(
//   fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`)
// );

// exports.checkid = (req, res, next, val) => {
//   // console.log(val);
//   if (req.params.id * 1 > tours.length) {
//     return res.status(404).json({
//       status: 'fail',
//       message: 'not found',
//     });
//   }
//   next(); //remember to call next() or else it wont go to next route it will get stucked in this middleware
//   //which means whatever program we have here in this middleware will get executed but the rest route handler wont
// };

// // *middleware -1
// exports.bodycheck = (req,res,next)=>{
//   if(!req.body.name || !req.body.price){
//     return res.status(400).json({  //this return means return from this function and send response
//       status:'fail',
//       message: 'missing property'
//     })
//   }
//   next()
// }

// const queryobj = req.query //*you should not use this like this bcoz as in js when you set varicble to an obj it will the ref to it
//*which means if you change somthing using that variable the query obj will also be changed
//*so we need a copy of that obj to perform somthing so that the query obj doesnt get effected
//*to get a copy of that obj we use structing ==> {...objName} this is the syntax
//*what it does is it will take all the fields and make a copy of it then wrap in a new obj

exports.getAllTours = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(Tour.find(), req.query)
    .filter()
    .sort()
    .fieldLimit()
    .pagination();
  const tours = await features.query;
  res.status(200).json({
    status: 'sucess',
    results: tours.length,
    data: {
      tours, //*this should be in {} if u call it directly no obj is created and no res is shown
    },
  });
  // console.log(req.query);
});

//*we can use documentname.save also but that is a big approuch so we are using model.create()

// exports.createTour = async (req, res) => {
//   try {
//     const newTour = await Tour.create(req.body);
//     res.status(201).json({
//       status: 'sucess',
//       message: 'created sucessfully',
//       data: {
//         newTour,
//       },
//     });
//   } catch (err) {
//     res.status(400).json({
//       status: 'fail',
//       message: { err },
//     });
//   }
// };
exports.createTour = catchAsync(async (req, res, next) => {
  const newTour = await Tour.create(req.body);
  res.status(201).json({
    status: 'sucess',
    message: 'created sucessfully',
    data: {
      newTour,
    },
  });
});

//*old code for ref
// console.log(req.body)
// const newId = tours[tours.length - 1].id + 1;
// const newTour = Object.assign({ id: newId }, req.body);
// tours.push(newTour);
// fs.writeFile(
//   `${__dirname}/../dev-data/data/tours-simple.json`,
//   JSON.stringify(tours),
//   (err) => {
//     res.status(201).json({
//       status: 'sucess',
//       message: 'created sucessfully',
//       data: {
//         newTour,
//       },
//     });
//   }
// );

exports.getTour = catchAsync(async (req, res, next) => {
  // const id = req.params.id * 1;//*this is to convet string in to a number(int)
  const tour = await Tour.findById(req.params.id)
    .populate({ path: 'reviews', select: '-__v' })
    .populate('reviewsCount');
  if (!tour) {
    //*if in result we have 0 tours then send a response of 404
    return next(
      //*next with this err arg will trigger error middleware
      new AppError(404, `no tour is found with this id ${req.params.id}`)
    );
    //*returning the function here itself because with this err the res is sent form global err handler if we didnt return it then 2 responses are sent  this and below one
  }

  res.status(200).json({
    status: 'sucess',
    data: {
      tour,
    },
  });

  // const tour = tours.find((val) => val.id === id); //.find(callback) this will first itterate then returns the true conditons as an array
  // res.send(tour);
});

exports.deleteTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findByIdAndDelete(req.params.id); //*in RESTFUL api it is a common practice that not to send back any data to the client when there is delet operation
  if (!tour) {
    return next(
      new AppError(404, `no tour is found with this id ${req.params.id}`)
    );
  }
  res.status(200).json({
    status: 'sucess',
    message: 'deleted sucessfully',
  });
});

exports.updateTour = catchAsync(async (req, res, next) => {
  const updatedTour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    //*runvalidators will validate the data with the validation we declare in schema
    runValidators: true, //todo: for more go to https://mongoosejs.com/docs/queries.html
  });
  if (!updatedTour) {
    return next(
      new AppError(404, `no tour is found with this id ${req.params.id}`)
    );
  }
  res.status(200).json({
    status: 'sucess',
    data: {
      updatedTour,
    },
  });
});

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
});

// /tour/:tourid/center/:latlng/unit/:unit

exports.getToursWithin  = catchAsync(async (req,res,next)=>{
  const {tourid,latlng,unit} = req.params 
  const [lat,lng] = latlng.split(',')
  console.log(tourid,lat,lng,unit)
  
  res.status(200).json({
    status: 'sucess',
  });
})