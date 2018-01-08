/**
 * @param {string} email
 * @param {string} password
 */
export function login(email, password) {
  return fetch('/login', {
    credentials: 'include',
    method: 'post',
    headers: new Headers({
      'Content-Type': 'application/json',
    }),
    body: JSON.stringify({ email, password }),
  });
}

/**
 * @param {string} email
 * @param {string} password
 * @return {Promise<string>} registration status message
 */
export async function register(email, password) {
  try {
    const response = await fetch('/register', {
      credentials: 'include',
      method: 'post',
      headers: new Headers({
        'Content-Type': 'application/json',
      }),
      body: JSON.stringify({ email, password }),
    });

    const { message } = await response.json();
    return message;
  } catch (err) {
    throw new Error(err.message);
  }
}

export async function isLoggedIn() {
  try {
    const fetchOptions = {
      credentials: 'include',
      method: 'post',
      headers: new Headers({
        'Content-Type': 'application/json',
      }),
    };
    const response = await fetch('/is-logged-in', fetchOptions);
    const bool = await response.json();
    return bool;
  } catch (err) {
    throw new Error(err.message);
  }
}
