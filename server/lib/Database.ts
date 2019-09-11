import * as mongoose from "mongoose";
import { Logger } from "../Logger";
import { Globals } from "./Globals";

export class Database {
  public static getConnection(): mongoose.Connection {
    const host = Globals.getEnvVar("MONGO_HOST");
    const user = Globals.getEnvVar("MONGO_USERNAME");
    const pass = Globals.getEnvVar("MONGO_PASSWORD");
    if (!Database.connection) {
      (mongoose as any).Promise = global.Promise;
      mongoose.connect(host, { useNewUrlParser: false, promiseLibrary: global.Promise, user, pass });
      Database.connection = mongoose.connection;
      Database.connection.on("error", err => {
        Logger.logger.error(err);
      });
    }
    return Database.connection;
  }

  private static connection: mongoose.Connection | null = null;
}
