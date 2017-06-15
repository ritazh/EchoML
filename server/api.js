const parse = require('co-busboy');
const sendfile = require('koa-sendfile');
const path = require('path');
const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs-extra'));
const config = require('config');
const gm = require('gm');
const logger = require('./logger');
const util = require('./util');

Promise.promisifyAll(Object.getPrototypeOf(gm()));

function getFilePath(param) {
  const result = /(\d+)(.*)/.exec(param);
  if (!result) {
    return null;
  }

  const bookmarkIndex = parseInt(result[1], 10);
  const bookmark = config.bookmarks[bookmarkIndex];
  if (!bookmark) {
    return null;
  }

  let subdir = result[2];
  if (subdir.length > 0) {
    if (subdir[0] !== '/') {
      return null;
    }

    subdir = subdir.substr(1);
  }

  const realpath = path.normalize(path.resolve(bookmark.dir, subdir));
  if (!realpath.startsWith(bookmark.dir)) {
    return null;
  }

  return realpath;
}

function getImageInfo(filepath) {
  const info = {};
  return new Promise((resolve, reject) => {
    const img = gm(filepath);
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
  });
}

const funcs = {
  *bookmarks() {
    const bookmarks = config.get('bookmarks');
    this.body = JSON.stringify(bookmarks.map(b => b.name));
  },

  *dir(param) {
    const dir = getFilePath(param);
    if (!dir) {
      this.body = 'invalid location';
      return;
    }

    let files = yield fs.readdirAsync(dir);
    files = files.map(file => {
      const stats = fs.lstatSync(path.resolve(dir, file));
      return {
        name: file,
        isDirectory: stats.isDirectory(),
        size: stats.size,
        mtime: stats.mtime.getTime(),
      };
    });
    this.body = files;
  },

  *imageInfo(param) {
    const filepath = getFilePath(param);
    if (!filepath) {
      this.body = 'invalid location';
      return;
    }

    this.body = yield getImageInfo(filepath);
  },

  *download(param) {
    const filepath = getFilePath(param);
    if (!filepath) {
      this.body = 'invalid location';
      return;
    }

    yield sendfile(this, filepath);
    if (!this.status) {
      this.throw(404);
    }
  },

  *image(param) {
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

  *upload(param) {
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

  *createFolder(param) {
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

  *delete(param) {
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
