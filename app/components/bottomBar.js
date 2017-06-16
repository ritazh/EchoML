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
  };

  handleDownload = e => {
    e.stopPropagation(); // to prevent clearing selection
    const selectedFiles = this.props.files.filter(file => file.selected);
    const fullpath = locToUrl(this.props.loc);
    for (const file of selectedFiles) {
      window.open(`${API_HOST}/api/download${fullpath}/${file.name}`);
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
    if (selectedFiles.length === 1 && !selectedFiles[0].isDirectory) {
      files = selectedFiles[0].name;
      content = (
        <Navbar.Text>
          {files}
          {' '}
          <a
            href={`${API_HOST}/api/download${fullpath}/${selectedFiles[0].name}`}
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
  loc: state.loc,
  files: state.files,
});

export default connect(mapStateToProps)(BottomBar);
