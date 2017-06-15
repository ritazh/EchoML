import { connect } from 'react-redux';
import * as actions from '../actions';
import React from 'react';
import ReactDOM from 'react-dom';
import { Grid, Row, Col, Panel, Button, FormGroup, ControlLabel,
  FormControl, Alert } from 'react-bootstrap';

class Login extends React.Component {
  static propTypes = {
    dispatch: React.PropTypes.func,
    loginMessage: React.PropTypes.string,
  };

  componentDidMount() {
    window.addEventListener('popstate', this.handlePopState);
    this.props.dispatch(actions.initApp());
  }

  componentWillUnmount() {
    window.removeEventListener('popstate', this.handlePopState);
  }

  handleLogin = () => {
    const account = ReactDOM.findDOMNode(this.refs.account).value;
    const password = ReactDOM.findDOMNode(this.refs.password).value;
    this.props.dispatch(actions.login(account, password));
  };

  renderAlert() {
    if (!this.props.loginMessage) {
      return '';
    }

    return (
      <Alert bsStyle="danger">
        {this.props.loginMessage}
      </Alert>
    );
  }

  render() {
    return (
      <Grid>
        <Row>
          <Col lg={4} md={4} sm={8} xs={12}>
            <Panel>
              {this.renderAlert()}
              <FormGroup>
                <ControlLabel>Account</ControlLabel>
                <FormControl ref="account" type="text" autoFocus />
              </FormGroup>
              <FormGroup>
                <ControlLabel>Password</ControlLabel>
                <FormControl ref="password" type="password" />
              </FormGroup>
              <Button
                bsStyle="primary"
                onClick={this.handleLogin}
              >
                Login
              </Button>
            </Panel>
          </Col>
        </Row>
      </Grid>
    );
  }
}

const mapStateToProps = state => ({
  loginMessage: state.ui.loginMessage,
});

export default connect(mapStateToProps)(Login);
