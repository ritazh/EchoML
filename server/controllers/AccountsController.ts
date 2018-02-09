import * as Koa from "koa";
import { AzureBlobService } from "../lib/AzureBlobService";
import { User } from "../lib/User";

export class AccountsController {
  public static async index(ctx: Koa.Context) {
    const user = await User.getUser(ctx.state.user.email);
    const accounts = [AzureBlobService.getConfigService()];
    if (user) {
      for (const account of user.storageAccounts) {
        accounts.push(new AzureBlobService(account.name, account.accessKey));
      }
    }
    ctx.response.body = accounts;
  }
}
