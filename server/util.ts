import * as path from "path";
import * as config from "config";
import * as fs from "fs-extra";
import * as gm from "gm";

export function getImageCacheFilepath(filepath: string, type: string) {
  if (config.has("cacheDir")) {
    const ext = path.extname(filepath);
    const base = filepath.slice(0, filepath.length - ext.length);
    const cacheFile = `${base}.${type}${ext}`;
    const cacheDir: string = config.get("cacheDir");
    return path.join(cacheDir, cacheFile);
  } else {
    throw new Error("cacheDir not set in configuration");
  }
}

export async function createImageCache(type: string, srcFilepath: string, cacheFilepath: string) {
  try {
    await fs.statSync(cacheFilepath);
  } catch (err) {
    await fs.mkdirp(path.dirname(cacheFilepath));
    if (type === "sq100") {
      await new Promise<string>((resolve, reject) => {
        gm(srcFilepath)
          .autoOrient()
          .gravity("Center")
          .resize(100, 100, "^")
          .crop(100, 100)
          .write(cacheFilepath, (error, stdout) => {
            if (error) reject(error);
            resolve(stdout);
          });
      });
    } else if (type === "max800") {
      const img = gm(srcFilepath);
      const size = await new Promise<gm.Dimensions>((resolve, reject) => {
        img.size((err, value) => {
          if (err) reject(err);
          resolve(value);
        });
      });
      await new Promise<string>((resolve, reject) => {
        if (size.width > size.height && size.width > 800) {
          img.resize(800).write(cacheFilepath, (err, stdout) => (err ? reject(err) : resolve(stdout)));
        } else if (size.width < size.height && size.height > 800) {
          img
            .resize(size.width * (size.height / 800), 800)
            .write(cacheFilepath, (err, stdout) => (err ? reject(err) : resolve(stdout)));
        } else {
          img.write(cacheFilepath, (err, stdout) => (err ? reject(err) : resolve(stdout)));
        }
      });
    }
  }
}
