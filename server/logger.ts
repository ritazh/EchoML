import * as winston from "winston";
import * as path from "path";
import { mkdirp } from "fs-extra";
import * as config from "config";

const DailyRotateFile = require("winston-daily-rotate-file");
const transports: any[] = [];

if (config.has("logConfig")) {
  if (config.has("logConfig.console")) {
    const console = config.get("logConfig.console");
    transports.push(new winston.transports.Console(console));
  }

  if (config.has("logConfig.file.filename")) {
    const filename: string = config.get("logConfig.file.filename");
    const logdir = path.dirname(filename);
    mkdirp(logdir).then(() => {
      transports.push(new DailyRotateFile(config.get("logConfig.file")));
    });
  }
}

const logger = new winston.Logger({ transports });

export default logger;
