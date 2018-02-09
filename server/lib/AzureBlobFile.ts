import axios from "axios";
import * as azure from "azure-storage";
import * as fs from "fs";
import * as mkdirp from "mkdirp";
import * as path from "path";
import { promisify } from "util";
import { Logger } from "../Logger";
import { AzureBlobContainer } from "./AzureBlobContainer";
import { ILabel, Label } from "./Label";

export interface IAzureBlobFile {
  name: string;
  isDirectory: boolean;
  size: string;
  mtime: string;
  contentType: string;
  contentLength: string;
  path: string;
}

export class AzureBlobFile implements IAzureBlobFile {
  public static async download(account: string, container: string, filename: string) {
    const filepath = `files/${account}/${container}/${filename}`;
    const dirname = path.dirname(filepath);

    // Create directory if it doesn't exist
    const directoryExists: boolean = await promisify(fs.exists)(dirname);
    if (!directoryExists) {
      await promisify(mkdirp)(dirname);
    }

    const downloadUrl = AzureBlobFile.getDownloadURL(account, container, filename);
    const { data } = await axios.get<ArrayBuffer>(downloadUrl, { responseType: "arraybuffer" });
    const writeFile = promisify(fs.writeFile);
    await writeFile(filepath, data);
    return filepath;
  }

  public static getDownloadURL(account: string, container: string, filename: string): string {
    const url = `https://${account}.blob.core.windows.net/${container}/${filename}`;
    return url;
  }

  public name: string;
  public isDirectory: boolean;
  public size: string;
  public mtime: string;
  public contentType: string;
  public contentLength: string;
  public path: string;
  public container: () => AzureBlobContainer;
  public blob: () => azure.BlobService.BlobResult;

  constructor(container: AzureBlobContainer, blob: azure.BlobService.BlobResult) {
    this.container = () => container;
    this.name = blob.name;
    this.contentType = (blob.contentSettings || {}).contentType || "";
    this.contentLength = blob.contentLength;
    this.blob = () => blob;
  }

  public getDownloadURL(): string {
    const storageAccount = this.container().service().name;
    const container = this.container().name;
    const url = AzureBlobFile.getDownloadURL(storageAccount, container, this.name);

    return url;
  }

  public async getLabels(): Promise<ILabel[]> {
    const storageAccount = this.container().service().name;
    const container = this.container().name;
    return Label.getLabels(storageAccount, container, this.name);
  }

  public async downloadFile(): Promise<string> {
    const storageAccount = this.container().service().name;
    const container = this.container().name;

    return AzureBlobFile.download(storageAccount, container, this.name);
  }
}
