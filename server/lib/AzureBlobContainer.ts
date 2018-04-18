import * as azure from "azure-storage";
import { Logger } from "../Logger";
import { AzureBlobFile } from "./AzureBlobFile";
import { AzureBlobService } from "./AzureBlobService";
import { Label } from "./Label";

export interface IAzureBlobContainer {
  account: string;
  name: string;
  lastModified: string;
  // storageAccount: string;
}

export class AzureBlobContainer implements IAzureBlobContainer {
  public account: string;
  public name: string;
  public lastModified: string;
  // public storageAccount: string;
  public container: () => azure.BlobService.ContainerResult;
  public service: () => AzureBlobService;

  constructor(service: AzureBlobService, container: azure.BlobService.ContainerResult) {
    this.service = () => service;
    this.container = () => container;
    this.lastModified = container.lastModified;
    this.account = service.name;
    this.name = container.name;
  }

  public async getBlobs(): Promise<AzureBlobFile[]> {
    const blobs: AzureBlobFile[] = [];
    let continuationToken: azure.common.ContinuationToken | null = null;
    try {
      do {
        const result: azure.BlobService.ListBlobsResult = await this.getListBlobResult(
          continuationToken as azure.common.ContinuationToken,
        );
        for (const blob of result.entries) {
          blobs.push(new AzureBlobFile(this, blob));
        }
        continuationToken = result.continuationToken as azure.common.ContinuationToken;
      } while (continuationToken);
    } catch (err) {
      Logger.logger.error(err);
      return [];
    }

    return blobs;
  }

  public async getLabels(): Promise<Label[]> {
    const blobs = await this.getBlobs();
    const labels = await Promise.all(blobs.map(blob => blob.getLabels()));
    let flattend: Label[] = [];
    for (const labelList of labels) {
      flattend = flattend.concat(labelList);
    }
    return flattend;
  }

  private async getListBlobResult(
    token: azure.common.ContinuationToken,
  ): Promise<azure.BlobService.ListBlobsResult> {
    return new Promise<azure.BlobService.ListBlobsResult>((resolve, reject) => {
      this.service()
        .service()
        .listBlobsSegmented(this.name, token, (err, result) => {
          if (err) {
            return reject(err);
          }
          return resolve(result);
        });
    });
  }
}
