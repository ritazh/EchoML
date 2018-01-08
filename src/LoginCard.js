import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Card, { CardActions, CardContent } from 'material-ui/Card';
import Button from 'material-ui/Button';
import Typography from 'material-ui/Typography';
import TextField from 'material-ui/TextField';
import { login, register } from './lib/auth';
import { CircularProgress } from 'material-ui/Progress';

class LoginCard extends Component {
  constructor(props) {
    super(props);
    this.state = {
      email: '',
      password: '',
      passwordConfirm: '',
      errorMessage: '',
      showRegistration: false,
      isLoading: false,
      ...props,
    };
  }

  login = async () => {
    this.setState({ isLoading: true });
    try {
      const response = await login(this.state.email, this.state.password);
      if (response.status === 401) {
        const json = await response.json();
        this.setState({
          errorMessage: json.message,
        });
      } else {
        this.props.onLogin(this.state.email, this.state.password);
      }
    } catch (err) {
      this.setState({
        errorMessage: err.message,
      });
    }
    this.setState({ isLoading: false });
  };

  register = async () => {
    this.setState({ isLoading: true });
    try {
      const { email, password, passwordConfirm } = this.state;
      if (password !== passwordConfirm) {
        throw new Error('Passwords do not match');
      }

      const message = await register(email, password);
      this.setState({
        errorMessage: message,
      });
    } catch (err) {
      this.setState({
        errorMessage: err.message,
      });
    }
    this.setState({ isLoading: false });
  };

  handleChange = name => (event) => {
    this.setState({
      [name]: event.target.value,
    });
  };

  render() {
    return (
      <div className="LoginPage">
        <Card>
          <CardContent>
            <Typography type="body1">Welcome to EchoML</Typography>
            <Typography type="headline" component="h2">
              Connect to EchoML Below
            </Typography>
            <Typography type="body1">
              Note: credentials are used only locally and never leave your browser
            </Typography>
            <TextField
              defaultValue={this.props.email}
              onChange={(e) => {
                this.setState({ email: e.target.value });
              }}
              type="email"
              label="Email"
              InputLabelProps={{
                shrink: true,
              }}
              fullWidth
              margin="normal"
            />
            <TextField
              defaultValue={this.props.password}
              onChange={(e) => {
                this.setState({ password: e.target.value });
              }}
              type="password"
              label="Password"
              InputLabelProps={{
                shrink: true,
              }}
              fullWidth
              margin="normal"
            />
            {this.state.showRegistration && (
              <TextField
                onChange={(e) => {
                  this.setState({ passwordConfirm: e.target.value });
                }}
                type="password"
                label="Confirm Password"
                InputLabelProps={{
                  shrink: true,
                }}
                fullWidth
                margin="normal"
              />
            )}
            {this.state.errorMessage && <pre style={{ margin: 0 }}>{this.state.errorMessage}</pre>}
          </CardContent>
          <CardActions>
            {this.state.showRegistration ? (
              <div>
                <Button
                  dense
                  color="accent"
                  disabled={this.state.isLoading}
                  onClick={() => {
                    this.register();
                  }}
                >
                  Register
                </Button>
                <Button
                  dense
                  color="primary"
                  onClick={() => {
                    this.setState({ showRegistration: false, errorMessage: '' });
                  }}
                >
                  Back to Login
                </Button>
              </div>
            ) : (
              <div>
                <Button
                  dense
                  disabled={this.state.isLoading}
                  color="accent"
                  onClick={() => {
                    this.login();
                  }}
                >
                  Login
                </Button>
                <Button
                  dense
                  color="primary"
                  onClick={() => {
                    this.setState({ showRegistration: true, errorMessage: '' });
                  }}
                >
                  Register
                </Button>
              </div>
            )}
          </CardActions>
        </Card>
      </div>
    );
  }
}

LoginCard.propTypes = {
  onLogin: PropTypes.func.isRequired,
  email: PropTypes.string,
  password: PropTypes.string,
};

LoginCard.defaultProps = {
  email: '',
  password: '',
};

export default LoginCard;
