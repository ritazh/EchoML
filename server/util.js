const path = require('path');
const config = require('config');
const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs'));
const mkdirpAsync = Promise.promisify(require('mkdirp'));
const gm = require('gm');

Promise.promisifyAll(Object.getPrototypeOf(gm()));

function getImageCacheFilepath(filepath, type) {
  const ext = path.extname(filepath);
  const base = filepath.slice(0, filepath.length - ext.length);
  const cacheFile = `${base}.${type}${ext}`;
  return path.join(config.cacheDir, cacheFile);
}

function* createImageCache(type, srcFilepath, cacheFilepath) {
  try {
    yield fs.statAsync(cacheFilepath);
  } catch (err) {
    yield mkdirpAsync(path.dirname(cacheFilepath));
    if (type === 'sq100') {
      yield gm(srcFilepath)
        .autoOrient()
        .gravity('Center')
        .resize(100, 100, '^')
        .crop(100, 100)
        .writeAsync(cacheFilepath);
    } else if (type === 'max800') {
      const img = gm(srcFilepath);
      const size = yield img.sizeAsync();
      if (size.width > size.height && size.width > 800) {
        yield img.resize(800, null).writeAsync(cacheFilepath);
      } else if (size.width < size.height && size.height > 800) {
        yield img.resize(null, 800).writeAsync(cacheFilepath);
      } else {
        yield img.writeAsync(cacheFilepath);
      }
    }
  }
}

exports.getImageCacheFilepath = getImageCacheFilepath;
exports.createImageCache = createImageCache;
