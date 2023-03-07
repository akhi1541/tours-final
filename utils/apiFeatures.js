class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }
  filter() {
    //*Filtering
    const queryobj = { ...this.queryString }; //*req.query - query obj
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach((ele) => delete queryobj[ele]);

    //*Advance filtering
    //?what is JSON.stringify and JSON.parse
    let queryString = JSON.stringify(queryobj);
    queryString = queryString.replace(
      /\b(gte|gt|lte|lt)\b/g, //*here by using g flag this will happen for multiple time that means if in a string there are a one or more it will consider and replace them
      (element) => `$${element}` //*we are converting this  elements(lt,gte...) in to $lt,$gt... bcoz mongodb takes this bitwise operators with $ in front of it
    );
    //*{duration:{$gte:5}} this is how it will look like after this conversion
    //*here to use replace method

    this.query = this.query.find(JSON.parse(queryString)); //this find method returns all the documents in a js obj
    return this;
  }
  sort() {
    //*sorting
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' '); //*this is because mongoose will sort on multiple param but we need to pass it as sort("price ratings name") so we are converting price,ratings,.. to that
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('-createdAt');
    }
    return this;
  }
  fieldLimit() {
    //*Field limiting
    if (this.queryString.fields) {
      const reqFields = this.queryString.fields.split(',').join(' '); //*"name,duration"=>"name duration"
      this.query = this.query.select(reqFields); //*this will return only selected fields
      //*select() takes an string of fields with space seperted
    } else {
      this.query = this.query.select('-__v');
    }
    return this;
  }
  pagination() {
    //*pagination
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 10;
    const skip = (page - 1) * limit;
    this.query = this.query.skip(skip).limit(limit);
    // if (req.query.page) {
    //   //*if reqested pages are more than our documents in db
    //   const documentCount = await Tour.countDocuments(); //*countDocuments() - returns no of docs in db(Tour)
    //   if (skip >= documentCount) {
    //      throw new Error('this page does not exist')
    //   }
    // }
    return this;
  }
}

module.exports = APIFeatures;
