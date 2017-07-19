import { IFile, File } from "./File";

export interface IContainer {
  name: string; // custom name field
  files: Promise<IFile[]>; // custom files array
  /** pgkcloud container object */
  container: {
    Name: string;
    Url: string;
    Properties: {
      "Last-Modified": string;
      Etag: string;
    };
  };
}

/**
 * The expected container result type from the Azure BlobService.listContainersSegmented
 */
export interface IAzureContainer {
  name: string; // "echoml";
  lastModified: string; //"Mon, 10 Jul 2017 23:58:57 GMT";
  etag: string; // '"0x8D4C7EFA1041F1E"';
  lease: { status: string; state: string }; // { status: "unlocked"; state: "available" };
  publicAccessLevel: string | null; // "container";
}

export class Container implements IContainer {
  private static containers: IContainer[] = [];

  public static async getContainersAsync(client: any): Promise<IContainer[]> {
    return Container.getContainers(client);
  }

  public static getContainers(client: any): Promise<IContainer[]> {
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

  // public static convertToAzureContainer(container:IContainer): IAzureContainer {
  //   return {
  //     name: container.container.name,
  //     lastModified: container.container['Last-Modified'],
  //     etag: container.container.Properties.Etag,
  //     lease
  //   }
  // }

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
