import * as Koa from "koa";
import { AzureBlobContainer } from "../lib/AzureBlobContainer";
import { AzureBlobService } from "../lib/AzureBlobService";
import { User } from "../lib/User";
import { Logger } from "../Logger";
const cacheManager = require("cache-manager");

const ONE_HOUR = 1 * 60 * 60;
const memoryCache = cacheManager.caching({ store: "memory", max: 100, ttl: ONE_HOUR });

export class ContainersController {
  public static async index(ctx: Koa.Context) {
    const containers: AzureBlobContainer[] = await ContainersController.getAllContainers(ctx);
    ctx.response.body = containers;
  }

  public static async show(ctx: Koa.Context, name: string) {
    const containers: AzureBlobContainer[] = await ContainersController.getAllContainers(ctx);
    const match = containers.find(container => !!container.name.match(new RegExp(name, "i")));

    if (match) {
      ctx.response.body = match;
    } else {
      ctx.response.status = 404;
    }
  }

  public static async blobs(ctx: Koa.Context, name: string) {
    const containers: AzureBlobContainer[] = await ContainersController.getAllContainers(ctx);
    const match = containers.find(container => !!container.name.match(new RegExp(name, "i")));

    if (match) {
      const blobs = await match.getBlobs();
      ctx.response.body = blobs;
    } else {
      ctx.response.status = 404;
    }
  }

  public static async labels(ctx: Koa.Context, name: string) {
    const containers: AzureBlobContainer[] = await ContainersController.getAllContainers(ctx);
    const match = containers.find(container => !!container.name.match(new RegExp(name, "i")));

    if (match) {
      const labels = await match.getLabels();
      ctx.response.body = labels;
    } else {
      ctx.response.status = 404;
    }
  }

  private static async getAllContainers(ctx: Koa.Context): Promise<AzureBlobContainer[]> {
    const containers: AzureBlobContainer[] = [];
    try {
      containers.push(...(await AzureBlobService.getConfigContainers()));
      const user = await User.getUser(ctx.state.user.email);
      if (user) {
        for (const account of user.storageAccounts || []) {
          const userContainers = memoryCache.wrap(
            `getAllContainers-user-${ctx.state.user.email}`,
            () => {
              const service = new AzureBlobService(account.name, account.accessKey);
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
