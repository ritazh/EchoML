const cluster = require('cluster');
const numCPUs = require('os').cpus().length;
const config = require('config');
const createServer = require('./server');

const hostname = config.get('hostname');
const port = config.get('port');

if (cluster.isMaster) {
  console.log(`Master ${process.pid} is running`);

  // Fork workers.
  for (let i = 0; i < numCPUs; i += 1) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`worker ${worker.process.pid} died`);
  });
} else {
  // Workers can share any TCP connection
  // In this case it is an HTTP server
  createServer(hostname, port);
  console.log(`Worker ${process.pid} started`);
}
