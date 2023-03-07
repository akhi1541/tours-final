const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'name is required'],
  },
  email: {
    type: String,
    required: [true, 'user must have email'],
    unique: true,
    lowercase: true,
    validate: {
      validator: validator.isEmail,
      message: 'Invalid email',
    },
  },
  role: {
    type: String,
    enum: ['admin', 'lead-guid', 'user', 'guid'],
    default: 'user',
  },
  photo: {
    type: String,
  },
  passwordResetToken: {
    type: String,
  },
  passwordResetExpires: {
    type: Date,
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    min: [5, 'required minimum 5 characters'],
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Password is required'],
    validate: {
      //*this is only gonna work on create or save!!! , this is the reason whenever we update an user we save it as well orelse if you update the field validation is not applied
      //*this validation only works for post req inorder to make it work for upadate we need to save it
      validator: function (el) {
        return el === this.password;
      },
      message: 'Confirm password must be same as password',
    },
  },
  passwordModifiedAt: {
    type: Date,
  },
  active:{
    type:Boolean,
    default:true,
    select:false
  }
});

//*document middleware for password encription
//*we use bcrypt for encription this algorithm first salts and then encryptes the password this helps us in brutforce attacks
//*salting adds a random string to the password by which no two same passwords will have same have hash key

userSchema.pre('save', async function (next) {
  //*only run if password was created or modified
  if (!this.isModified('password')) return next();
  //*encrypting password with hash algo with cost of 12x
  this.password = await bcrypt.hash(this.password, 12); //*hashing with salting cost of 12 you can use 14 but this is a cpu intensive thing read more abt bcrypt
  //*deleting confirmPassword field
  this.passwordConfirm = undefined;

  next();
});
userSchema.pre('save',function(next){//*in order to update this passwordmodified field you need not to specify .save() here becoz this middleware runs before saving the doc itself 
  if(!this.isModified('password') || this.isNew) return next()
  this.passwordModifiedAt = Date.now() - 1000
  next()
})
userSchema.pre(/^find/,function(next){//*this is current query(find,findById,......)
  this.find({active:{$ne:false}})//*this is like a filter for getting onlt active property to true
  // this.active = undefined
  next()
})

//*this  is a instance method applicable for all documents autometically
userSchema.methods.correctPassword = async function (
  reqBodyPassword,
  dbPassword
) {
  return await bcrypt.compare(reqBodyPassword, dbPassword);
};

userSchema.methods.changedPasswordAfter = function (timestamp) {
  if (this.passwordModifiedAt) {
    const modifiedTimestamp = parseInt(
      this.passwordModifiedAt.getTime() / 1000,
      10
    );
    // console.log(timestamp,modifiedTimestamp)
    // console.log(modifiedTimestamp>timestamp)
    return modifiedTimestamp >  timestamp ; //100<200
  }
  return false;
};
userSchema.methods.passwordResetTokenGenerate = function () {
  const resetToken = crypto.randomBytes(32).toString('hex'); //*toSring('hex')->converts buffer created by randomBytes(sizeof random buffer) to a hexadecimal string
  //* just like password we should never store a plane reset token in the data base if hacker gets acess to the data base then he can use that resest token to change the password insted of user doing it
  //*so lets encrypt it but this does  not need any cryptographically strong
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  // console.log({resetToken},this.passwordResetToken)
  this.passwordResetExpires = Date.now() + 10*60*1000
  // console.log(resetToken)
  return resetToken;
};

const UserModel = mongoose.model('Users', userSchema);

module.exports = UserModel;
