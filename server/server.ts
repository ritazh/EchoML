import * as Koa from "koa";
import * as cors from "kcors";
import * as bodyParser from "koa-bodyparser";
import * as send from "koa-send";
import * as session from "koa-session";
import * as morgan from "koa-morgan";
import * as config from "config";
import * as fs from "fs";
import logger from "./logger";
import api from "./api";
import * as mongoose from "mongoose";
import * as _ from "koa-route";
import * as https from "https";

const passport = require("./passport")(require("koa-passport"));

export function createServer(hostname: string, port: number) {
  const app = new Koa();
  // DB Config
  mongoose.connect(config.get("mongo.url"));
  mongoose.connection.on("error", err => {
    logger.error(err);
  });

  const stream = {
    write(message: string) {
      logger.info(message.slice(0, -1));
    }
  };
  app.use(morgan("combined", { stream }));

  if (config.get("cors")) {
    app.use(cors({ credentials: true }));
  }

  if (config.get("serveStatic")) {
    app.use(require("koa-static")("dist"));
  }

  app.use(bodyParser());

  if (config.has("auth")) {
    app.keys = config.get("auth.keys");
    app.use(session(app));
    app.use(passport.initialize());
    app.use(passport.session());

    app.use(
      _.post("/register", async ctx =>
        passport.authenticate("local-signup", async (err: Error, user: object | boolean, info: string) => {
          if (err) throw err;
          if (user === false) {
            ctx.status = 401;
            ctx.body = info;
          } else {
            ctx.login(user);
            ctx.body = info;
          }
        })(ctx)
      )
    );
    app.use(
      _.post("/login", async ctx =>
        passport.authenticate("local-login", async (err: Error, user: object | boolean, info: string) => {
          if (err) throw err;
          if (user === false) {
            ctx.body = info;
            ctx.status = 401;
          } else {
            ctx.body = { success: true };
            return ctx.login(user);
          }
        })(ctx)
      )
    );
    app.use(
      _.post("/logout", async ctx => {
        ctx.logout();
        ctx.body = { success: true, message: "Successfully logged out" };
      })
    );
    app.use(
      _.get(/.+/gi, async (ctx, next) => {
        if (ctx.isAuthenticated()) {
          await next();
        } else {
          // throw 401 unauthorized
          ctx.throw(401);
        }
      })
    );
  }

  app.use(
    _.get("/", async (ctx, next) => {
      await send(ctx, "dist/index.html");
      await next();
    })
  );

  api(app);

  const envStr = process.env.NODE_ENV || "development";
  let httpServer = null;

  if (fs.existsSync("cert")) {
    const options = {
      key: fs.readFileSync("cert/server.key"),
      cert: fs.readFileSync("cert/server.crt")
    };
    https.createServer(options, app.callback()).listen(port);
    logger.info(`server is started on ${hostname}:${port}(https) in ${envStr} mode`);
  } else {
    httpServer = app.listen(port, hostname);
    logger.info(`server is started on ${hostname}:${port} in ${envStr} mode`);
  }

  return httpServer;
}
