class AppError extends Error{
    constructor(statusCode,message) {
        super(message)
        this.statusCode = statusCode
        this.status =  `${this.statusCode}`.startsWith('4')?'fail':'error'
        this.isOperational = true//*we are adding this because we can identify the errors in all other errors like programming errors
        
        Error.captureStackTrace(this,this.constructor)//*this will remove the constructor call  from stack trace of errors  

    }

}

module.exports  = AppError