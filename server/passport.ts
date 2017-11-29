import * as Passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { generateHash, UserModel as User, validPassword } from './user';

// module.exports = (passport: Passport.Passport) => {
export default (passport: Passport.Passport) => {
  // =========================================================================
  // passport session setup ==================================================
  // =========================================================================
  // required for persistent login sessions
  // passport needs ability to serialize and unserialize users out of session

  // used to serialize the user for the session
  passport.serializeUser((user: Passport.Profile, done) => {
    done(null, user.id);
  });

  // used to deserialize the user
  passport.deserializeUser((id, done) => {
    User.findById(id, (err, user: Passport.Profile) => {
      done(err, user);
    });
  });

  // =========================================================================
  // LOCAL SIGNUP ============================================================
  // =========================================================================
  passport.use(
    'local-signup',
    new LocalStrategy(
      {
        // by default, local strategy uses username and password, we will override with email
        passReqToCallback: true, // allows us to pass back the entire request to the callback
        passwordField: 'password',
        usernameField: 'email',
      },
      (_, email, password, done) => {
        // asynchronous
        // User.findOne wont fire unless data is sent back
        process.nextTick(() => {
          // find a user whose email is the same as the forms email
          // we are checking to see if the user trying to login already exists
          User.findOne({ email }, (err, user) => {
            // if there are any errors, return the error
            if (err) {
              return done(err);
            }

            // check to see if theres already a user with that email
            if (user) {
              return done(null, false, { message: 'That email is already taken.' });
            }
            // if there is no user with that email
            // create the user
            const newUser = new User();

            // set the user's local credentials
            newUser.set('email', email);
            newUser.set('password', generateHash(password));

            // save the user
            return newUser.save(userSaveErr => {
              // if (err) throw err;
              if (userSaveErr) {
                return done(userSaveErr);
              }
              return done(null, newUser, {
                message: 'Successfully registered new user',
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
    'local-login',
    new LocalStrategy(
      {
        // by default, local strategy uses username and password, we will override with email
        passReqToCallback: true, // allows us to pass back the entire request to the callback
        passwordField: 'password',
        usernameField: 'email',
      },
      (_, email, password, done) => {
        // callback with email and password from our form

        // find a user whose email is the same as the forms email
        // we are checking to see if the user trying to login already exists
        User.findOne({ email }, (err, user) => {
          // if there are any errors, return the error before anything else
          if (err) {
            return done(err);
          }

          // if no user is found, return the message
          if (!user) {
            return done(null, false, { message: 'Email not found' });
          }

          // if the user is found but the password is wrong
          if (!validPassword(user, password)) {
            return done(null, false, { message: 'Incorrect password' });
          } // create the loginMessage and save it to session as flashdata

          // all is well, return successful user
          return done(null, user, { message: 'Successfully logged in' });
        });
      },
    ),
  );

  return passport;
};
