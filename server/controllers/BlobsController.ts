import * as Koa from "koa";
import * as send from "koa-send";
import { S3BlobFile } from "../lib/S3BlobFile";
import { S3BlobService } from "../lib/S3BlobService";
import { User } from "../lib/User";

const cacheManager = require("cache-manager");

const ONE_HOUR = 1 * 60 * 60;
const memoryCache = cacheManager.caching({ store: "memory", max: 100, ttl: ONE_HOUR });

export class BlobsController {
  public static async index(ctx: Koa.Context) {
    const user = await User.getUser(ctx.state.user.email);
    const files: S3BlobFile[] = [];
    if (user) {
      const accounts = user.storageAccounts.map(
        info => new S3BlobService(info.name, info.accessKey, info.endpoint || ""),
      );

      const containers = (
        await Promise.all([
          S3BlobService.getConfigContainers(),
          ...accounts.map(account => account.getContainers()),
        ])
      ).reduce((flat, list) => flat.concat(list), []);

      const blobs = (
        await Promise.all(
          containers.map(container => BlobsController.getBlobsForContainer(container)),
        )
      ).reduce((flat, list) => flat.concat(list), []);

      for (const blob of blobs) {
        files.push(blob);
      }
    }

    ctx.response.body = files;
  }

  public static async download(ctx: Koa.Context, account: string, filename: string) {
    try {
      const s3Service = S3BlobService.getConfigService().service();
      const filepath = await S3BlobFile.download(s3Service, account, filename);
      await send(ctx, filepath);
    } catch (err) {
      ctx.throw(err);
    }
  }

  private static getBlobsForContainer(container: any) {
    const containerKey = `getBlobsForContainer-${container.account}-${container.name}`;
    return memoryCache.wrap(containerKey, () => {
      return container.getBlobs();
    });
  }
}
