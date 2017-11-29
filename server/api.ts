import * as azure from 'azure-storage';
import * as config from 'config';
import * as fs from 'fs-extra';
import * as gm from 'gm';
import * as Koa from 'koa';
import * as send from 'koa-send';
import * as mkdirp from 'mkdirp';
import * as path from 'path';
import * as request from 'request';
import { ILabel, LabelModel } from './label';
import logger from './logger';
import * as util from './util';

const blobService = azure.createBlobService(
  config.get('storage.STORAGE_ACCOUNT'),
  config.get('storage.STORAGE_ACCESS_KEY'),
);

async function getFilePath(param: string): Promise<string> {
  const containers = await getContainersAsync();
  logger.info(`param: ${param}`);

  const result = /(\d+)(.*)/.exec(param);
  logger.info(JSON.stringify(result));
  if (!result) {
    return Promise.reject(null);
  }

  const containerIndex = parseInt(result[1], 10);
  const container = containers[containerIndex];
  if (!container) {
    return Promise.reject('Container not found');
  }

  let subdir = result[2];
  if (subdir.length > 0) {
    if (subdir[0] !== '/') {
      return Promise.reject('folder not found');
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
function generateAzureBlobURL(storageAccount: string, containerName: string, filename: string) {
  const url = `https://${storageAccount}.blob.core.windows.net/${containerName}/${filename}`;
  return url;
}

/**
 * @param {string} storageAccount
 * @param {string} containerName
 * @param {string} filename
 */
async function getLabels(storageAccount: string, containerName: string, filename: string) {
  const docUrl = generateAzureBlobURL(storageAccount, containerName, filename);
  const labels: any = await LabelModel.find({ docUrl }).exec();
  const modeledLabels: ILabel[] = labels.map((label: ILabel) => ({
    docuUrl: label.docUrl,
    end: label.end,
    label: label.label || '',
    start: label.start,
  }));

  return modeledLabels;
}

/**
 * @param {string} filepath
 * @return {Promise<array>}
 */
function deleteLabels(storageAccount: string, containerName: string, filename: string) {
  return new Promise(resolve => {
    const docUrl = generateAzureBlobURL(storageAccount, containerName, filename);
    const labels = LabelModel.remove(
      { docUrl },
      err => (err ? logger.error(err) : resolve(labels)),
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
  storageAccount: string,
  containerName: string,
  filename: string,
  data: ILabel[],
) {
  const docUrl = generateAzureBlobURL(storageAccount, containerName, filename);

  const newData: ILabel[] = data.map(label => ({
    docUrl,
    end: label.end,
    label: label.label,
    start: label.start,
  }));

  return new Promise((resolve, reject) => {
    LabelModel.insertMany(newData, (err: Error, result) => {
      if (err) {
        return reject(err);
      }
      return resolve(result);
    });
  });
}

function getImageInfo(filepath: string) {
  interface IInfo {
    size: gm.Dimensions | null;
    orientation: string;
  }
  const fileparts: string[] = [];
  fileparts[0] = filepath.substring(0, filepath.indexOf('/'));
  fileparts[1] = filepath.substring(filepath.indexOf('/') + 1);
  const info: IInfo = {
    orientation: '',
    size: null,
  };

  return new Promise((resolve, reject) => {
    blobService.getBlobToStream(
      fileparts[0],
      fileparts[1],
      fs.createWriteStream('output.jpeg'),
      error => {
        if (!error) {
          const img = gm('output.jpeg');
          img.size((err, value) => {
            if (err) {
              return reject(err);
            }

            info.size = value;
            img.orientation((err2, value2) => {
              if (err2) {
                return reject(err2);
              }

              info.orientation = value2;
              return resolve(info);
            });
          });
        }
      },
    );
  });
}

interface IEchoContainer extends azure.BlobService.ContainerResult {
  storageAccount: string;
}
interface IEchoBlob extends azure.BlobService.BlobResult {
  name: string;
  isDirectory: boolean;
  size: string;
  mtime: string;
}

/**
 * Returns a promise resolving to an array of pkgcloud contaienrs
 * @return {Promise<array>}
 */
async function getContainersAsync(): Promise<IEchoContainer[]> {
  // Async version of listContainersSegmented
  async function getListContainerResult(
    token: azure.common.ContinuationToken,
  ): Promise<azure.BlobService.ListContainerResult> {
    return new Promise<azure.BlobService.ListContainerResult>((resolve, reject) => {
      blobService.listContainersSegmented(token, (err, result) => {
        if (err) {
          return reject(err);
        }
        return resolve(result);
      });
    });
  }

  const containers: IEchoContainer[] = [];
  let continuationToken: azure.common.ContinuationToken | null = null;
  try {
    do {
      const result: azure.BlobService.ListContainerResult = await getListContainerResult(
        continuationToken as azure.common.ContinuationToken,
      );
      const storageAccount: string = config.get('storage.STORAGE_ACCOUNT');
      for (const container of result.entries) {
        const echoContainer: IEchoContainer = {
          ...container,
          storageAccount,
        };
        containers.push(echoContainer);
      }
      continuationToken = result.continuationToken;
    } while (continuationToken);
  } catch (err) {
    logger.error(err);
  }
  return containers;
}

/**
 * Returns a promise resolving to an array of pkgcloud files
 * @param {string} container target container name
 * @return {Promise<array>}
 */
async function getBlobsAsync(container: string): Promise<azure.BlobService.BlobResult[]> {
  // Async version of listBlobsSegmented
  async function getListBlobResult(
    token: azure.common.ContinuationToken,
  ): Promise<azure.BlobService.ListBlobsResult> {
    return new Promise<azure.BlobService.ListBlobsResult>((resolve, reject) => {
      blobService.listBlobsSegmented(container, token, (err, result) => {
        if (err) {
          return reject(err);
        }
        return resolve(result);
      });
    });
  }

  const blobs: azure.BlobService.BlobResult[] = [];
  let continuationToken: azure.common.ContinuationToken | null = null;
  try {
    do {
      const result: azure.BlobService.ListBlobsResult = await getListBlobResult(
        continuationToken as azure.common.ContinuationToken,
      );
      for (const blob of result.entries) {
        blobs.push(blob);
      }
      continuationToken = result.continuationToken as azure.common.ContinuationToken;
    } while (continuationToken);
  } catch (err) {
    logger.error(err);
  }

  return blobs;
}

/**
 * Downloads the file to ${projectRoot}/files
 * @param {string} storageAccount 
 * @param {string} containerName 
 * @param {string} filename 
 * @throws {Error}
 * @return {string}
 */
async function downloadFile(storageAccount: string, containerName: string, filename: string) {
  // Concat to local file dir
  const filepath = `files/${storageAccount}/${containerName}/${filename}`;
  const dirname = path.dirname(filepath);

  if (!fs.existsSync(dirname)) {
    mkdirp.sync(dirname);
  }

  // download file locally; then send it
  try {
    // if file exists check age
    const shouldDownload = (maxage = 3600000) => {
      try {
        const stats = fs.statSync(filepath);
        const timeCreated = stats.birthtime.getTime();
        const now = new Date().getTime();
        const age = new Date(now - timeCreated);
        return age.getTime() > maxage; // older than an hour
      } catch (err) {
        return true;
      }
    };

    // download if file doesn't exist or is too old
    if (shouldDownload()) {
      await new Promise((resolve, reject) => {
        // Prep write stream
        const writeStream = fs.createWriteStream(filepath);
        writeStream
          .on('finish', () => {
            resolve(filepath);
          })
          .on('error', (err /* : Error */) => {
            reject(err);
          });

        // download
        const urlSafeAccount = encodeURIComponent(storageAccount);
        const urlSafeContainer = encodeURIComponent(containerName);
        const urlSafeFilename = encodeURIComponent(filename);
        const downloadUrl = `https://${urlSafeAccount}.blob.core.windows.net/${urlSafeContainer}/${urlSafeFilename}`;
        request(downloadUrl).pipe(writeStream);
      });
    }

    return filepath;
  } catch (err) {
    logger.error(err);
    throw err;
  }
}

interface IPredictionResponse {
  result: Array<{
    t_s: number;
    t_e: number;
    label: string;
  }>;
}

/**
 * @param {string} storageAccount 
 * @param {string} containerName 
 * @param {string} filename 
 * @param {number} start 
 * @param {number} end 
 * @throws {Error}
 * @return {object} json object
 */
async function downloadPredictions(
  storageAccount: string,
  containerName: string,
  filename: string,
  start: number,
  end: number,
): Promise<ILabel[]> {
  if (!config.has('prediction.endpoint')) {
    return [];
  }

  const endpoint = config.get('prediction.endpoint'); // Endpoint for predictions @todo: change to properly hosted location
  try {
    const filepath = await downloadFile(storageAccount, containerName, filename);
    const formData = {
      file: fs.createReadStream(filepath),
      t1: start,
      t2: end,
    };
    const predicitons = await new Promise<ILabel[]>((resolve, reject) => {
      request.post({ url: endpoint, formData }, (err, _, body) => {
        if (err) {
          return reject(err);
        }
        const result: IPredictionResponse = JSON.parse(body);
        const cleanPredictions: ILabel[] = result.result.map(prediction => ({
          docUrl: generateAzureBlobURL(storageAccount, containerName, filename),
          end: prediction.t_e,
          label: prediction.label,
          start: prediction.t_s,
        }));

        interface IPredictionGroup {
          [label: string]: ILabel[];
        }
        // Group by label
        const groupedPredictions: IPredictionGroup = cleanPredictions.reduce(
          (groups: IPredictionGroup, label) => {
            groups[label.label] = groups[label.label] || [];
            groups[label.label].push(label);
            return groups;
          },
          {},
        );

        // Join labels in the same group if they make a continuous time-frame
        for (const [labelText, labels] of Object.entries(groupedPredictions)) {
          const group = groupedPredictions[labelText];
          for (const label of labels) {
            let continuation;
            do {
              continuation = labels.find(continuing => continuing.start === label.end);
              if (continuation) {
                label.end = continuation.end;
                group.splice(group.indexOf(continuation), 1);
              }
            } while (continuation);
          }
        }

        // Merge the prediction groups
        const cleandAndJoinedLabels: ILabel[] = [];
        for (const labels of Object.values(groupedPredictions)) {
          [...labels].forEach(label => {
            cleandAndJoinedLabels.push(label);
          });
        }

        return resolve(cleandAndJoinedLabels);
      });
    });
    return predicitons;
  } catch (err) {
    logger.error(err);
    throw new Error(`Error fetching predictions from: ${endpoint}`);
  }
}

/**
 * Object of 
 */
const api: {
  [functionName: string]: (ctx: Koa.Context, params: any) => void;
} = {
  async downloadfile(ctx) {
    const requiredParams = ['storageAccount', 'containerName', 'filename'];
    const isValidGet = () =>
      Object.keys(ctx.query).every(getParam => requiredParams.includes(getParam));

    if (isValidGet()) {
      const storageAccount = ctx.query.storageAccount;
      const containerName = ctx.query.containerName;
      const filename = ctx.query.filename;

      try {
        const filepath = await downloadFile(storageAccount, containerName, filename);
        await send(ctx, `./${filepath}`);
      } catch (error) {
        logger.error(error);
        ctx.body = { error };
      }
    } else {
      ctx.body = { error: 'Invalid GET request' };
    }
  },

  async predictions(ctx) {
    const requiredParams = ['storageAccount', 'containerName', 'filename', 'start', 'end'];
    const isValidGet = () =>
      Object.keys(ctx.query).every(getParam => requiredParams.includes(getParam));

    if (isValidGet()) {
      const storageAccount = ctx.query.storageAccount;
      const containerName = ctx.query.containerName;
      const filename = ctx.query.filename;
      const start = Math.round(Number.parseFloat(ctx.query.start));
      const end = Math.ceil(Number.parseFloat(ctx.query.end));

      try {
        const predictions = await downloadPredictions(
          storageAccount,
          containerName,
          filename,
          start,
          end,
        );
        ctx.body = predictions;
      } catch (error) {
        logger.error(error);
        ctx.body = { error: JSON.stringify(error), results: [] };
      }
    } else {
      ctx.body = { error: 'Invalid GET request' };
    }
  },

  /**
   * @param {string} param container-index/filename
   */
  async labels(ctx) {
    // retrieve container/filename information with getFilePath
    const requiredParams = ['storageAccount', 'containerName', 'filename'];
    const getParams = ctx.query;
    const isValidGet = () => Object.keys(getParams).every(param => requiredParams.includes(param));

    if (isValidGet()) {
      const storageAccount = getParams.storageAccount;
      const containerName = getParams.containerName;
      const filename = getParams.filename;
      ctx.body = await getLabels(storageAccount, containerName, filename);
    } else {
      ctx.body = { message: 'Invalid GET request' };
    }
  },

  async saveLabels(ctx) {
    // White list valid POST params
    const isValidPost = () =>
      Object.keys(ctx.request.body).every(param =>
        ['storageAccount', 'labels', 'containerName', 'filename'].includes(param),
      );

    if (isValidPost()) {
      const storageAccount = ctx.request.body.storageAccount;
      const containerName = ctx.request.body.containerName;
      const filename = ctx.request.body.filename;
      const data = ctx.request.body.labels;
      ctx.body = await deleteLabels(storageAccount, containerName, filename);
      ctx.body = await addLabels(storageAccount, containerName, filename, data);
    } else {
      ctx.body = { message: 'Invalid POST request' };
    }
  },

  async bookmarks(ctx) {
    const bookmarks = config.get('bookmarks');
    if (Array.isArray(bookmarks)) {
      ctx.body = bookmarks.map(b => b.name);
    } else {
      ctx.body = [];
    }
  },

  async containers(ctx) {
    const containers = await getContainersAsync();
    ctx.body = containers;
  },

  async dir(ctx, param: string) {
    const dir = await getFilePath(param);
    if (!dir) {
      ctx.body = 'invalid directory';
      ctx.status = 404;
      return;
    }
    let files: azure.BlobService.BlobResult[] = [];
    logger.info(`dir: ${dir}`);
    const containerFiles = await getBlobsAsync(dir);
    files = files.concat(containerFiles);

    const data: IEchoBlob[] = files
      .filter(file => file.name.includes('.flac') || file.name.includes('.mp3'))
      .map(file => {
        const blob: IEchoBlob = {
          ...file,
          isDirectory: false, // file.name.indexOf('/') > -1,
          mtime: file.lastModified,
          name: file.name,
          size: file.contentLength,
        };
        return blob;
      });

    ctx.body = data;
  },

  async imageInfo(ctx, param) {
    const filepath = await getFilePath(param);
    if (!filepath) {
      ctx.body = 'invalid location';
      return;
    }

    ctx.body = await getImageInfo(filepath);
  },

  async download(ctx, param) {
    const filepath = await getFilePath(param);
    if (!filepath) {
      ctx.body = { success: false, message: 'invalid location' };
    }
  },

  async image(ctx, param) {
    const filepath = await getFilePath(param);
    if (!filepath) {
      ctx.body = 'invalid location';
      return;
    }

    if (!config.has('cacheDir')) {
      await send(ctx, filepath);
      return;
    }

    const type = ctx.query.type;
    if (type !== 'sq100' && type !== 'max800') {
      ctx.body = 'invalid type';
      return;
    }

    const cacheFilepath = util.getImageCacheFilepath(filepath, type);
    await util.createImageCache(type, filepath, cacheFilepath);

    await send(ctx, cacheFilepath);
    if (!ctx.status) {
      ctx.throw(404);
    }
  },

  async createFolder(ctx, param) {
    const dir = getFilePath(param);
    if (!dir) {
      ctx.body = 'invalid location';
      return;
    }

    const folderName = ctx.request.body.name;

    const folderFilepath = path.resolve(dir, folderName);
    await fs.mkdirp(folderFilepath);
    ctx.body = {};
  },

  async delete(ctx, param) {
    const dir = getFilePath(param);
    if (!dir) {
      ctx.body = 'invalid location';
      return;
    }

    const files = ctx.request.body;

    if (Array.isArray(files)) {
      // unlink if trashDir not set
      if (!config.has('trashDir')) {
        const unlinkPromises = files.map(file => {
          return new Promise<string>(resolve => {
            const filepath = path.resolve(dir, file);
            return fs.unlink(filepath).then(() => {
              resolve(filepath);
            });
          });
        });
        try {
          const deleted = await Promise.all(unlinkPromises);
          ctx.body = { success: true, deleted };
        } catch (error) {
          ctx.body = { success: false, deleted: [], error };
        }
      } else {
        // move files to transDir
        const movePromises = files.map(file => {
          return new Promise<string>(resolve => {
            const sourceFilepath = path.resolve(dir, file);
            const trashFilename = `${Date.now()}_${file}`;
            const trashFilepath = path.resolve(config.get('trashDir'), trashFilename);
            return fs.move(sourceFilepath, trashFilepath).then(() => {
              resolve(sourceFilepath);
            });
          });
        });
        try {
          const deleted = Promise.all(movePromises);
          ctx.body = { success: true, deleted };
        } catch (error) {
          ctx.body = { success: false, deleted: [], error };
        }
      }
    } else {
      ctx.body = { success: false, deleted: [], error: `Request body was non-array` };
    }
  },
};

export default function init(app: Koa) {
  app.use(async (ctx, next) => {
    const reqPath = decodeURIComponent(ctx.path);
    const result = /^\/api\/(\w+)\/?(.*)/.exec(reqPath);

    if (result) {
      const endpoint = result[1];
      const param = result[2];
      if (!Object.keys(api).includes(endpoint)) {
        logger.warn(`Invalid api endpoint: ${endpoint}`);
        ctx.throw(403);
      }

      try {
        await api[endpoint](ctx, param);
      } catch (err) {
        logger.warn(`Failed to handle api: ${endpoint}`, err, err.stack);
        ctx.throw(500);
      }
    }

    await next();
  });
}
