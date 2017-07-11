const parse = require('co-busboy');
const sendfile = require('koa-sendfile');
const path = require('path');
const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs-extra'));
const azure = require('azure-storage');
const config = require('config');
const gm = require('gm');
const logger = require('./logger');
const util = require('./util');

Promise.promisifyAll(Object.getPrototypeOf(gm()));
const blobService = azure.createBlobService();
let containers = [];

function getFilePath(param) {
  logger.info(`param: ${param}`);

  const result = /(\d+)(.*)/.exec(param);
  logger.info(result);
  if (!result) {
    return null;
  }

  const containerIndex = parseInt(result[1], 10);
  const container = containers[containerIndex];
  if (!container) {
    return null;
  }

  let subdir = result[2];
  if (subdir.length > 0) {
    if (subdir[0] !== '/') {
      return null;
    }

    subdir = subdir.substr(1);
  }
  const path = subdir ? `${container.name}/${subdir}` : container.name;
  return path;
}

function getImageInfo(filepath) {
  const fileparts = [];
  fileparts[0] = filepath.substring(0, filepath.indexOf('/'));
  fileparts[1] = filepath.substring(filepath.indexOf('/') + 1);
  const info = {};
  return new Promise((resolve, reject) => {
    blobService.getBlobToStream(
      fileparts[0],
      fileparts[1],
      fs.createWriteStream('output.jpeg'),
      (error, result, response) => {
        if (!error) {
          const img = gm('output.jpeg');
          img.size((err, value) => {
            if (err) {
              reject(err);
              return;
            }

            info.size = value;
            img.orientation((err2, value2) => {
              if (err2) {
                reject(err2);
                return;
              }

              info.orientation = value2;
              resolve(info);
            });
          });
        }
      },
    );
  });
}
let blobs = [];

function aggregateContainers(err, result, cb) {
  if (err) {
    cb(err);
  } else {
    containers = containers.concat(result.entries);
    if (result.continuationToken !== null) {
      blobService.listContainersSegmented(result.continuationToken, aggregateContainers);
    } else {
      cb(null, containers);
    }
  }
}

function getContainersAsync() {
  containers = [];
  return new Promise((resolve, reject) => {
    blobService.listContainersSegmented(null, (err, result) => {
      aggregateContainers(err, result, (err, containers) => {
        if (err) {
          logger.warn(err);
          reject(err);
        } else {
          resolve(containers);
        }
      });
    });
  });
}

function aggregateBlobs(containerName, err, result, cb) {
  if (err) {
    cb(err);
  } else {
    blobs = blobs.concat(result.entries);
    if (result.continuationToken !== null) {
      blobService.listBlobsSegmented(containerName, result.continuationToken, aggregateBlobs);
    } else {
      cb(null, blobs);
    }
  }
}

function getBlobsAsync(containerName) {
  blobs = [];
  return new Promise((resolve, reject) => {
    blobService.listBlobsSegmented(containerName, null, (err, result) => {
      aggregateBlobs(containerName, err, result, (err, blobs) => {
        if (err) {
          logger.warn(err);
          reject(err);
        } else {
          resolve(blobs);
        }
      });
    });
  });
}

const funcs = {
  * storageaccount() {
    this.body = JSON.stringify(process.env.AZURE_STORAGE_ACCOUNT);
  },

  * bookmarks() {
    const bookmarks = config.get('bookmarks');
    this.body = JSON.stringify(bookmarks.map(b => b.name));
  },

  * containers() {
    containers = yield getContainersAsync();
    this.body = JSON.stringify(containers.map(c => c.name));
  },

  * dir(param) {
    const dir = getFilePath(param);
    if (!dir) {
      this.body = 'invalid directory';
      return;
    }
    let files = [];
    logger.info(`dir: ${dir}`);
    const containerFiles = yield getBlobsAsync(dir);
    files = files.concat(containerFiles);

    const data = files.reduce((result, file) => {
      // const stats = fs.lstatSync(path.resolve(dir, file));
      if (file.name.indexOf('.flac') > -1) {
        result.push({
          name: file.name,
          isDirectory: false, // file.name.indexOf('/') > -1,
          size: file.contentLength,
          mtime: file.lastModified,
        });
      }
      return result;
    }, []);
    this.body = data;
  },

  * imageInfo(param) {
    const filepath = getFilePath(param);
    if (!filepath) {
      this.body = 'invalid location';
      return;
    }

    this.body = yield getImageInfo(filepath);
  },

  * download(param) {
    const filepath = getFilePath(param);
    if (!filepath) {
      this.body = 'invalid location';
    }
  },

  * image(param) {
    const filepath = getFilePath(param);
    if (!filepath) {
      this.body = 'invalid location';
      return;
    }

    if (!config.cacheDir) {
      yield sendfile(this, filepath);
      return;
    }

    const type = this.query.type;
    if (type !== 'sq100' && type !== 'max800') {
      this.body = 'invalid type';
      return;
    }

    const cacheFilepath = util.getImageCacheFilepath(filepath, type);
    yield util.createImageCache(type, filepath, cacheFilepath);

    yield sendfile(this, cacheFilepath);
    if (!this.status) {
      this.throw(404);
    }
  },

  * upload(param) {
    const dir = getFilePath(param);
    if (!dir) {
      this.body = 'invalid location';
      return;
    }

    const parts = parse(this);
    let part = yield parts;
    while (part) {
      const filename = path.resolve(dir, part.filename);
      const readStream = part;
      const writeStream = fs.createWriteStream(filename);
      yield new Promise((resolve, reject) => {
        readStream.on('error', reject);
        writeStream.on('error', reject);
        writeStream.on('finish', resolve);
        readStream.pipe(writeStream);
      });

      part = yield parts;
    }

    this.status = 200;
  },

  * createFolder(param) {
    const dir = getFilePath(param);
    if (!dir) {
      this.body = 'invalid location';
      return;
    }

    const folderName = this.request.body.name;

    const folderFilepath = path.resolve(dir, folderName);
    yield fs.mkdirAsync(folderFilepath);

    this.body = '{}';
  },

  * delete(param) {
    const dir = getFilePath(param);
    if (!dir) {
      this.body = 'invalid location';
      return;
    }

    const files = this.request.body;

    if (!config.trashDir) {
      for (const file of files) {
        yield fs.unlinkAsync(path.resolve(dir, file));
      }
      this.body = '{}';
      return;
    }

    for (const file of files) {
      const sourceFilepath = path.resolve(dir, file);
      const trashFilename = `${Date.now()}_${file}`;
      const trashFilepath = path.resolve(config.trashDir, trashFilename);
      yield fs.moveAsync(sourceFilepath, trashFilepath);
    }
    this.body = '{}';
  },
};

function init(app) {
  app.use(function* apiHandler(next) {
    const reqPath = decodeURIComponent(this.path);
    const result = /^\/api\/(\w+)\/?(.*)/.exec(reqPath);
    if (!result) {
      yield next;
      return;
    }

    const apiName = result[1];
    const param = result[2];
    if (!funcs[apiName]) {
      logger.warn(`Invalid api: ${apiName}`);
      return;
    }

    try {
      yield* funcs[apiName].call(this, param);
    } catch (err) {
      logger.warn(`Failed to handle api: ${apiName}`, err, err.stack);
      this.status = 500;
    }
  });
}

module.exports = init;
