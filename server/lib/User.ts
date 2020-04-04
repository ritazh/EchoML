import * as bcrypt from "bcrypt";
import * as mongoose from "mongoose";
import { promisify } from "util";
import { Logger } from "../Logger";

export interface IUser extends mongoose.Document {
  email: string;
  password: string;
  storageAccounts: Array<{ name: string; accessKey: string; endpoint?: string }>;
}

export class User {
  public static async getUser(email: string) {
    return User.getModel()
      .findOne({ email })
      .exec();
  }

  public static async generateHash(
    password: string,
    saltRounds: number = 10,
  ): Promise<string | null> {
    const hash = promisify(bcrypt.hash);
    try {
      const hashed = await hash(password, saltRounds);
      return hashed;
    } catch (err) {
      Logger.logger.error(err);
      return null;
    }
  }

  public static async checkPassword(password: string, hashed: string): Promise<boolean> {
    const compare = promisify(bcrypt.compare);
    try {
      const isValid = await compare(password, hashed);
      return isValid;
    } catch (err) {
      Logger.logger.error(err);
      return false;
    }
  }

  public static getModel(): mongoose.Model<IUser> {
    if (!User.model) {
      User.model = mongoose.model("User", User.getSchema());
    }

    return User.model;
  }

  public static getSchema(): mongoose.Schema {
    if (!User.schema) {
      User.schema = new mongoose.Schema({
        email: { type: String, required: true, index: { unique: true }, lowercase: true },
        password: { type: String, required: true },
        storageAccounts: [
          {
            accessKey: { type: String, trim: true },
            name: { type: String, trim: true },
          },
        ],
      });
    }

    return User.schema;
  }

  private static schema: mongoose.Schema | null = null;
  private static model: mongoose.Model<IUser> | null = null;
}
