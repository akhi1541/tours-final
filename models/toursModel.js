const mongoose = require('mongoose');
// const UserModel = require('./userModels');
const tourShema = new mongoose.Schema(
  {
    //*schema defination
    name: {
      type: String,
      required: [true, 'name is required'], //this message is returned in catch  block as an error when the name is not given
      unique: true,
      trim: true,
      maxlength: [40, 'A tour name must have less or equal then 40 characters'],
      minlength: [10, 'A tour name must have more or equal then 10 characters'],
      // validate: [validator.isAlpha, 'Tour name must only contain characters']
    },
    slug: String,
    duration: {
      type: Number,
      requied: [true, 'A tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      enum: {
        //* using this we can set exact this values are only allowed into this fiels
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either: easy, medium, difficult',
      },
    },
    price: {
      type: Number,
      required: [true, 'price is required'],
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          return this.price > val;
        },
        message: 'price Discount ({VALUE}) should be greater than price',
      },
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a description'],
    },
    description: {
      type: String,
      trim: true, //*this will remove spaces in the start and end of the string "  sjkf "  ="sjkf"
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image'],
    },
    images: [String], //*here we dont pass images we jst pass thier filenames as strings the imags will be stored somwhere in a file sys in order to acess them we need the file name of that image
    createdAt: {
      //this should be automatically created
      type: Date, //*date is another js inbuilt data type
      default: Date.now(), //returns a time stamp in milliseconds which basically represents current millisecond -1618857746389
      //*now in mongo this is immediately converted into todays date
      select: false,
    },
    startDates: [Date], //here we want array of dates
    //*here as we have given datatype as date so the string which we pass as in body will be parsed in to time by mongo
    secretTour: {
      //*only  vips can acess true trues
      type: Boolean,
      default: false,
    },
    startLocation: {
      //*if we want to remove all this startlocation and use the first element in locations array but we are doing it this way
      type: {
        type: String,
        // Don't do `{ location: { type: String } }`
        enum: ['Point'], // 'location.type' must be 'Point','line','pollygon'etc        // required: true,
      },
      coordinates: [Number], //longitude first second latitude
      description: String,
      address: String,
    },
    //*we are embedding the document into this tour document as we planned it in data modelling
    //*to create documents and embedd them into another document we need to use array
    //*by using array in embedding whenever we specify an obj init it will create a brand new document in side the  parent document which is in this case tours document
    //*this is how we create embedded or denormalized dataset ->datasets which have really closeness to each other
    locations: [
      {
        type: {
          type: String,
          // Don't do `{ location: { type: String } }`
          enum: ['Point'], // 'location.type' must be 'Point','line','pollygon'etc        // required: true,
        },
        coordinates: [Number], //longitude first second latitude
        address: String,
        description: String,
        day: Number, //*day in tour
      },
    ],
    // guides:Array//*embedding guides form user collection here we expect id's of the user-guids in this field
    guides: [//*this is referencing or normalized
      {
        type: mongoose.Schema.ObjectId,//*this is a spl data type for only mongoose ids
        ref:'Users'//*this is for referencing the users collection in our database
      },
    ],
  },
  {
    //*schema options
    toJSON: { virtuals: true }, //*this grants acess to virtuals in our output if it is converted in to json --with out this declaration we can see virtuals in our output json
    toObject: { virtuals: true }, //*this grants acess to virtuals in our output if it is converted in to object
  }
);
//!virtual properties - this are declared in schema but wont get saved in to db
//*we use this to create a field which we use in schema but dont want to save it to our database
//*declaration=>schema.virtual('name',function())
tourShema.virtual('durationInWeeks').get(function () {
  //*this is a getter function so when you want durationinweeks this function is geted
  //*we have to use normal function because to acess this keyword which is not in arrow
  return this.duration / 7; //*this is the current document
});

//!virtual populate
//*this is to get the child document in the parent to give the combined res to the user but you  wont save this combined data in db we are just referencing
//*we can do child ref but the review array may grow unconditionally so the time and space complexity will be O(n)  but with parent ref itll be O(1) 
//*in parent ref as childs can only acess parent but parent cant acess child directly using populate so we use virtual populate

tourShema.virtual('reviews',{
  ref:'Reviews',
  foreignField:'tour',
  localField:'_id',
  
})

tourShema.virtual('reviewsCount',{
  ref:'Reviews',
  foreignField:'tour',
  localField:'_id',
  count:true
  
})
tourShema.index({ratingsQuantity:1})//indexing (1 and -1) are sorting orders
// tourShema.index({ratingsQuantity:1, ratingsAverage:1})//compound index
tourShema.index({startLocation:'2dsphere'})
//!document middelware:runs before save()  or create()
//*pre is called before document is saved and post is  saved after document is saved
//*in  document middleware 'this' points to documents in mongodb
// tourShema.pre('save',function(next){
//   this.slug = slugify(this.name,{lower:true})
//   next()
// })

tourShema.pre('save', function (next) {
  console.log('is saved');
  next();
});
// tourShema.pre('save', async function(next){
//   const userpromises =  this.guides.map(async id => await UserModel.findById(id))
//   this.guides = await Promise.all(userpromises)//*in the above step we get only promises in an array which are not resolved so we use promise.all(arr) to resolve all promises at a time
//   // console.log(this.guides)
//   next()
// })
tourShema.post('save', function (doc, next) {
  console.log('%s has been saved', doc._id);
  next();
});

//!query  midddleware
//*the only difference is we specify the query insted of save or create as we do in document middleware
//*in query middleware 'this' key word is points to the current query(find,findone......)
//*this pre find hook is executed before any find query  is executed
//todo create a middleware that does not contain secerate tour which should not be shown to all users only vip's can acess that tours
tourShema.pre(/^find/, function (next) {
  // */^find/-all queries that start with find so we can cover all findone,findbyid..
  this.find({ secretTour: { $ne: true } });
  this.start = Date.now();
  next();
});
tourShema.pre(/^find/,function(next){
  this.populate({//*this will fill data in the guides  field which is  referencing dataset (we use populate to fill data in reference data sets) 
    path:'guides',//*path is for the field in which populate has to be done
    select:'-__v -passwordModifiedAt'//*remove v and pass.. fields from op  
  })
  next()
})


tourShema.post(/^find/, function (doc, next) {
  console.log(`query  took ${Date.now() - this.start} milliseconds`);
  next();
});

//!aggeration middleware
//*this is pointed to current aggeration object
// tourShema.pre('aggregate', function (next) {
//   console.log(this.pipeline()); //*returns the array that we passed in to aggerigate funtion before
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
//   next();
// });

//*model creation (collection)
const Tour = mongoose.model('Tours', tourShema); //*here we have given name as Tours so the collection is created as Tours

module.exports = Tour;

//   const testtour = new Tour({
//     name:'bluaf',
//     rating:5.5,
//     price:44
//   });
//   testtour
//   .save() //*this will return a promise in which we get acess to document itself
//   .then(document =>{
//     console.log(document)
//   })
//   .catch(err =>{
//     console.log(err)
//   })
