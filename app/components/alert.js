import { connect } from 'react-redux';
import React from 'react';
import { Alert as BSAlert } from 'react-bootstrap';

class Alert extends React.Component {
  static propTypes = {
    dispatch: React.PropTypes.func,
    alert: React.PropTypes.object,
  };

  render() {
    if (!this.props.alert) {
      return <div></div>;
    }

    const alertStyle = {
      width: '100%',
      marginTop: '10px',
      padding: '5px 10px',
    };

    return (
      <BSAlert bsStyle={this.props.alert.type} style={alertStyle}>
        {this.props.alert.message}
      </BSAlert>
    );
  }
}

const mapStateToProps = state => ({
  bookmarks: state.bookmarks,
  alert: state.alert,
});

export default connect(mapStateToProps)(Alert);
