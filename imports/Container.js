"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const File_1 = require("./File");
class Container {
    constructor(container) {
        this.container = container;
        this.getName().then(name => (this.name = name));
        this.files = this.getFiles();
    }
    static getContainersAsync(client) {
        return __awaiter(this, void 0, void 0, function* () {
            return Container.getContainers(client);
        });
    }
    static getContainers(client) {
        return new Promise((resolve, reject) => {
            if (Container.containers.length <= 0) {
                client.getContainers((err, containers) => {
                    if (err) {
                        reject([]);
                    }
                    else {
                        const models = containers.map(container => new Container(container));
                        Container.containers = models;
                    }
                });
            }
            resolve(Container.containers);
        });
    }
    getFiles() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                this.container.client.getFiles(this.container, (err, files) => {
                    if (err) {
                        reject([]);
                    }
                    else {
                        const models = files.map(file => new File_1.File(this, file));
                        resolve(models);
                    }
                });
            });
        });
    }
    getName() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise(resolve => {
                resolve(this.container.name);
            });
        });
    }
}
Container.containers = [];
exports.Container = Container;
//# sourceMappingURL=Container.js.map