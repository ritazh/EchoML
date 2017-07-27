import { connect } from 'react-redux';
import React from 'react';
import ReactDOM from 'react-dom';
import * as actions from '../actions';
import {
  Grid,
  Row,
  Col,
  Panel,
  Button,
  FormGroup,
  ControlLabel,
  FormControl,
  Alert,
} from 'react-bootstrap';
import { RegistrationForm } from './register';

class Login extends React.Component {
  static propTypes = {
    dispatch: React.PropTypes.func,
    loginMessage: React.PropTypes.string,
  };

  state = {
    showRegister: false,
  };

  componentDidMount() {
    window.addEventListener('popstate', this.handlePopState);
    this.props.dispatch(actions.initApp());
  }

  componentWillUnmount() {
    window.removeEventListener('popstate', this.handlePopState);
  }

  handleLogin = (e /* : Event */) => {
    e.preventDefault(); // prevent real form submission
    const email = this.email.value;
    const password = this.password.value;
    this.props.dispatch(actions.login(email, password));
  };

  handleRegister = (username /* :string*/, password /* :string*/) => {
    this.props.dispatch(actions.saveUser(username, password)).then((json) => {
      console.log(json);
    });
  };

  enableRegistrationFrom = () => {
    this.setState({
      showRegister: true,
    });
  };

  renderAlert() {
    if (!this.props.loginMessage) {
      return '';
    }

    return (
      <Alert bsStyle="info">
        {this.props.loginMessage}
      </Alert>
    );
  }

  render() {
    return (
      <Grid>
        <Row>
          <Col md={10} mdOffset={1} xs={12}>
            <Panel>
              {this.renderAlert()}
              {this.state.showRegister
                ? RegistrationForm({
                  onSubmit: this.handleRegister,
                  onExit: () => {
                    this.setState({
                      ...this.state,
                      showRegister: false,
                    });
                  },
                })
                : <form>
                  <FormGroup>
                    <ControlLabel>Email</ControlLabel>
                    <FormControl
                      inputRef={(input) => {
                        this.email = input;
                      }}
                      type="text"
                      autoFocus
                    />
                  </FormGroup>
                  <FormGroup>
                    <ControlLabel>Password</ControlLabel>
                    <FormControl
                      inputRef={(input) => {
                        this.password = input;
                      }}
                      type="password"
                    />
                  </FormGroup>
                  <br />
                  <Button bsStyle="primary" onClick={e => this.handleLogin(e)} type="submit">
                      Login
                    </Button>
                  <Button
                    style={{ float: 'right' }}
                    bsStyle="info"
                    onClick={this.enableRegistrationFrom}
                  >
                      Register Now
                    </Button>
                </form>}
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
