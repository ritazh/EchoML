import * as cluster from 'cluster';
import * as config from 'config';
import * as os from 'os';
import logger from './logger';
import { createServer } from './server';

const numCPUs: number = os.cpus().length;
const hostname: string = config.get('hostname');
const port: number = config.get('port');

if (cluster.isMaster) {
  logger.info(`Master ${process.pid} is running`);

  // Fork workers.
  for (let i = 0; i < numCPUs; i += 1) {
    cluster.fork();
  }

  cluster.on('exit', worker => {
    // Restart the worker
    const newWorker = cluster.fork();
    logger.info(`worker ${worker.process.pid} died`);
    logger.info(`worker ${newWorker.process.pid} born`);
  });
} else {
  // Workers can share any TCP connection
  // In this case it is an HTTP server
  createServer(hostname, port);
  logger.info(`Worker ${process.pid} started`);
}
