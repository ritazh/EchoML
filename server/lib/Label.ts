import * as mongoose from "mongoose";
import { AzureBlobFile } from "./AzureBlobFile";

export interface ILabel extends mongoose.Document {
  start: number;
  end: number;
  label: string;
  docUrl: string;
}

export class Label {
  public static async getLabels(
    account: string,
    container: string,
    filename: string,
  ): Promise<ILabel[]> {
    const docUrl = AzureBlobFile.getDownloadURL(account, container, filename);
    const labels = await Label.getModel()
      .find({ docUrl })
      .exec();
    return labels;
  }

  public static async deleteLabels(
    account: string,
    container: string,
    filename: string,
  ): Promise<void> {
    const docUrl = AzureBlobFile.getDownloadURL(account, container, filename);
    return Label.getModel()
      .remove({ docUrl })
      .exec();
  }

  public static async addLabels(
    account: string,
    container: string,
    filename: string,
    labels: ILabel[],
  ): Promise<ILabel[]> {
    const docUrl = AzureBlobFile.getDownloadURL(account, container, filename);
    const docs = labels.map(label => ({
      docUrl,
      end: label.end,
      label: label.label,
      start: label.start,
    }));

    return Label.getModel().insertMany(docs);
  }

  public static getModel(): mongoose.Model<ILabel> {
    if (!Label.model) {
      Label.model = mongoose.model("Label", Label.getSchema());
    }

    return Label.model;
  }

  public static getSchema(): mongoose.Schema {
    if (!Label.schema) {
      Label.schema = new mongoose.Schema({
        docUrl: { type: String, required: true },
        end: { type: Number, required: true },
        label: { type: String, required: false, default: "" },
        start: { type: Number, required: true },
      });
    }

    return Label.schema;
  }

  private static schema: mongoose.Schema | null = null;
  private static model: mongoose.Model<ILabel> | null = null;
}
