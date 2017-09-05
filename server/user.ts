import * as bcrypt from "bcrypt-nodejs";
import * as mongoose from "mongoose";

// =============================================================================
// Model =======================================================================
// =============================================================================
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, index: { unique: true }, lowercase: true },
  password: { type: String, required: true }
});

// Methods ====================================================================
// generating a hash
export function generateHash(password: string) {
  return bcrypt.hashSync(password, bcrypt.genSaltSync(8));
}

// checking if password is valid
export function validPassword(user: any, password: string) {
  return bcrypt.compareSync(password, user.password);
}

// create the model for users and expose it to our app
export const UserModel = mongoose.model("User", userSchema);

// =============================================================================
// Controller ==================================================================
// =============================================================================
export const controller: {
  [method: string]: (params: any) => Promise<any>;
} = {
  get: () =>
    new Promise((resolve, reject) => {
      UserModel.find({}, (err, users) => (err ? reject({ success: false, message: err.message }) : resolve(users)));
    }),
  post: params =>
    new Promise((resolve, reject) => {
      const newUser = new UserModel(params);
      newUser.save(err => (err ? reject({ success: false, message: err.message }) : resolve(newUser)));
    }),
  // put: () => new Promise((resolve, reject) => {}),
  delete: params =>
    new Promise((resolve, reject) => {
      UserModel.findOneAndRemove(
        { params },
        (err, user) => (err ? reject({ success: false, message: err.message }) : resolve(user))
      );
    })
};
