import * as winston from "winston";
import * as path from "path";
import { mkdirp } from "fs-extra";
import * as config from "config";

const DailyRotateFile = require("winston-daily-rotate-file");
const transports: winston.TransportInstance[] = [];

if (config.has("log")) {
  if (config.has("log.console")) {
    const console = config.get("log.console");
    transports.push(new winston.transports.Console(console));
  }

  if (config.has("log.file.filename")) {
    const filename: string = config.get("log.file.filename");
    const logdir = path.dirname(filename);
    mkdirp(logdir).then(() => {
      transports.push(new DailyRotateFile(config.get("log.file")));
    });
  }
}

export default new winston.Logger({ transports });
