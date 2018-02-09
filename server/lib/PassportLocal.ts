import * as KoaPassport from "koa-passport";
import { Strategy as LocalStrategy } from "passport-local";
import { User } from "./User";

export class PassportLocal {
  public static getPassport() {
    const passport = KoaPassport;
    // =========================================================================
    // passport session setup ==================================================
    // =========================================================================
    // required for persistent login sessions
    // passport needs ability to serialize and unserialize users out of session

    // used to serialize the user for the session
    passport.serializeUser((user, done) => {
      done(null, user.id);
    });

    // used to deserialize the user
    passport.deserializeUser((id, done) => {
      User.getModel().findById(id, (err, user) => {
        done(err, user);
      });
    });

    // =========================================================================
    // LOCAL SIGNUP ============================================================
    // =========================================================================
    passport.use(
      "local-signup",
      new LocalStrategy(
        {
          // by default, local strategy uses username and password, we will override with email
          passReqToCallback: true, // allows us to pass back the entire request to the callback
          passwordField: "password",
          usernameField: "email",
        },
        (_, email, password, done) => {
          // asynchronous
          // User.findOne wont fire unless data is sent back
          process.nextTick(() => {
            // find a user whose email is the same as the forms email
            // we are checking to see if the user trying to login already exists
            User.getModel().findOne({ email }, (err, user) => {
              // if there are any errors, return the error
              if (err) {
                return done(err);
              }

              // check to see if theres already a user with that email
              if (user) {
                return done(null, false, { message: "That email is already taken." });
              }
              // if there is no user with that email
              // create the user
              const newUser = new (User.getModel())();

              // set the user's local credentials
              newUser.set("email", email);
              User.generateHash(password).then(hashed => {
                newUser.set("password", hashed);
                // save the user
                return newUser.save(userSaveErr => {
                  // if (err) throw err;
                  if (userSaveErr) {
                    return done(userSaveErr);
                  }
                  return done(null, newUser, {
                    message: "Successfully registered new user",
                  });
                });
              });
            });
          });
        },
      ),
    );

    // =========================================================================
    // LOCAL LOGIN =============================================================
    // =========================================================================
    passport.use(
      "local-login",
      new LocalStrategy(
        {
          // by default, local strategy uses username and password, we will override with email
          passReqToCallback: true, // allows us to pass back the entire request to the callback
          passwordField: "password",
          usernameField: "email",
        },
        (_, email, password, done) => {
          // callback with email and password from our form

          // find a user whose email is the same as the forms email
          // we are checking to see if the user trying to login already exists
          User.getModel().findOne({ email }, (err, user) => {
            // if there are any errors, return the error before anything else
            if (err) {
              return done(err);
            }

            // if no user is found, return the message
            if (!user) {
              return done(null, false, { message: "Email not found" });
            }

            // if the user is found but the password is wrong
            User.checkPassword(password, user.password).then(isValid => {
              if (!isValid) {
                return done(null, false, { message: "Incorrect password" });
              }
              // all is well, return successful user
              return done(null, user, { message: "Successfully logged in" });
            });
          });
        },
      ),
    );

    return passport;
  }
}
