/* eslint-disable global-require */

const koa = require('koa');
const cors = require('koa-cors');
const bodyParser = require('koa-bodyparser');
const send = require('koa-send');
const session = require('koa-session');
const morgan = require('koa-morgan');
const config = require('config');
const fs = require('fs');
const logger = require('./logger');
const api = require('./api');
const mongoose = require('mongoose');
const passport = require('./passport')(require('koa-passport'));

function createServer(hostname, port) {
  const app = koa();
  // DB Config
  mongoose.connect(config.mongo.url);
  mongoose.connection.on('error', (err) => {
    logger.error(err);
  });

  const stream = {
    write(message) {
      logger.info(message.slice(0, -1));
    },
  };
  app.use(morgan.middleware('combined', { stream }));

  if (config.get('cors')) {
    app.use(cors({ credentials: true }));
  }

  if (config.get('serveStatic')) {
    app.use(require('koa-static')('dist'));
  }

  app.use(bodyParser());

  if (config.has('auth')) {
    app.keys = config.auth.keys;
    app.use(session(app));
    app.use(passport.initialize());
    app.use(passport.session());

    const whiteList = new Set(['/', '/favicon.ico', '/register']);
    app.use(function* auth(next) {
      const ctx = this;
      if (['/login'].includes(ctx.path)) {
        yield passport
          .authenticate('local-login', function* (err, user, info) {
            if (err) throw err;
            if (user === false) {
              ctx.status = 401;
              ctx.body = info;
            } else {
              yield ctx.login(user);
              ctx.body = info;
            }
          })
          .call(this, next);
      } else if (['/logout'].includes(ctx.path)) {
        ctx.logout();
        ctx.body = { success: true, message: 'Successfully logged out' };
      } else if (['/register'].includes(ctx.path)) {
        yield passport
          .authenticate('local-signup', function* (err, user, info) {
            if (err) throw err;
            if (user === false) {
              ctx.status = 401;
              ctx.body = info;
            } else {
              yield ctx.login(user);
              ctx.body = info;
            }
          })
          .call(this, next);
      } else if (ctx.isAuthenticated() || whiteList.has(ctx.path)) {
        // check if authenticated and proceed
        yield next;
      }
    });
  }

  api(app);

  app.use(function* index() {
    yield send(this, 'dist/index.html');
  });

  const envStr = process.env.NODE_ENV || 'development';
  let httpServer = null;

  if (fs.existsSync('cert')) {
    const options = {
      key: fs.readFileSync('cert/server.key'),
      cert: fs.readFileSync('cert/server.crt'),
    };
    httpServer = require('https').createServer(options, app.callback()).listen(port);
    logger.info(`server is started on ${hostname}:${port}(https) in ${envStr} mode`);
  } else {
    httpServer = app.listen(port, hostname);
    logger.info(`server is started on ${hostname}:${port} in ${envStr} mode`);
  }

  return httpServer;
}

module.exports = createServer;
