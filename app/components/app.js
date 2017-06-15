import { connect } from 'react-redux';
import * as actions from '../actions';
import React from 'react';
import { Grid, ButtonToolbar } from 'react-bootstrap';
import { urlToLoc } from '../common/util';
import Alert from './alert';
import Login from './login';
import Bookmark from './bookmark';
import Location from './location';
import Toolbar from './toolbar';
import FileList from './fileList';
import ThumbnailList from './thumbnailList';
import BottomBar from './bottomBar';
import Preview from './preview';
import Spinner from 'react-spin';

class App extends React.Component {
  static propTypes = {
    dispatch: React.PropTypes.func,
    view: React.PropTypes.string,
    loading: React.PropTypes.bool,
    bookmarks: React.PropTypes.array,
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
      case 'thumbnail': return <ThumbnailList />;
      default:
        return <FileList />;
    }
  }

  render() {
    if (this.props.ui.login === null) {
      return <Grid />;
    }

    if (this.props.ui.login === false) {
      return <Grid><Login /></Grid>;
    }

    return (
      <Grid>
        <ButtonToolbar>
          <Bookmark />
          <Location />
          <Toolbar />
        </ButtonToolbar>
        <br/>
        <Alert />
        {this.renderList()}
        <BottomBar />
        {this.props.preview ? <Preview /> : ''}
        {this.props.loading ? <div className="loading"><Spinner /></div> : ''}
      </Grid>
    );
  }
}

const mapStateToProps = state => ({
  view: state.ui.view,
  loading: state.ui.loading,
  bookmarks: state.bookmarks,
  preview: state.preview,
  ui: state.ui,
});

export default connect(mapStateToProps)(App);
