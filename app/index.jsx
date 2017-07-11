import { createStore, combineReducers, compose, applyMiddleware } from 'redux';
import { Provider } from 'react-redux';
import React from 'react';
import ReactDOM from 'react-dom';
import thunk from 'redux-thunk';
import alertReducer from './reducers/alert';
import containersReducer from './reducers/containers';
import filesReducer from './reducers/files';
import locReducer from './reducers/loc';
import previewReducer from './reducers/preview';
import storageAccountReducer from './reducers/storageaccount';
import uiReducer from './reducers/ui';

// Uncomment to check performance
// window.Perf = require('react-addons-perf');

import '../node_modules/bootstrap/dist/css/bootstrap.css';
import '../node_modules/font-awesome/css/font-awesome.css';
import './public/style.css';
import App from './components/app';

const store = createStore(
  combineReducers({
    ui: uiReducer,
    alert: alertReducer,
    containers: containersReducer,
    loc: locReducer,
    files: filesReducer,
    preview: previewReducer,
    storageaccount: storageAccountReducer,
  }),
  undefined,
  compose(applyMiddleware(thunk), window.devToolsExtension ? window.devToolsExtension() : f => f),
);

const app = document.createElement('div');
document.body.appendChild(app);

ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>,
  app,
);
