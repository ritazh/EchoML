import { connect } from 'react-redux';
import React from 'react';
import { locToUrl, calcDisplaySize } from '../common/util';
import { loadAnnotation, loadLabels, playFile } from '../annotations';
import { loadEmitter } from '../emitter';
import * as actions from '../actions';
import Alert from './alert';

class PreviewVideo extends React.Component {
  playlist = null;
  static propTypes = {
    dispatch: React.PropTypes.func,
    loc: React.PropTypes.object,
    preview: React.PropTypes.object,
    containers: React.PropTypes.array,
    storageaccount: React.PropTypes.string,
  };

  saveLabels() {
    const fullpath = locToUrl(this.props.loc);
    const index = fullpath.lastIndexOf('/');
    const containerName = this.props.containers[fullpath.substring(index + 1)];
    const src = `https://${this.props
      .storageaccount}.blob.core.windows.net/${containerName}/${this.props
      .preview.name}`;
    this.props.dispatch(
      actions.saveLabels(src, this.playlist.annotationList.annotations),
    );
  }

  handleLoadState() {
    const labels = loadLabels(this.props.preview.labels);
    this.playlist = loadAnnotation(labels);

    loadEmitter(this.playlist);
    const fullpath = locToUrl(this.props.loc);
    const index = fullpath.lastIndexOf('/');
    const containerName = this.props.containers[fullpath.substring(index + 1)];

    const src = `https://${this.props
      .storageaccount}.blob.core.windows.net/${containerName}/${this.props
      .preview.name}`;

    const spectrogramsrc = `https://${this.props
      .storageaccount}.blob.core.windows.net/${containerName}/${this.props
      .preview.name}`.replace('.flac', '.png');

    playFile(this.playlist, src, spectrogramsrc);
  }

  componentDidMount() {
    this.handleLoadState();
  }

  componentWillUnmount() {
    // fixes issue with 'AudioContext': number of hardware contexts reached maximum
    this.playlist.ac.close();
  }

  render() {
    const preImgStyle = {
      position: 'absolute',
      width: '100%',
      textAlign: 'center',
      color: '#ccc',
    };
    const preStyle = {
      position: 'relative',
      display: 'block',
      overflow: 'hidden',
    };
    const playlistStyle = {
      background: '#fff',
    };
    const captionStyle = {
      position: 'relative',
      width: '100%',
      textAlign: 'center',
    };
    const imageStyle = {
      position: 'relative',
      display: 'block',
      left: '400px',
      top: '40px',
    };

    const outWidth = window.document.documentElement.clientWidth;
    const outHeight = window.document.documentElement.clientHeight;
    const displaySize = calcDisplaySize(
      outWidth,
      outHeight,
      outWidth,
      outHeight,
    );
    preStyle.width = `${displaySize.width}px`;
    preStyle.height = `${displaySize.height}px`;
    preStyle.left = `${(outWidth - displaySize.width) / 2}px`;
    preStyle.top = `${(outHeight - displaySize.height) / 2}px`;

    playlistStyle.height = `${displaySize.height / 2}px`;
    captionStyle.bottom = `${displaySize.height / 3}px`;

    const preImgStyleY = (outHeight - displaySize.height) / 2;
    preImgStyle.top = `${preImgStyleY}px`;

    const fullpath = locToUrl(this.props.loc);
    const index = fullpath.lastIndexOf('/');
    const containerName = this.props.containers[fullpath.substring(index + 1)];

    const src = `https://${this.props
      .storageaccount}.blob.core.windows.net/${containerName}/${this.props
      .preview.name}`;
    const imageFileName = this.props.preview.name.substring(
      0,
      this.props.preview.name.lastIndexOf('.'),
    );

    const imgsrc = `https://${this.props
      .storageaccount}.blob.core.windows.net/${containerName}/${imageFileName}.png`;

    return (
      <div>
        <div style={preStyle}>
          <Alert />
          <div id="top-bar" className="playlist-top-bar">
            <div className="playlist-toolbar">
              <div className="btn-group">
                <span className="btn-pause btn btn-warning">
                  <i className="fa fa-pause" />
                </span>
                <span className="btn-play btn btn-success">
                  <i className="fa fa-play" />
                </span>
                <span className="btn-stop btn btn-danger">
                  <i className="fa fa-stop" />
                </span>
                <span className="btn-rewind btn btn-success">
                  <i className="fa fa-fast-backward" />
                </span>
                <span className="btn-fast-forward btn btn-success">
                  <i className="fa fa-fast-forward" />
                </span>
              </div>
              <div className="btn-group">
                <span title="zoom in" className="btn-zoom-in btn btn-default">
                  <i className="fa fa-search-plus" />
                </span>
                <span title="zoom out" className="btn-zoom-out btn btn-default">
                  <i className="fa fa-search-minus" />
                </span>
              </div>
              <div className="btn-group btn-playlist-state-group">
                <span
                  className="btn-cursor btn btn-default active"
                  title="select cursor"
                >
                  <i className="fa fa-headphones" />
                </span>
                <span
                  className="btn-select btn btn-default"
                  title="select audio region"
                >
                  <i className="fa fa-italic" />
                </span>
              </div>
              <div className="btn-group btn-select-state-group">
                <span
                  className="btn-loop btn btn-success disabled"
                  title="loop a selected segment of audio"
                >
                  <i className="fa fa-repeat" />
                </span>
                <span
                  title="keep only the selected audio region for a track"
                  className="btn-trim-audio btn btn-primary disabled"
                >
                  Trim
                </span>
              </div>
              <div className="btn-group" onClick={e => this.saveLabels()}>
                <span
                  title="Save the labels as json"
                  className="btn-annotations-download btn btn-success"
                >
                  Save Labels
                </span>
              </div>
            </div>
          </div>
          <div id="playlist" style={playlistStyle} />
        </div>

        <div style={captionStyle}>
          {this.props.preview.name}
        </div>
      </div>
    );
  }
}

const mapStateToProps = state => ({
  loc: state.loc,
  preview: state.preview,
  containers: state.containers,
  storageaccount: state.storageaccount,
});

export default connect(mapStateToProps)(PreviewVideo);
