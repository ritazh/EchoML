import S3Type from "aws-sdk/clients/s3";
import { IAzureBlobContainer } from "./AzureBlobContainer";
import { Label } from "./Label";
import { S3BlobFile } from "./S3BlobFile";
import { S3BlobService } from "./S3BlobService";

/**
 * An S3BlobContainer is a top-level S3 folder in a bucket, in an attempt to mimic Azure's "Container" hierarchy.
 */
export class S3BlobContainer implements IAzureBlobContainer {
  public service: () => S3BlobService;
  public name: string;
  public lastModified: string;
  public account: string;
  private s3Service: S3Type;

  constructor(service: S3BlobService, containerName: string, bucketName: string) {
    this.service = () => service;
    this.name = containerName;
    this.s3Service = service.service();

    this.name = containerName;
    this.lastModified = "__NA__";
    this.account = bucketName;
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

  public async getBlobs(): Promise<S3BlobFile[]> {
    return new Promise<S3BlobFile[]>((resolve, reject) => {
      const params = {
        Bucket: this.account,
        Prefix: this.name,
      };
      this.s3Service.listObjectsV2(params, (err, result) => {
        if (err) {
          return reject(err);
        }
        const results = (result.Contents || []).map(s3Object => new S3BlobFile(this, s3Object));
        resolve(results);
      });
    });
    // return Promise.resolve([]);
  }
}
