import { ButtonGroup, Button } from 'react-bootstrap';
import { connect } from 'react-redux';
import React from 'react';
import * as actions from '../actions';

class Location extends React.Component {
  static propTypes = {
    dispatch: React.PropTypes.func,
    loc: React.PropTypes.object,
  };

  handleClick = (e) => {
    const index = parseInt(e.target.dataset.index, 10);
    const dir = this.props.loc.dir.slice(0, index);
    const loc = { container: this.props.loc.container, dir };
    this.props.dispatch(actions.changeLoc(loc));
  };

  render() {
    return (
      <ButtonGroup>
        {this.props.loc.dir.map((name, index) => (
          <Button key={index} onClick={this.handleClick} data-index={index + 1}>
            {name}
          </Button>
        ))}
      </ButtonGroup>
    );
  }
}

const mapStateToProps = state => ({
  loc: state.loc,
});

export default connect(mapStateToProps)(Location);
