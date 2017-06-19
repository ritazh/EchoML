import { connect } from 'react-redux';
import * as actions from '../actions';
import React from 'react';
import { Navbar, Button, Modal } from 'react-bootstrap';
import { locToUrl } from '../common/util';

class BottomBar extends React.Component {
  static propTypes = {
    dispatch: React.PropTypes.func,
    loc: React.PropTypes.object,
    files: React.PropTypes.array,
    containers: React.PropTypes.array,
  };

  handleDownload = e => {
    e.stopPropagation(); // to prevent clearing selection
    const selectedFiles = this.props.files.filter(file => file.selected);
    const fullpath = locToUrl(this.props.loc);
    for (const file of selectedFiles) {
      //window.open(`${API_HOST}/api/download${fullpath}/${file.name}`);
      window.open(`https://${process.env.AZURE_STORAGE_ACCOUNT}.blob.core.windows.net/facedetectbot/${file.name}`);
    }
  };

  render() {
    const selectedFiles = this.props.files.filter(file => file.selected);
    if (selectedFiles.length === 0) {
      return <div></div>;
    }

    const fullpath = locToUrl(this.props.loc);
    let files = '';
    let content = '';
    let index = fullpath.lastIndexOf('/');
    let containerName = this.props.containers[fullpath.substring(index+1)];

    if (selectedFiles.length === 1 && !selectedFiles[0].isDirectory) {
      files = selectedFiles[0].name;
      content = (
        <Navbar.Text>
          {files}
          {' '}
          <a
            href={`https://ndbenqueueritabfa6.blob.core.windows.net/${containerName}/${selectedFiles[0].name}`}
            className="btn btn-default btn-sm"
            download
          >
            Download
          </a>
        </Navbar.Text>
      );
    }

    return (
      <Navbar fixedBottom style={{ boxShadow: '0px 0px 10px #888' }}>
        {content}
      </Navbar>
    );
  }
}

const mapStateToProps = state => ({
  containers: state.containers,
  loc: state.loc,
  files: state.files,
});

export default connect(mapStateToProps)(BottomBar);
