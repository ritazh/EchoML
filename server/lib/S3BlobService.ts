const S3 = require("aws-sdk/clients/s3");
import S3Type from "aws-sdk/clients/s3";
import { AWSError } from "aws-sdk/lib/error";
import { Logger } from "../Logger";
import { Globals } from "./Globals";
import { S3BlobContainer } from "./S3BlobContainer";

export class S3BlobService {
  public static getConfigService(): S3BlobService {
    const [secret = null, configAccessKey = null, endpoint = null] = [
      Globals.getEnvVar("S3_STORAGE_SECRET_KEY"),
      Globals.getEnvVar("S3_STORAGE_ACCESS_KEY"),
      Globals.getEnvVar("S3_ENDPOINT"),
    ];

    if (typeof secret === "string" && typeof configAccessKey === "string") {
      const service = new S3BlobService(secret, configAccessKey, endpoint);
      return service;
    }
    throw new Error("AWS not configured with proper access key and secret");
  }

  public static async getConfigContainers(): Promise<S3BlobContainer[]> {
    const containers: S3BlobContainer[] = [];
    try {
      const service = S3BlobService.getConfigService();
      if (service) {
        containers.push(...(await service.getContainers()));
      }
    } catch (err) {
      Logger.logger.error(err);
    }

    return containers;
  }

  public name: string;
  public service: () => S3Type;
  public endpoint: string | null;

  constructor(secret: string, accessKey: string, endpoint: string | null) {
    this.endpoint = endpoint;
    this.name = "__NA__";
    this.service = () =>
      new S3({
        endpoint,
        accessKeyId: accessKey,
        secretAccessKey: secret,
      });
  }

  public async getContainers(): Promise<S3BlobContainer[]> {
    return this.getBuckets().then(bucketNames => {
      return Promise.all(
        bucketNames.map(bucketName => {
          const query = {
            Bucket: bucketName || "",
            Delimiter: "/",
          };
          return new Promise<S3BlobContainer[]>((resolve, reject) => {
            this.service().listObjectsV2(query, (err, results) => {
              if (err) {
                return reject(err);
              }
              const containers = (results.CommonPrefixes || []).map(
                prefix => new S3BlobContainer(this, prefix.Prefix || "__NA__", bucketName),
              );
              return resolve(containers);
            });
          });
        }),
      ).then(containerLists => containerLists.reduce((acc, val) => acc.concat(val)));
    });
  }

  private async getBuckets(): Promise<string[]> {
    return new Promise<string[]>((resolve, reject) => {
      this.service().listBuckets((err: AWSError, data: S3Type.ListBucketsOutput) => {
        if (err) {
          console.error(err, err.stack);
          return reject(err);
        }

        return resolve((data.Buckets || []).map(bucket => bucket.Name || "__NA__"));
      });
    });
  }
}
