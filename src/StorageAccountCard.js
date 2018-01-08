import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Card, { CardActions, CardContent } from 'material-ui/Card';
import Button from 'material-ui/Button';
import Typography from 'material-ui/Typography';
import TextField from 'material-ui/TextField';
import { addStorageAccount } from './lib/azure';

class StorageAccountCard extends Component {
  constructor(props) {
    super(props);
    this.state = {
      name: '',
      accessKey: '',
      errorMessage: '',
      isLoading: false,
      ...props,
    };
  }

  handleChange = name => (event) => {
    this.setState({
      [name]: event.target.value,
    });
  };

  handleAdd = async () => {
    try {
      const response = await addStorageAccount(this.state.name, this.state.accessKey);
      console.log(response);
    } catch (err) {
      this.setState({ errorMessage: err });
    }
  };

  render() {
    return (
      <div className="LoginPage">
        <Card>
          <CardContent>
            <Typography type="body1">Dont see your container?</Typography>
            <Typography type="headline" component="h2">
              Add Azure Storage Account
            </Typography>
            <TextField
              defaultValue={this.props.name}
              onChange={(e) => {
                this.setState({ name: e.target.value });
              }}
              type="string"
              label="Storage Account Name"
              InputLabelProps={{
                shrink: true,
              }}
              fullWidth
              margin="normal"
            />
            <TextField
              defaultValue={this.props.accessKey}
              onChange={(e) => {
                this.setState({ accessKey: e.target.value });
              }}
              type="password"
              label="Access Key"
              InputLabelProps={{
                shrink: true,
              }}
              fullWidth
              margin="normal"
            />
            {this.state.errorMessage && <pre style={{ margin: 0 }}>{this.state.errorMessage}</pre>}{' '}
          </CardContent>
          <CardActions>
            <div>
              <Button
                dense
                disabled={this.state.isLoading}
                color="accent"
                onClick={() => {
                  addStorageAccount(this.state.name, this.state.accessKey);
                }}
              >
                Add Account
              </Button>
            </div>
          </CardActions>
        </Card>
      </div>
    );
  }
}

StorageAccountCard.propTypes = {
  onLogin: PropTypes.func,
  name: PropTypes.string,
  accessKey: PropTypes.string,
};

StorageAccountCard.defaultProps = {
  onLogin: () => {},
  name: '',
  accessKey: '',
};

export default StorageAccountCard;
