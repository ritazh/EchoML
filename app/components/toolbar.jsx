import { connect } from 'react-redux';
import React from 'react';
import { ButtonGroup, ButtonToolbar, Button, Glyphicon, Modal, FormControl } from 'react-bootstrap';
import FontAwesome from 'react-fontawesome';
import { createFolder, logout } from '../actions';

class Toolbar extends React.Component {
  static propTypes = {
    dispatch: React.PropTypes.func,
    view: React.PropTypes.string,
    loc: React.PropTypes.object,
  };

  handleListView = () => {
    this.props.dispatch({ type: 'CHANGE_VIEW', view: 'list' });
  };

  handleLogout = () => {
    this.props.dispatch(logout());
  };

  render() {
    return (
      <ButtonToolbar className="pull-right">
        <ButtonGroup>
          <Button
            active={this.props.view === 'list'}
            onClick={this.handleListView}
          >
            <Glyphicon glyph="th-list" />
          </Button>
        </ButtonGroup>
        <ButtonGroup>
          <Button
            onClick={this.handleLogout}
          >
            <FontAwesome name="sign-out" />
          </Button>
        </ButtonGroup>
      </ButtonToolbar>
    );
  }
}

const mapStateToProps = state => ({
  view: state.ui.view,
  loc: state.loc,
});

export default connect(mapStateToProps)(Toolbar);
