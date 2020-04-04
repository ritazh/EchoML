import * as Koa from "koa";
import { S3BlobService } from "../lib/S3BlobService";
import { User } from "../lib/User";

export class AccountsController {
  public static async index(ctx: Koa.Context) {
    const user = await User.getUser(ctx.state.user.email);
    const accounts = [S3BlobService.getConfigService()];
    if (user) {
      for (const account of user.storageAccounts) {
        accounts.push(new S3BlobService(account.name, account.accessKey, account.endpoint || ""));
      }
    }
    ctx.response.body = accounts;
  }
}
