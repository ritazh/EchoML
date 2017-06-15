import { connect } from 'react-redux';
import * as actions from '../actions';
import React from 'react';
import { SplitButton, MenuItem } from 'react-bootstrap';

class Bookmark extends React.Component {
  static propTypes = {
    dispatch: React.PropTypes.func,
    loc: React.PropTypes.object,
    bookmarks: React.PropTypes.array,
  };

  handleBookmarkClick = e => {
    const index = parseInt(e.target.dataset.index, 10);
    const loc = { bookmark: index, dir: [] };
    this.props.dispatch(actions.changeLoc(loc));
  };

  handleRootClick = () => {
    const loc = { bookmark: this.props.loc.bookmark, dir: [] };
    this.props.dispatch(actions.changeLoc(loc));
  };

  render() {
    return (
      <SplitButton
        id="location"
        bsStyle="primary"
        title={this.props.bookmarks[this.props.loc.bookmark]}
        onClick={this.handleRootClick}
      >
        {this.props.bookmarks.map((bookmark, index) => (
          <MenuItem key={index} onClick={this.handleBookmarkClick} data-index={index}>
            {bookmark}
          </MenuItem>
        ))}
      </SplitButton>
    );
  }
}

const mapStateToProps = state => ({
  bookmarks: state.bookmarks,
  loc: state.loc,
});

export default connect(mapStateToProps)(Bookmark);
