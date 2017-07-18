import { IFile } from './File';
export interface IContainer {
    name: string;
    files: Promise<Array<IFile>>;
}
export default class Container {
    name: Promise<string>;
    files: Promise<IFile[]>;
    private container;
    constructor(container: any);
    getFiles(): Promise<IFile[]>;
    getName(): Promise<string>;
    static getContainers(client: any): Promise<{}>;
}
