import * as cluster from "cluster";
import * as os from "os";
import { Globals } from "./lib/Globals";
import { Logger } from "./Logger";
import { Server } from "./Server";

const hostname = Globals.getEnvVar("HOSTNAME");
const port = Number.parseInt(Globals.getEnvVar("PORT"), 10);

const isProduction = !!(process.env.NODE_ENV || "").match(/prod/i);
Logger.logger.info(`Server starting in ${process.env.NODE_ENV || "dev"} mode on port ${port}`);

// Cluster if production
if (isProduction) {
  const numCPUs: number = os.cpus().length;
  if (cluster.isMaster) {
    Logger.logger.info(`Master ${process.pid} is running`);

    // Fork workers.
    for (let i = 0; i < numCPUs; i += 1) {
      cluster.fork();
    }

    cluster.on("exit", worker => {
      // Restart the worker
      const newWorker = cluster.fork();
      Logger.logger.info(`worker ${worker.process.pid} died`);
      Logger.logger.info(`worker ${newWorker.process.pid} born`);
    });
  } else {
    const server = new Server();
    server.listen(hostname, port);
    Logger.logger.info(`Worker ${process.pid} started`);
  }
} else {
  const server = new Server();
  server.listen(hostname, port);
}
