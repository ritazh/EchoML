import * as Koa from 'koa';
import * as _ from 'koa-route';
import { AccountsController } from './controllers/AccountsController';
import { BlobsController } from './controllers/BlobsController';
import { ContainersController } from './controllers/ContainersController';
import { LabelsController } from './controllers/LabelsController';

export class API {
  public static routes: Koa.Middleware[] = [
    _.get('/api/accounts', AccountsController.index),
    _.get('/api/blobs', BlobsController.index),
    _.get('/api/blobs/download/:storage_account/:container_name/:filename(.+)',BlobsController.download),
    _.get('/api/containers', ContainersController.index),
    _.get('/api/containers/:name', ContainersController.show),
    _.get('/api/containers/:name/blobs', ContainersController.blobs),
    _.get('/api/labels', LabelsController.index),
    _.get('/api/labels/:storage_account/:container_name/:filename(.+)', LabelsController.show),
    _.post('/api/labels', LabelsController.store),
  ];
}
