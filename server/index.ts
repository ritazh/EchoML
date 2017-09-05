import * as cluster from "cluster";
import * as config from "config";
import * as os from "os";
import { createServer } from "./server";

const numCPUs: number = os.cpus().length;
const hostname: string = config.get("hostname");
const port: number = config.get("port");

if (cluster.isMaster) {
  console.log(`Master ${process.pid} is running`);

  // Fork workers.
  for (let i = 0; i < numCPUs; i += 1) {
    cluster.fork();
  }

  cluster.on("exit", worker => {
    console.log(`worker ${worker.process.pid} died`);
  });
} else {
  // Workers can share any TCP connection
  // In this case it is an HTTP server
  createServer(hostname, port);
  console.log(`Worker ${process.pid} started`);
}
