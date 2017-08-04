// @flow
import { connect } from 'react-redux';
import React from 'react';
import { SplitButton, MenuItem } from 'react-bootstrap';
import * as actions from '../actions';

class Container extends React.Component {
  static propTypes = {
    dispatch: React.PropTypes.func,
    loc: React.PropTypes.object,
    containers: React.PropTypes.array,
  };

  handleContainerClick = (e) => {
    const index = parseInt(e.target.dataset.index, 10);
    const loc = { container: index, dir: [] };
    this.props.dispatch(actions.changeLoc(loc));
  };

  handleRootClick = () => {
    const loc = { container: this.props.loc.container, dir: [] };
    this.props.dispatch(actions.changeLoc(loc));
  };

  render() {
    return (
      <SplitButton
        id="location"
        bsStyle="primary"
        title={this.props.containers[this.props.loc.container].name}
        onClick={this.handleRootClick}
      >
        {this.props.containers.map((container, index) =>
          (<MenuItem key={index} onClick={this.handleContainerClick} data-index={index}>
            {container.name}
          </MenuItem>),
        )}
      </SplitButton>
    );
  }
}

const mapStateToProps = state => ({
  containers: state.containers,
  loc: state.loc,
});

export default connect(mapStateToProps)(Container);
