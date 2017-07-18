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
const fs = require("fs");
const mkdirp = require("mkdirp");
class File {
    constructor(container, file) {
        this.container = container;
        this.file = file;
        this.name = file.name;
        this.size = file.size;
    }
    /**
     * Download the file locally and returns a promise to the relative path for the file
     */
    download() {
        return __awaiter(this, void 0, void 0, function* () {
            const filesDir = `files/${this.container.name}`;
            const filePath = `${filesDir}/${this.name}`;
            if (!fs.existsSync(filesDir)) {
                mkdirp.sync(filesDir);
            }
            return new Promise((resolve, reject) => {
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
        });
    }
    getName() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise(resolve => resolve(this.file.name));
        });
    }
    getSize() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise(resolve => resolve(this.file.size));
        });
    }
}
exports.File = File;
//# sourceMappingURL=File.js.map