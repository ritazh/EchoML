import { connect } from 'react-redux';
import { Grid, ButtonToolbar } from 'react-bootstrap';
import React from 'react';
import Spinner from 'react-spin';
import { urlToLoc } from '../common/util';
import * as actions from '../actions';
import BottomBar from './bottomBar';
import Container from './container';
import FileList from './fileList';
import Location from './location';
import Login from './login';
import Preview from './preview';
import Toolbar from './toolbar';

class App extends React.Component {
  static propTypes = {
    dispatch: React.PropTypes.func,
    view: React.PropTypes.string,
    loading: React.PropTypes.number,
    containers: React.PropTypes.array,
    preview: React.PropTypes.object,
    ui: React.PropTypes.object,
  };

  componentDidMount() {
    window.addEventListener('popstate', this.handlePopState);
    this.props.dispatch(actions.initApp());
  }

  componentWillUnmount() {
    window.removeEventListener('popstate', this.handlePopState);
  }

  handlePopState = () => {
    const loc = urlToLoc(location.pathname);
    this.props.dispatch({ type: 'SET_LOC', loc });
    this.props.dispatch(actions.updateFiles(loc));
  };

  renderList() {
    switch (this.props.view) {
      default:
        return <FileList />;
    }
  }

  render() {
    if (this.props.ui.login === null) {
      return <Grid />;
    }

    if (this.props.ui.login === false) {
      return (
        <Grid>
          <h1>Welcome To EchoML Ver.0.0.2</h1>
          <Login />
        </Grid>
      );
    }

    return (
      <Grid>
        <ButtonToolbar>
          <Container />
          <Location />
          <Toolbar />
        </ButtonToolbar>
        <br />
        {this.renderList()}
        <BottomBar />
        {this.props.preview ? <Preview /> : ''}
        {this.props.loading
          ? <div className="loading">
            <Spinner />
          </div>
          : ''}
      </Grid>
    );
  }
}

const mapStateToProps = state => ({
  view: state.ui.view,
  loading: state.ui.loading,
  containers: state.containers,
  preview: state.preview,
  ui: state.ui,
});

export default connect(mapStateToProps)(App);
