const APIFeatures = require('../utils/apiFeatures');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.createOne = (model) =>
  catchAsync(async (req, res, next) => {
    const newDoc = await model.create(req.body);
    res.status(201).json({
      status: 'sucess',
      message: 'created sucessfully',
      data: {
        newDoc,
      },
    });
  });

exports.deleteOne = (model) =>
  catchAsync(async (req, res, next) => {
    const doc = await model.findByIdAndDelete(req.params.id); //*in RESTFUL api it is a common practice that not to send back any data to the client when there is delet operation
    if (!doc) {
      return next(
        new AppError(404, `no document is found with this id ${req.params.id}`)
      );
    }
    res.status(200).json({
      status: 'sucess',
      message: 'deleted sucessfully',
    });
  });

exports.updateOne = (model) =>
  catchAsync(async (req, res, next) => {
    const updatedDocument = await model.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        //*runvalidators will validate the data with the validation we declare in schema
        runValidators: true, //todo: for more go to https://mongoosejs.com/docs/queries.html
      }
    );
    if (!updatedDocument) {
      return next(
        new AppError(404, `no document is found with this id ${req.params.id}`)
      );
    }
    res.status(200).json({
      status: 'sucess',
      data: {
        updatedDocument,
      },
    });
  });

exports.getAll = (model) =>
  catchAsync(async (req, res, next) => {
    let filter = {};
    if (req.params.tourId) {
      filter = { tour: req.params.tourId }; //*if id is present then find tour with only that id
      console.log(filter);
    }

    // console.log(model)
    const features = new APIFeatures(model.find(filter), req.query)
      .filter()
      .sort()
      .fieldLimit()
      .pagination();
    // console.log(features.query); this is the final result(in promise) we await it to get the data
    const documents = await features.query; //.explain() will give detaill explanation abt the query
    res.status(200).json({
      status: 'sucess',
      results: documents.length,
      data: {
        documents, //*this should be in {} if u call it directly no obj is created and no res is shown
      },
    });
    // console.log(req.query);
  });

exports.getOne = (model, populateQuery1, populateQuery2) =>
  catchAsync(async (req, res, next) => {
    // const id = req.params.id * 1;//*this is to convet string in to a number(int)
    let query = model.findById(req.params.id);
    if (populateQuery1) {
      query = query.populate(populateQuery1);
    }
    if (populateQuery1 && populateQuery2) {
      query = query.populate(populateQuery1).populate(populateQuery2);
    }
    const document = await query;
    if (!document) {
      //*if in result we have 0 tours then send a response of 404
      return next(
        //*next with this err arg will trigger error middleware
        new AppError(404, `no document is found with this id ${req.params.id}`)
      );
      //*returning the function here itself because with this err the res is sent form global err handler if we didnt return it then 2 responses are sent  this and below one
    }

    res.status(200).json({
      status: 'sucess',
      data: {
        document,
      },
    });
    // const tour = tours.find((val) => val.id === id); //.find(callback) this will first itterate then returns the true conditons as an array
    // res.send(tour);
  });

//{ path: 'reviews', select: '-__v' }
// ('reviewsCount');
