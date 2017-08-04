// @flow
const LocalStrategy = require('passport-local').Strategy;
const User = require('./user').model;

module.exports = (passport /* :Function*/) => {
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
    User.findById(id, (err, user) => {
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
        usernameField: 'email',
        passwordField: 'password',
        passReqToCallback: true, // allows us to pass back the entire request to the callback
      },
      (req, email, password, done) => {
        // asynchronous
        // User.findOne wont fire unless data is sent back
        process.nextTick(() => {
          // find a user whose email is the same as the forms email
          // we are checking to see if the user trying to login already exists
          User.findOne({ email }, (err, user) => {
            // if there are any errors, return the error
            if (err) return done(err);

            // check to see if theres already a user with that email
            if (user) {
              return done(null, false, { success: false, message: 'That email is already taken.' });
            }
            // if there is no user with that email
            // create the user
            const newUser = new User();

            // set the user's local credentials
            newUser.email = email;
            newUser.password = newUser.generateHash(password);

            // save the user
            return newUser.save((userSaveErr) => {
              // if (err) throw err;
              if (userSaveErr) return done(userSaveErr);
              return done(null, newUser, {
                sucess: true,
                message: 'Successfully registered new user',
                user: newUser,
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
        usernameField: 'email',
        passwordField: 'password',
        passReqToCallback: true, // allows us to pass back the entire request to the callback
      },
      (req, email, password, done) => {
        // callback with email and password from our form

        // find a user whose email is the same as the forms email
        // we are checking to see if the user trying to login already exists
        User.findOne({ email }, (err, user) => {
          // if there are any errors, return the error before anything else
          if (err) return done(err);

          // if no user is found, return the message
          if (!user) {
            return done(null, false, { success: false, message: 'Email not found' });
          }

          // if the user is found but the password is wrong
          if (!user.validPassword(password)) {
            return done(null, false, { success: false, message: 'Incorrect password' });
          } // create the loginMessage and save it to session as flashdata

          // all is well, return successful user
          return done(null, user, { success: true });
        });
      },
    ),
  );

  return passport;
};
