import * as config from "config";
import * as mongoose from "mongoose";
import { Logger } from "../Logger";

export class Database {
  public static url: string = config.get("mongo.url");
  public static getConnection(): mongoose.Connection {
    if (!Database.connection) {
      (mongoose as any).Promise = global.Promise;
      mongoose.connect(Database.url, { promiseLibrary: global.Promise });
      Database.connection = mongoose.connection;
      Database.connection.on("error", err => {
        Logger.getLogger().error(err);
      });
    }
    return Database.connection;
  }
  private static connection: mongoose.Connection | null = null;
}
