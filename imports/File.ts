import { IContainer } from "./Container";
import * as fs from "fs";
import * as mkdirp from "mkdirp";

export interface IFile {
  name: string;
  size: number;
  container: IContainer;
  download: () => Promise<string>;
}

export class File implements IFile {
  private file: { name: string; size: number; client: any };
  public name: string;
  public size: number;
  public container: IContainer;

  constructor(container: IContainer, file: any) {
    this.container = container;
    this.file = file;
    this.name = file.name;
    this.size = file.size;
  }

  /**
   * Download the file locally and returns a promise to the relative path for the file
   */
  public async download(): Promise<string> {
    const filesDir = `files/${this.container.name}`;
    const filePath = `${filesDir}/${this.name}`;

    if (!fs.existsSync(filesDir)) {
      mkdirp.sync(filesDir);
    }
    return new Promise<string>((resolve, reject) => {
      const writeStream = fs.createWriteStream(filePath);
      writeStream
        .on("finish", () => {
          resolve(filePath);
        })
        .on("error", () => {
          reject("");
        });

      this.file.client
        .download({
          container: this.container.name,
          remote: this.name
        })
        .pipe(writeStream);
    });
  }

  private async getName(): Promise<string> {
    return new Promise<string>(resolve => resolve(this.file.name));
  }

  private async getSize(): Promise<number> {
    return new Promise<number>(resolve => resolve(this.file.size));
  }
}
