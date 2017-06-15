/* eslint-disable no-console */

const fs = require('fs');
const path = require('path');
const co = require('co');
const util = require('./util');

const targetDir = process.argv[2];
const types = ['sq100', 'max800'];

console.log(`processing ${targetDir}`);

function* convertDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const srcPath = path.resolve(dir, file);
    if (fs.lstatSync(srcPath).isDirectory()) {
      yield convertDir(srcPath);
      continue;
    }

    if (path.extname(srcPath).toLowerCase() !== '.jpg') {
      continue;
    }

    for (const type of types) {
      const targetPath = util.getImageCacheFilepath(srcPath, type);
      console.log(`create ${targetPath} from ${srcPath}`);
      yield util.createImageCache(type, srcPath, targetPath);
    }
  }
}

co(convertDir(targetDir));
