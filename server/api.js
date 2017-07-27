// @flow
const azure = require('azure-storage');
const config = require('config');
const fs = require('fs-extra');
const gm = require('gm');
const mkdirp = require('mkdirp');
const parse = require('co-busboy');
const path = require('path');
const Promise = require('bluebird');
const request = require('request');
const sendfile = require('koa-sendfile');
const logger = require('./logger');
const util = require('./util');
const LabelModel = require('./label');
const UserModel = require('./user').model;
const UserController = require('./user').controller;

const blobService = azure.createBlobService(
  config.storage.STORAGE_ACCOUNT,
  config.storage.STORAGE_ACCESS_KEY,
);

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
  const filepath = subdir ? `${container.name}/${subdir}` : container.name;
  return filepath;
}

/**
 * @param {string} storageAccount
 * @param {string} containerName
 * @param {string} filename
 * @return {string}
 */
function generateAzureBlobURL(
  storageAccount /* :string */,
  containerName /* :string */,
  filename /* :string */,
) {
  const url = `https://${storageAccount}.blob.core.windows.net/${containerName}/${filename}`;
  return url;
}

/**
 * @param {string} storageAccount
 * @param {string} containerName
 * @param {string} filename
 */
function getLabels(
  storageAccount /* :string */,
  containerName /* :string */,
  filename /* :string */,
) {
  const docUrl = generateAzureBlobURL(storageAccount, containerName, filename);
  return new Promise((resolve) => {
    const labels = LabelModel.find({ docUrl }).exec();
    resolve(labels);
  });
}

/**
 * @param {string} filepath
 * @return {Promise<array>}
 */
function deleteLabels(
  storageAccount /* :string */,
  containerName /* :string */,
  filename /* :string */,
) {
  return new Promise((resolve) => {
    const docUrl = generateAzureBlobURL(storageAccount, containerName, filename);
    const labels = LabelModel.deleteMany(
      { docUrl },
      err => (err ? console.error(err) : resolve(labels)),
    );
  });
}

/**
 * @param {string} storageAccount
 * @param {string} containerName
 * @param {string} filename
 * @param {string} data
 */
