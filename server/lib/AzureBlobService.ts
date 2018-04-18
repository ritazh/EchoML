import * as azure from "azure-storage";
import { Logger } from "../Logger";
import { AzureBlobContainer } from "./AzureBlobContainer";
import { Globals } from "./Globals";

export class AzureBlobService {
  public static getConfigService(): AzureBlobService | null {
    const [configAccount = null, configAccessKey = null] = [
      Globals.getEnvVar("STORAGE_ACCOUNT"),
      Globals.getEnvVar("STORAGE_ACCESS_KEY"),
    ];

    try {
      if (typeof configAccount === "string" && typeof configAccessKey === "string") {
        const service = new AzureBlobService(configAccount, configAccessKey);
        return service;
      }
    } catch (err) {
      Logger.logger.error(err);
    }

    return null;
  }

  public static async getConfigContainers(): Promise<AzureBlobContainer[]> {
    const containers: AzureBlobContainer[] = [];
    try {
      const service = AzureBlobService.getConfigService();
      if (service) {
        containers.push(...(await service.getContainers()));
      }
    } catch (err) {
      Logger.logger.error(err);
    }

    return containers;
  }

  public name: string;
  public accessKey: string;
  public service: () => azure.BlobService;

  constructor(name: string, accessKey: string) {
    this.name = name;
    this.accessKey = accessKey;
    this.service = () => azure.createBlobService(name, accessKey);
  }

  public async getContainers(): Promise<AzureBlobContainer[]> {
    const containers: AzureBlobContainer[] = [];
    let continuationToken: azure.common.ContinuationToken | null = null;
    try {
      do {
        const result: azure.BlobService.ListContainerResult = await this.getListContainerResult(
          continuationToken as azure.common.ContinuationToken,
        );
        for (const container of result.entries) {
          containers.push(new AzureBlobContainer(this, container));
        }
        continuationToken = result.continuationToken;
      } while (continuationToken);
    } catch (err) {
      Logger.logger.error(err);
      return [];
    }

    return containers;
  }

  private async getListContainerResult(token: azure.common.ContinuationToken) {
    return new Promise<azure.BlobService.ListContainerResult>((resolve, reject) => {
      this.service().listContainersSegmented(token, (err, result) => {
        if (err) {
          return reject(err);
        }
        return resolve(result);
      });
    });
  }
}
