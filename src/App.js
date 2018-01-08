import React, { Component } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import './App.css';
import LoginCard from './LoginCard';
import Drawer from './Drawer';
import { getBlobs, getContainers } from './lib/azure';
import { isLoggedIn } from './lib/auth';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      storageAccount: '',
      containers: [],
      blobs: {},
    };
  }

  componentDidMount() {
    isLoggedIn().then((loginStatus) => {
      if (loginStatus) {
        this.onLogin();
      }
    });
  }

  onLogin = async () => {
    this.getBlobs().then(() => {
      this.setState({ isLoggedIn: true });
    });
  };

  getBlobs = async () => {
    const containers = await getContainers();
    this.setState({ containers });

    const mappedBlobs = {};
    containers.forEach((container) => {
      getBlobs(container.name).then((blobs) => {
        const containerName = container.name;
        if (!mappedBlobs[containerName]) {
          mappedBlobs[containerName] = [];
        }
        mappedBlobs[containerName] = blobs;
        this.setState({ blobs: mappedBlobs });
      });
    });
  };

  render() {
    return (
      <div className="App">
        {this.state.isLoggedIn ? (
          <Router>
            <Drawer
              storageAccount={this.state.storageAccount}
              containers={this.state.containers}
              blobs={this.state.blobs}
            />
          </Router>
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <LoginCard onLogin={this.onLogin} />
          </div>
        )}
      </div>
    );
  }
}

export default App;
