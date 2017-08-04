import { connect } from 'react-redux';
import React from 'react';
import { Navbar } from 'react-bootstrap';
import { locToUrl } from '../common/util';
import * as actions from '../actions';

class BottomBar extends React.Component {
  static propTypes = {
    dispatch: React.PropTypes.func,
    loc: React.PropTypes.object,
    files: React.PropTypes.array,
    containers: React.PropTypes.array,
  };

  state = {
    downloadUrl: null,
  };

  componentWillReceiveProps(nextProps) {
    const selectedFiles = nextProps.files.filter(file => file.selected);
    if (selectedFiles.length > 0) {
      const fullpath = locToUrl(nextProps.loc);
      const index = fullpath.lastIndexOf('/');
      const containerName = nextProps.containers[fullpath.substring(index + 1)].name;
      const storageAccount = nextProps.containers[fullpath.substring(index + 1)].storageAccount;

      nextProps
        .dispatch(actions.downloadFile(storageAccount, containerName, selectedFiles[0].name))
        .then((downloadUrl) => {
          this.setState({
            downloadUrl,
          });
        });
    }
  }

  render() {
    const selectedFiles = this.props.files.filter(file => file.selected);
    if (selectedFiles.length === 0) {
      return <div />;
    }

    let files = '';
    let content = '';

    if (selectedFiles.length === 1 && !selectedFiles[0].isDirectory) {
      files = selectedFiles[0].name;
      content = (
        <Navbar.Text>
          {files}{' '}
          <a
            href={this.state.downloadUrl}
            className="btn btn-default btn-sm"
            download={selectedFiles[0].name}
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
