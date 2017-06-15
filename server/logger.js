const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');
const mkdirp = require('mkdirp');
const config = require('config');

const transports = [];

const logConfig = config.get('log');
if (logConfig) {
  if (logConfig.console) {
    transports.push(new winston.transports.Console(logConfig.console));
  }

  if (logConfig.file) {
    const logdir = path.dirname(logConfig.file.filename);
    mkdirp.sync(logdir);

    transports.push(new DailyRotateFile(logConfig.file));
  }
}

const logger = new winston.Logger({ transports });

module.exports = logger;
