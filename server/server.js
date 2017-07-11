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
const mongoose = require("mongoose");

function createServer(hostname, port) {
  const app = koa();
  /**
   * Connect to database
   */
  mongoose.connect(config.mongo.url);
  mongoose.connection.on("error", function(err) {
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

    const whiteList = new Set(['/', '/favicon.ico']);
    app.use(function* authHandler(next) {
      if (this.path === '/login') {
        if (this.request.body.account === config.auth.account
          && this.request.body.password === config.auth.password) {
          this.session.login = config.auth.account;
          this.body = JSON.stringify({ result: 'success' });
        } else {
          this.session.login = '';
          this.body = JSON.stringify({ result: 'fail' });
        }
      } else if (this.path === '/logout') {
        this.session.login = '';
        this.body = JSON.stringify({ result: 'success' });
      } else if (this.session.login === config.auth.account
        || whiteList.has(this.path)) {
        yield next;
      } else {
        this.status = 401;
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
