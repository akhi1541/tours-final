module.exports = (fn) => {
  return (req, res, next) => {
    //*this is an anonamys function which is returned for getTour call this the function which is executed for get
    //*if any error in fn then it will go to catch directly and next(err) is called and error middleware is executed
    // fn(req,res,next).catch(err=>next(err))
    fn(req, res, next).catch(next); //*you can do it as above line but this is a short hand
  };
};
