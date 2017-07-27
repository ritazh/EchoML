// @flow
const bcrypt = require('bcrypt-nodejs');
const mongoose = require('mongoose');

// =============================================================================
// Model =======================================================================
// =============================================================================
const userSchema = mongoose.Schema({
  email: { type: String, required: true, index: { unique: true }, lowercase: true },
  password: { type: String, required: true },
});

// Methods ====================================================================
// generating a hash
userSchema.methods.generateHash = password =>
  bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);

// checking if password is valid
userSchema.methods.validPassword = function (password) {
  return bcrypt.compareSync(password, this.password);
};

// create the model for users and expose it to our app
const UserModel = mongoose.model('User', userSchema);
module.exports.model = UserModel;

// =============================================================================
// Controller ==================================================================
// =============================================================================
module.exports.controller = {
  get: params =>
    new Promise((resolve, reject) => {
      UserModel.find(
        {},
        (err, users) => (err ? reject({ success: false, message: err.message }) : resolve(users)),
      );
    }),
  post: params =>
    new Promise((resolve, reject) => {
      const newUser = new UserModel(params);
      newUser.save(
        err => (err ? reject({ success: false, message: err.message }) : resolve(newUser)),
      );
    }),
  // put: () => new Promise((resolve, reject) => {}),
  delete: params =>
    new Promise((resolve, reject) => {
      UserModel.deleteOne(
        { params },
        (err, user) => (err ? reject({ success: false, message: err.message }) : resolve(user)),
      );
    }),
};
