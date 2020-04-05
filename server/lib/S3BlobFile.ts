import S3Type from "aws-sdk/clients/s3";
import axios from "axios";
import { promisify } from "util";
import { IAzureBlobFile } from "./AzureBlobFile";
import { ILabel, Label } from "./Label";
import { S3BlobContainer } from "./S3BlobContainer";

import * as fs from "fs";
import * as mkdirp from "mkdirp";
import * as path from "path";

export class S3BlobFile implements IAzureBlobFile {
  public static async download(s3Service: S3Type, container: string, filename: string) {
    const filepath = `files/${container}/${filename}`;
    const dirname = path.dirname(filepath);

    // Create directory if it doesn't exist
    const directoryExists: boolean = await promisify(fs.exists)(dirname);
    if (!directoryExists) {
      await promisify(mkdirp)(dirname);
    }

    const downloadUrl = await S3BlobFile.getDownloadURL(s3Service, container, filename);
    const { data } = await axios.get<ArrayBuffer>(downloadUrl, { responseType: "arraybuffer" });
    const writeFile = promisify(fs.writeFile);
    await writeFile(filepath, data);
    return filepath;
  }

  public static async getDownloadURL(
    s3Service: S3Type,
    container: string,
    filename: string,
  ): Promise<string> {
    return s3Service.getSignedUrlPromise("getObject", {
      Bucket: container,
      Key: filename,
    });
  }
  public name: string;
  public contentType: string;
  public contentLength: string;
  public container: () => S3BlobContainer;

  constructor(container: S3BlobContainer, s3Object: S3Type.Object) {
    let fileName;
    let fileExtension = "wav";

    if (s3Object.Key) {
      const parts = s3Object.Key.split("/");
      fileName = parts[1].replace(/\\/, "");

      const extensionParts = s3Object.Key.split(".");
      fileExtension = extensionParts[extensionParts.length - 1];
    }

    this.name = fileName || "__NA__";
    this.contentType = `audio/${fileExtension}`;
    this.contentLength = s3Object.Size ? s3Object.Size.toString() : "__NA__";
    this.container = () => container;
  }

  public async getLabels(): Promise<ILabel[]> {
    const storageAccount = this.container().service().name;
    const container = this.container().name;
    return Label.getLabels(storageAccount, container, this.name);
  }

  public async downloadFile(): Promise<string> {
    const container = this.container().name;

    return S3BlobFile.download(
      this.container()
        .service()
        .service(),
      container,
      this.name,
    );
  }
}
