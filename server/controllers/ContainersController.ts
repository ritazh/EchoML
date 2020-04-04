import * as Koa from "koa";
import { S3BlobContainer } from "../lib/S3BlobContainer";
import { S3BlobService } from "../lib/S3BlobService";
import { User } from "../lib/User";
import { Logger } from "../Logger";
const cacheManager = require("cache-manager");

const ONE_HOUR = 1 * 60 * 60;
const memoryCache = cacheManager.caching({ store: "memory", max: 100, ttl: ONE_HOUR });

export class ContainersController {
  public static async index(ctx: Koa.Context) {
    const containers: S3BlobContainer[] = await ContainersController.getAllContainers(ctx);
    ctx.response.body = containers;
  }

  public static async show(ctx: Koa.Context, name: string) {
    const containers: S3BlobContainer[] = await ContainersController.getAllContainers(ctx);
    const match = containers.find(container => !!container.name.match(new RegExp(name, "i")));

    if (match) {
      ctx.response.body = match;
    } else {
      ctx.response.status = 404;
    }
  }

  public static async blobs(ctx: Koa.Context, name: string) {
    const containers: S3BlobContainer[] = await ContainersController.getAllContainers(ctx);
    const match = containers.find(container => !!container.name.match(new RegExp(name, "i")));

    if (match) {
      const blobs = await match.getBlobs();
      ctx.response.body = blobs;
    } else {
      ctx.response.status = 404;
    }
  }

  public static async labels(ctx: Koa.Context, name: string) {
    const containers: S3BlobContainer[] = await ContainersController.getAllContainers(ctx);
    const match = containers.find(container => !!container.name.match(new RegExp(name, "i")));

    if (match) {
      const labels = await match.getLabels();
      ctx.response.body = labels;
    } else {
      ctx.response.status = 404;
    }
  }

  private static async getAllContainers(ctx: Koa.Context): Promise<S3BlobContainer[]> {
    const containers: S3BlobContainer[] = [];
    try {
      containers.push(...(await S3BlobService.getConfigContainers()));
      const user = await User.getUser(ctx.state.user.email);
      if (user) {
        for (const account of user.storageAccounts || []) {
          const userContainers = memoryCache.wrap(
            `getAllContainers-user-${ctx.state.user.email}`,
            () => {
              const service = new S3BlobService(
                account.name,
                account.accessKey,
                account.endpoint || "",
              );
              return service.getContainers();
            },
          );
          containers.push(...userContainers);
        }
      }
    } catch (err) {
      Logger.logger.error(err);
    }
    return containers;
  }
}