function addLabels(
  storageAccount /* :string */,
  containerName /* :string */,
  filename /* :string */,
  data /* :any */,
) {
  const docUrl = generateAzureBlobURL(storageAccount, containerName, filename);

  const newData = [];
  for (let i = data.length - 1; i >= 0; i -= 1) {
    const labels = data[i].lines[0].split(';');
    for (let j = labels.length - 1; j >= 0; j -= 1) {
      newData.push({
        docUrl,
        begin: data[i].start,
        end: data[i].end,
        label: labels[j].trim(),
      });
    }
  }
  let newLabels = [];
  return new Promise((resolve) => {
    LabelModel.insertMany(newData, (err, result) => {
      newLabels = result;
      resolve(newLabels);
    });
  });
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
      (error) => {
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

/**
 * Returns a promise resolving to an array of pkgcloud contaienrs
 * @return {Promise<array>}
 */
function getContainersAsync() {
  let containers = [];

  const aggregateContainers = (err, result, cb) => {
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
  };

  return new Promise((resolve, reject) => {
    blobService.listContainersSegmented(null, (err, result) => {
      aggregateContainers(err, result, (err, containers) => {
        if (err) {
          logger.warn(err);
          reject(err);
        } else {
          // Add azure storage account to containers
          const decaratedContainers = Array.isArray(containers)
            ? containers.map(container =>
                Object.assign(container, { storageAccount: config.storage.STORAGE_ACCOUNT }),
              )
            : containers;
          resolve(decaratedContainers);
        }
      });
    });
  });
}

/**
 * Returns a promise resolving to an array of pkgcloud files
 * @param {string} container target container name
 * @return {Promise<array>}
 */
function getBlobsAsync(container /* :string */) {
  let blobs = [];
  const aggregateBlobs = (containerName, err, result, cb) => {
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
  };

  return new Promise((resolve, reject) => {
    blobService.listBlobsSegmented(container, null, (err, result) => {
      aggregateBlobs(container, err, result, (err, blobs) => {
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
  * users() {
    const method = this.request.method.toLowerCase();
    const params = method === 'get' ? this.query : this.request.body;
    const supportedMethods = Object.keys(UserController).map(casedMethod =>
      casedMethod.toLowerCase(),
    );

    // Try/Catch the Promise. Rejections are piped as catchable error
    try {
      this.body = yield supportedMethods.includes(method)
        ? UserController[method](params)
        : Promise.reject(new Error(`Unsupported method: ${method}`));
    } catch (err) {
      this.body = yield err;
    }
  },
  * register(param) {
    // Delete Users ============================================================
    // const deleteUsers = () =>
    //   new Promise((resolve, reject) => {
    //     UserModel.remove({}, (err, removed) => {
    //       if (err) reject({ err });
    //       resolve(removed);
    //     });
    //   });
    // this.body = yield deleteUsers()
    //   .then(deleted => ({ deleted }))

    // Save User ===============================================================
    this.body = yield Promise.resolve()
      .then(() => {
        // Check if user email already exists
        const email = this.request.body.email;
        return UserModel.find({ email }).then((users) => {
          // If exists, reject with Error
          const exists = users.length > 0;
          if (exists) {
            return Promise.reject(new Error(`User with email ${email} already exists`));
          }

          // Return new user resolve
          const user = new UserModel(this.request.body);
          return new Promise((resolve, reject) => {
            user.save((err) => {
              if (err) reject({ err });
              resolve({ user });
            });
          });
        });
      })
      .then(user => ({ user }))
      .catch(err => ({ err }));
  },

  * downloadfile(param) {
    const requiredParams = ['storageAccount', 'containerName', 'filename'];
    const isValidGet = () =>
      Object.keys(this.query).every(getParam => requiredParams.includes(getParam));

    if (isValidGet()) {
      const storageAccount = this.query.storageAccount;
      const containerName = this.query.containerName;
      const filename = this.query.filename;

      // Concat to local file dir
      const filepath = `files/${storageAccount}/${containerName}/${filename}`;
      const dirname = path.dirname(filepath);

      if (!fs.existsSync(dirname)) {
        mkdirp.sync(dirname);
      }

      // download file locally; then send it
      yield new Promise((resolve, reject) => {
        // Prep write stream
        const writeStream = fs.createWriteStream(filepath);
        writeStream
          .on('finish', () => {
            resolve(filepath);
          })
          .on('error', (err /* : Error*/) => {
            reject(err);
          });

        // download
        const urlSafeAccount = encodeURIComponent(storageAccount);
        const urlSafeContainer = encodeURIComponent(containerName);
        const urlSafeFilename = encodeURIComponent(filename);
        const downloadUrl = `https://${urlSafeAccount}.blob.core.windows.net/${urlSafeContainer}/${urlSafeFilename}`;
        console.log(downloadUrl);
        request(downloadUrl).pipe(writeStream);
      }).then(() => sendfile(this, `./${filepath}`));
    } else {
      this.body = yield Promise.resolve({ error: 'Invalid GET request' });
    }
  },

  /**
   * @param {string} param container-index/filename
   */
  * labels(param) {
    // retrieve container/filename information with getFilePath
    const requiredParams = ['storageAccount', 'containerName', 'filename'];
    const getParams = this.query;
    const isValidGet = () => Object.keys(getParams).every(param => requiredParams.includes(param));

    if (isValidGet()) {
      const storageAccount = getParams.storageAccount;
      const containerName = getParams.containerName;
      const filename = getParams.filename;
      this.body = yield getLabels(storageAccount, containerName, filename);
    } else {
      this.body = yield Promise.resolve({ message: 'Invalid GET request' });
    }
  },

  * saveLabels() {
    // White list valid POST params
    const isValidPost = () =>
      Object.keys(this.request.body).every(param =>
        ['storageAccount', 'labels', 'containerName', 'filename'].includes(param),
      );

    if (isValidPost()) {
      const storageAccount = this.request.body.storageAccount;
      const containerName = this.request.body.containerName;
      const filename = this.request.body.filename;
      const data = this.request.body.labels;
      this.body = yield deleteLabels(storageAccount, containerName, filename);
      this.body = yield addLabels(storageAccount, containerName, filename, data);
    } else {
      this.body = yield Promise.resolve({ message: 'Invalid POST request' });
    }
  },

  * bookmarks() {
    const bookmarks = config.get('bookmarks');
    this.body = yield new Promise(resolve => resolve(JSON.stringify(bookmarks.map(b => b.name))));
  },

  * containers() {
    containers = yield getContainersAsync();
    // this.body = JSON.stringify(containers.map(c => c.name));
    this.body = containers;
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
      this.body = yield new Promise(resolve => resolve('invalid location'));
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
      yield Promise.all(files.map(file => fs.unlink(path.resolve(dir, file)))).catch(err =>
        console.error(err),
      );
      this.body = '{}';
      return;
    }

    // yield Promise.all() for parallel deletion
    yield Promise.all(
      files.map((file) => {
        const sourceFilepath = path.resolve(dir, file);
        const trashFilename = `${Date.now()}_${file}`;
        const trashFilepath = path.resolve(config.trashDir, trashFilename);
        return fs.move(sourceFilepath, trashFilepath);
      }),
    ).catch((err) => {
      console.error(err);
    });

    this.body = '{}';
  },
};

function init(app /* : any */) {
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
