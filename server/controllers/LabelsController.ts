import * as Koa from "koa";
import { AzureBlobFile } from "../lib/AzureBlobFile";
import { Label } from "../lib/Label";

export class LabelsController {
  public static async index(ctx: Koa.Context) {
    const labels = await Label.getModel()
      .find()
      .exec();
    ctx.response.body = labels;
  }

  public static async show(ctx: Koa.Context, account: string, container: string, filename: string) {
    try {
      const docUrl = AzureBlobFile.getDownloadURL(account, container, filename);
      const labels = await Label.getModel()
        .find({ docUrl })
        .exec();
      ctx.response.body = labels;
    } catch (err) {
      ctx.throw(err);
    }
  }

  public static async store(ctx: Koa.Context) {
    try {
      // White list valid POST params
      const { storageAccount, containerName, filename, labels } = ctx.request.body;
      if (storageAccount && containerName && filename && labels) {
        ctx.body = await Label.deleteLabels(storageAccount, containerName, filename);
        ctx.body = await Label.addLabels(storageAccount, containerName, filename, labels);
      } else {
        throw new Error("Invalid POST request");
      }
    } catch (err) {
      ctx.throw(err);
    }
  }
}
