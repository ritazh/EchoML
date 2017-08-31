// @flow
import React from 'react';
import { Button, FormGroup, ControlLabel, FormControl } from 'react-bootstrap';

export function RegistrationForm({ onSubmit, onExit, options }) {
  // Local State ===============================================================
  let email /* : {value: string} */ = { value: '' };
  let password /* : {value: string} */ = { value: '' };
  let passwordConfirmation /* : {value: string} */ = { value: '' };

  /**
   * Regex for email validation
   */
  const emailRegex /* : RegExp */ = /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[-;:&=+$,\w]+@)?[A-Za-z0-9.-]+|(?:www\.|[-;:&=+$,\w]+@)[A-Za-z0-9.-]+)((?:\/[+~%/.\w\-_]*)?\??(?:[-+=&;%@.\w_]*)#?(?:[.!/\\\w]*))?)/i;

  const handleSubmit = (e /* : Event */) => {
    e.preventDefault();
    const emailVal = email.value;
    const passwordVal = password.value;
    const passwordConfirmationVal = passwordConfirmation.value;

    if (
      emailVal.match(emailRegex) &&
      passwordVal.length > 6 &&
      passwordVal === passwordConfirmationVal
    ) {
      onSubmit(emailVal, passwordVal);
    }
  };

  // Notes: ====================================================================
  // - React Bootstrap uses non standard ref tag 'inputRef'
  return (
    <div className="RegistrationForm">
      <form>
        <FormGroup>
          <ControlLabel>Email</ControlLabel>
          <FormControl
            inputRef={input => (email = input)}
            type="email"
            autoFocus
          />
        </FormGroup>
        <FormGroup>
          <ControlLabel>Password</ControlLabel>
          <FormControl inputRef={input => (password = input)} type="password" />
        </FormGroup>
        <FormGroup>
          <ControlLabel>Confirm Password</ControlLabel>
          <FormControl
            inputRef={input => (passwordConfirmation = input)}
            type="password"
          />
        </FormGroup>
        <Button bsStyle="primary" onClick={e => handleSubmit(e)} type="submit">
          Register
        </Button>
        <Button style={{ float: 'right' }} bsStyle="info" onClick={onExit}>
          Back to Login
        </Button>
      </form>
    </div>
  );
}
