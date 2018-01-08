import * as config from 'config';
import * as fs from 'fs';
import * as https from 'https';
import * as cors from 'kcors';
import * as Koa from 'koa';
import * as bodyParser from 'koa-bodyparser';
import * as morgan from 'koa-morgan';
import * as _ from 'koa-route';
import * as session from 'koa-session';
import * as serve from 'koa-static';
import { Connection } from 'mongoose';
import { API } from './API';
import { Database } from './lib/Database';
import { PassportLocal } from './lib/PassportLocal';
import { Logger } from './Logger';

export class Server {
  public app: Koa = new Koa();
  public db: Connection = Database.getConnection();

  constructor() {
    const stream = {
      write(message: string) {
        Logger.getLogger().info(message.slice(0, -1));
      },
    };
    this.app.use(morgan('combined', { stream }));

    if (config.get('cors')) {
      this.app.use(cors({ credentials: true }));
    }

    this.app.use(bodyParser());

    if (config.has('auth')) {
      const passport = PassportLocal.getPassport();
      this.app.keys = config.get('auth.keys');
      this.app.use(session(this.app));
      this.app.use(passport.initialize());
      this.app.use(passport.session());

      this.app.use(
        _.post('/register', async ctx =>
          passport
            .authenticate(
              'local-signup',
              async (err: Error, user: object | boolean, info: string) => {
                if (err) {
                  throw err;
                }
                if (user === false) {
                  ctx.status = 409;
                  ctx.body = info;
                } else {
                  ctx.login(user);
                  ctx.body = info;
                }
              },
            )
            .call(null, ctx),
        ),
      );
      this.app.use(
        _.post('/login', async ctx =>
          passport
            .authenticate(
              'local-login',
              async (err: Error, user: object | boolean, info: string) => {
                if (err) {
                  throw err;
                }
                if (user === false) {
                  ctx.body = info;
                  ctx.status = 401;
                } else {
                  ctx.body = { success: true };
                  return ctx.login(user);
                }
              },
            )
            .call(null, ctx),
        ),
      );
      this.app.use(
        _.post('/logout', async ctx => {
          ctx.logout();
          ctx.body = { success: true, message: 'Successfully logged out' };
        }),
      );
      this.app.use(
        _.post('/is-logged-in', async ctx => {
          ctx.body = ctx.isAuthenticated();
        }),
      );
      this.app.use(
        _.get(/api+/gi, async (ctx, next) => {
          if (ctx.isAuthenticated()) {
            await next();
          } else {
            // throw 401 unauthorized
            ctx.throw(401);
          }
        }),
      );
    }

    // Serve build folder containing static assets
    this.app.use(serve('build'));
    // Audio files
    this.app.use(serve('files'));

    // Router routes middleware
    for (const route of API.routes) {
      this.app.use(route);
    }
  }

  public listen(hostname: string, port: number) {
    if (fs.existsSync('cert')) {
      const options = {
        cert: fs.readFileSync('cert/this.crt'),
        key: fs.readFileSync('cert/this.key'),
      };
      https.createServer(options, this.app.callback()).listen(port);
      Logger.getLogger().info(
        `Server started on ${hostname}:${port}(https) in ${this.app.env} mode`,
      );
    } else {
      this.app.listen(port, hostname);
      Logger.getLogger().info(`Server started on ${hostname}:${port} in ${this.app.env} mode`);
    }
  }
}
