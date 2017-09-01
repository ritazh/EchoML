import { connect } from 'react-redux';
import { ProgressBar } from 'react-bootstrap';
import Dropzone from 'react-dropzone';
import React from 'react';
import request from 'superagent';
import * as actions from '../actions';

class Upload extends React.Component {
  static propTypes = {
    dispatch: React.PropTypes.func,
    loc: React.PropTypes.object,
  };

  state = {
    upload: [],
    progress: 0,
  };

  handleFileDrop = (files) => {
    this.setState({ upload: files });

    const curFullPath = `/${this.props.loc.bookmark}/${this.props.loc.dir.join(
      '/',
    )}`;
    const req = request.post(`${API_HOST}/api/upload${curFullPath}`);
    files.forEach((file) => {
      req.attach(file.name, file, file.name);
    });
    req
      .on('progress', (e) => {
        this.setState({ progress: Math.trunc(e.percent) });
      })
      .end((err) => {
        this.handleUploadEnded(err);
        this.setState({ upload: [] });
      });
  };

  handleUploadEnded = (err) => {
    if (err) {
      this.props.dispatch({
        type: 'SHOW_ALERT',
        alert: { type: 'danger', message: err.toString() },
      });
    } else {
      this.props.dispatch({
        type: 'SHOW_ALERT',
        alert: { type: 'success', message: 'Success' },
      });
    }

    this.props.dispatch(actions.updateFiles(this.props.loc));
  };

  render() {
    const dropzoneStyle = {
      width: '100%',
      height: '50px',
      lineHeight: '50px',
      margin: '15px 0px',
      textAlign: 'center',
      backgroundColor: '#EEE',
      borderRadius: '5px',
      border: '2px dashed #C7C7C7',
    };

    const dropzoneActiveStyle = JSON.parse(JSON.stringify(dropzoneStyle));
    dropzoneActiveStyle.backgroundColor = '#AAA';
    dropzoneActiveStyle.border = '2px dashed black';

    const uploadStyle = {
      position: 'relative',
      width: '100%',
      height: '50px',
      margin: '15px 0px',
    };

    const progressStyle = {
      position: 'absolute',
      bottom: '0px',
      left: '0px',
      right: '0px',
      marginBottom: '0px',
    };

    if (this.state.upload.length === 0) {
      return (
        <Dropzone
          style={dropzoneStyle}
          activeStyle={dropzoneActiveStyle}
          onDrop={this.handleFileDrop}
        >
          Drag files to upload
        </Dropzone>
      );
    }

    return (
      <div style={uploadStyle}>
        <div>Uploading {this.state.upload.length} files...</div>
        <ProgressBar
          style={progressStyle}
          active
          now={this.state.progress}
          label={`${this.state.progress}%`}
        />
      </div>
    );
  }
}

const mapStateToProps = state => ({
  alert: state.alert,
  loc: state.loc,
});

export default connect(mapStateToProps)(Upload);
