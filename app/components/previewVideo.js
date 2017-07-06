import { connect } from 'react-redux';
import React from 'react';
import ReactPlayer from 'react-player';
import { locToUrl, calcDisplaySize } from '../common/util';
import annotations from '../annotations';

class PreviewVideo extends React.Component {
  playlist = null;
  static propTypes = {
    dispatch: React.PropTypes.func,
    loc: React.PropTypes.object,
    preview: React.PropTypes.object,
    containers: React.PropTypes.array,
    storageaccount: React.PropTypes.string,
  };

  handleLoadState() {
    this.playlist = window.loadAnnotation();
    window.loadEmitter(this.playlist);
    const fullpath = locToUrl(this.props.loc);
    let index = fullpath.lastIndexOf('/');
    let containerName = this.props.containers[fullpath.substring(index+1)];
    
    const src = `https://${this.props.storageaccount}.blob.core.windows.net/${containerName}/${this.props.preview.name}`;
    window.playFile(this.playlist, src);
  };

  componentDidMount() {
    this.handleLoadState();
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
      position: 'absolute',
      width: '100%',
      textAlign: 'center',
      color: '#ccc',
    };
    const imageStyle = {
      position: 'relative',
      display: 'block',
      left: '400px',
      top: '40px',
    };

    const outWidth = window.document.documentElement.clientWidth;
    const outHeight = window.document.documentElement.clientHeight;
    const displaySize = calcDisplaySize(outWidth, outHeight, outWidth, outHeight);
    preStyle.width = `${displaySize.width}px`;
    preStyle.height = `${displaySize.height}px`;
    preStyle.left = `${(outWidth - displaySize.width) / 2}px`;
    preStyle.top = `${(outHeight - displaySize.height) / 2}px`;

    const captionY = (outHeight - displaySize.height) / 2 + displaySize.height;
    captionStyle.top = `${captionY}px`;
    const preImgStyleY = (outHeight - displaySize.height) / 2;
    preImgStyle.top = `${preImgStyleY}px`;

    const fullpath = locToUrl(this.props.loc);
    let index = fullpath.lastIndexOf('/');
    let containerName = this.props.containers[fullpath.substring(index+1)];
    
    const src = `https://${this.props.storageaccount}.blob.core.windows.net/${containerName}/${this.props.preview.name}`;
    let imageFileName = this.props.preview.name.substring(0, this.props.preview.name.lastIndexOf('.'));

    const imgsrc = `https://${this.props.storageaccount}.blob.core.windows.net/${containerName}/${imageFileName}.png`;
    
    return (
      <div>
        <div style={preStyle}>
          <div id="top-bar" className="playlist-top-bar">
            <div className="playlist-toolbar">
              <div className="btn-group">
                <span className="btn-pause btn btn-warning">
                  <i className="fa fa-pause"></i>
                </span>
                <span className="btn-play btn btn-success">
                  <i className="fa fa-play"></i>
                </span>
                <span className="btn-stop btn btn-danger">
                  <i className="fa fa-stop"></i>
                </span>
                <span className="btn-rewind btn btn-success">
                  <i className="fa fa-fast-backward"></i>
                </span>
                <span className="btn-fast-forward btn btn-success">
                  <i className="fa fa-fast-forward"></i>
                </span>
              </div>
              <div className="btn-group">
                <span title="zoom in" className="btn-zoom-in btn btn-default">
                  <i className="fa fa-search-plus"></i>
                </span>
                <span title="zoom out" className="btn-zoom-out btn btn-default">
                  <i className="fa fa-search-minus"></i>
                </span>
              </div>
              <div className="btn-group btn-playlist-state-group">
                <span className="btn-cursor btn btn-default active" title="select cursor">
                  <i className="fa fa-headphones"></i>
                </span>
                <span className="btn-select btn btn-default" title="select audio region">
                  <i className="fa fa-italic"></i>
                </span>
              </div>
              <div className="btn-group btn-select-state-group">
                <span className="btn-loop btn btn-success disabled" title="loop a selected segment of audio">
                  <i className="fa fa-repeat"></i>
                </span>
                <span title="keep only the selected audio region for a track"
                      className="btn-trim-audio btn btn-primary disabled">Trim</span>
              </div>
              <div className="btn-group">
                <span title="Download the annotations as json" className="btn-annotations-download btn btn-success">Download JSON</span>
                <span title="Download the current file" className="btn btn-download btn-primary">
                  <i className="fa fa-download"></i>
                </span>
              </div>
            </div>
          </div>
          <div id="playlist" style={playlistStyle}></div>
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
