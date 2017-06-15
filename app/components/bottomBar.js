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

  state = {
    showDeleteConfirm: false,
  };

  handleDownload = e => {
    e.stopPropagation(); // to prevent clearing selection
    const selectedFiles = this.props.files.filter(file => file.selected);
    const fullpath = locToUrl(this.props.loc);
    for (const file of selectedFiles) {
      window.open(`${API_HOST}/api/download${fullpath}/${file.name}`);
    }
  };

  handleConfirm = e => {
    e.stopPropagation(); // to prevent clearing selection
    this.setState({ showDeleteConfirm: true });
  };

  handleModalClose = e => {
    e.stopPropagation(); // to prevent clearing selection
    this.setState({ showDeleteConfirm: false });
  };

  handleModalDelete = e => {
    e.stopPropagation(); // to prevent clearing selection
    this.setState({ showDeleteConfirm: false });

    const selectedFiles = this.props.files.filter(file => file.selected);
    const names = selectedFiles.map(file => file.name);
    this.props.dispatch(actions.deleteFiles(this.props.loc, names));
  };

  render() {
    const selectedFiles = this.props.files.filter(file => file.selected);
    if (selectedFiles.length === 0) {
      return <div></div>;
    }

    const fullpath = locToUrl(this.props.loc);
    let files = '';
    let content = '';
    if (selectedFiles.length === 1) {
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
          {' '}
          <Button
            bsSize="sm"
            bsStyle="danger"
            onClick={this.handleConfirm}
          >
            Delete
          </Button>
        </Navbar.Text>
      );
    } else {
      files = `${selectedFiles.length} files`;
      content = (
        <Navbar.Text>
          {files}
          {' '}
          <Button
            bsSize="sm"
            bsStyle="danger"
            onClick={this.handleConfirm}
          >
            Delete
          </Button>
        </Navbar.Text>
      );
    }

    let modal = '';
    if (this.state.showDeleteConfirm) {
      modal = (
        <Modal show onHide={this.handleModalClose}>
          <Modal.Header>
            <Modal.Title>Confirm</Modal.Title>
          </Modal.Header>

          <Modal.Body>
            Do you want to delete {files}?
          </Modal.Body>

          <Modal.Footer>
            <Button onClick={this.handleModalClose}>Close</Button>
            <Button onClick={this.handleModalDelete} bsStyle="danger">Delete</Button>
          </Modal.Footer>
        </Modal>
      );
    }

    return (
      <Navbar fixedBottom style={{ boxShadow: '0px 0px 10px #888' }}>
        {content}
        {modal}
      </Navbar>
    );
  }
}

const mapStateToProps = state => ({
  loc: state.loc,
  files: state.files,
});

export default connect(mapStateToProps)(BottomBar);
