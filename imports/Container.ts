import { IFile, File } from "./File";

export interface IContainer {
  name: string;
  files: Promise<IFile[]>;
}

export class Container implements IContainer {
  private static containers: IContainer[] = [];

  public static async getContainers(client: any): Promise<IContainer[]> {
    return new Promise<IContainer[]>((resolve, reject) => {
      if (Container.containers.length <= 0) {
        client.getContainers((err: Error, containers: Array<{}>) => {
          if (err) {
            reject([]);
          } else {
            const models: IContainer[] = containers.map(
              container => new Container(container)
            );
            Container.containers = models;
          }
        });
      }
      resolve(Container.containers);
    });
  }

  public name: string;
  public files: Promise<IFile[]>;
  private container: { client: any; name: string };

  constructor(container: any) {
    this.container = container;
    this.getName().then(name => (this.name = name));
    this.files = this.getFiles();
  }

  private async getFiles(): Promise<IFile[]> {
    return new Promise<IFile[]>((resolve, reject) => {
      this.container.client.getFiles(
        this.container,
        (err: Error, files: Array<{}>) => {
          if (err) {
            reject([]);
          } else {
            const models: IFile[] = files.map(file => new File(this, file));
            resolve(models);
          }
        }
      );
    });
  }

  private async getName(): Promise<string> {
    return new Promise<string>(resolve => {
      resolve(this.container.name);
    });
  }
}
