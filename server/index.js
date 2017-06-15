const config = require('config');
const createServer = require('./server');

const hostname = config.get('hostname');
const port = config.get('port');
createServer(hostname, port);
