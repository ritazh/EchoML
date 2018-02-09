import * as cluster from "cluster";
import * as config from "config";
import * as os from "os";
import { Logger } from "./Logger";
import { Server } from "./Server";

const hostname: string = config.get("hostname");
const port: number = config.get("port");

const isProduction = !!(process.env.NODE_ENV || "").match(/prod/i);
Logger.getLogger().info(`Server starting in ${process.env.NODE_ENV || "dev"} mode on port ${port}`);

// Cluster if production
if (isProduction) {
  const numCPUs: number = os.cpus().length;
  if (cluster.isMaster) {
    Logger.getLogger().info(`Master ${process.pid} is running`);

    // Fork workers.
    for (let i = 0; i < numCPUs; i += 1) {
      cluster.fork();
    }

    cluster.on("exit", worker => {
      // Restart the worker
      const newWorker = cluster.fork();
      Logger.getLogger().info(`worker ${worker.process.pid} died`);
      Logger.getLogger().info(`worker ${newWorker.process.pid} born`);
    });
  } else {
    const server = new Server();
    server.listen(hostname, port);
    Logger.getLogger().info(`Worker ${process.pid} started`);
  }
} else {
  const server = new Server();
  server.listen(hostname, port);
}
