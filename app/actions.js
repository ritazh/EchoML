// @flow
import { locToUrl, urlToLoc } from './common/util';

function request(dispatch, path, json = true) {
  dispatch({ type: 'SET_LOADING' });
  return fetch(`${API_HOST}${path}`, { credentials: 'include' })
    .then((res) => {
      if (res.status === 401) {
        dispatch({ type: 'SET_LOGIN', login: false });
        throw new Error('unauthorized');
      }

      dispatch({ type: 'CLEAR_LOADING' });

      // add type check if blob
      if (typeof json === 'boolean' && json) {
        return json ? res.json() : res.text();
      } else if (typeof json === 'string' && json === 'blob') {
        return res.blob();
      }

      // defualt to text(); safest
      return res.text();
    })
    .catch((err) => {
      dispatch({ type: 'CLEAR_LOADING' });
      throw err;
    });
}

function post(dispatch, path, body) {
  dispatch({ type: 'SET_LOADING' });
  const options = {
    credentials: 'include',
    method: 'post',
    headers: new Headers({
      'Content-Type': 'application/json',
    }),
    body: JSON.stringify(body),
  };
  return fetch(`${API_HOST}${path}`, options)
    .then((res) => {
      dispatch({ type: 'CLEAR_LOADING' });
      return res.json();
    })
    .catch((err) => {
      dispatch({ type: 'CLEAR_LOADING' });
      throw err;
    });
}

export function updateFiles(loc /* :{container: number, dir: string[]} */) {
  return (dispatch /* :function */) => {
    request(dispatch, `/api/dir${locToUrl(loc)}`)
      .then((files) => {
        dispatch({ type: 'SET_FILES', files });
      })
      .catch(() => {});
  };
}

export function changeLoc(loc /* :{container: number, dir: string[]} */) {
  return (dispatch /* :function */) => {
    dispatch({ type: 'PUSH_LOC', loc });
    dispatch(updateFiles(loc));
  };
}

export function createFolder(loc /* :string */, name /* :string */) {
  return (dispatch /* :function */) => {
    post(dispatch, `/api/createFolder${locToUrl(loc)}`, { name })
      .then(() => {
        dispatch({
          type: 'SHOW_ALERT',
          alert: { type: 'success', message: 'Success' },
        });
        dispatch(updateFiles(loc));
      })
      .catch((err) => {
        dispatch({
          type: 'SHOW_ALERT',
          alert: { type: 'danger', message: err.toString() },
        });
      });
  };
}

export function deleteFiles(loc /* :string */, names /* :string */) {
  return (dispatch /* :function */) => {
    post(dispatch, `/api/delete${locToUrl(loc)}`, names)
      .then(() => {
        dispatch({
          type: 'SHOW_ALERT',
          alert: { type: 'success', message: 'Success' },
        });
        dispatch(updateFiles(loc));
      })
      .catch((err) => {
        dispatch({
          type: 'SHOW_ALERT',
          alert: { type: 'danger', message: err.toString() },
        });
      });
  };
}

/**
 * @param {string} loc
 * @param {string} name
 */
export function startPreviewJpg(loc /* :string */, name /* :string */) {
  return (dispatch /* :function */) => {
    request(dispatch, `/api/imageInfo${locToUrl(loc)}/${name}`).then((info) => {
      dispatch({ type: 'START_PREVIEW_JPG', info });
    });
  };
}

export function startPreviewTxt(loc /* :string */, name /* :string */) {
  return (dispatch /* :function */) => {
    request(dispatch, `/api/download${locToUrl(loc)}/${name}`, false).then((text) => {
      dispatch({ type: 'START_PREVIEW_TXT', text });
    });
  };
}

export function loadLabels(storageAccount, containerName, filename) {
  const getParams = Object.entries({ storageAccount, containerName, filename })
    .map(tuple => `${encodeURIComponent(tuple[0])}=${encodeURIComponent(tuple[1])}`)
    .join('&');
  return (dispatch /* :function */) => {
    request(dispatch, `/api/labels?${getParams}`).then((labels) => {
      dispatch({
        type: 'START_PREVIEW',
        storageAccount,
        containerName,
        filename,
        labels,
      });
      dispatch({
        type: 'SHOW_ALERT',
        alert: null,
      });
    });
  };
}

/**
 * @param {string} account
 * @param {string} containerName
 * @param {string} filename
 * @param {array} labels
 */
export function saveLabels(
  storageAccount /* :string */,
  containerName /* :string */,
  filename /* :string */,
  labels /* :Object[]*/,
) {
  return (dispatch /* :function */) => {
    post(dispatch, '/api/saveLabels', {
      labels,
      storageAccount,
      containerName,
      filename,
    })
      .then(() => {
        dispatch({
          type: 'SHOW_ALERT',
          alert: { type: 'success', message: 'Success' },
        });
      })
      .catch((err) => {
        dispatch({
          type: 'SHOW_ALERT',
          alert: { type: 'danger', message: err.toString() },
        });
      });
  };
}

export function initApp() {
  return (dispatch /* :function */) => {
    if (location.pathname === '/') {
      dispatch({ type: 'SET_LOGIN', login: false });
    }
  };
}

export function login(email /* :string */, password /* :string */) {
  return (dispatch /* :function */) => {
    post(dispatch, '/login', { email, password })
      .then((res) => {
        if (!res.success) {
          return dispatch({ type: 'SET_LOGIN_MESSAGE', ...res });
        }
        // Download containers
        return request(dispatch, '/api/containers').then((containers) => {
          dispatch({ type: 'SET_CONTAINERS', containers });
          if (location.pathname === '/') {
            dispatch(changeLoc({ container: 0, dir: [] }));
          } else {
            const loc = urlToLoc(location.pathname);
            dispatch({ type: 'SET_LOC', loc });
            dispatch(updateFiles(loc));
          }
          dispatch({ type: 'SET_LOGIN', login: true });
        });
      })
      .catch((err) => {
        console.error(err.stack);
      });
  };
}

export function logout() {
  return (dispatch /* :function */) => {
    post(dispatch, '/logout')
      .then((json) => {
        if (json.success) {
          history.pushState(null, '', '/');
          dispatch({ type: 'SET_LOGIN', login: false });
          dispatch({ type: 'SET_LOGIN_MESSAGE', ...json });
        } else {
          throw new Error(json.message);
        }
        return json;
      })
      .catch((err) => {
        console.error(err.stack);
      });
  };
}

/**
 * Download a file and return an in memory local Url
 * @param {string} storageAccount
 * @param {string} containerName
 * @param {string} filename
 * @return {Promise<string>} resolves to a local object url
 */
export function downloadFile(
  storageAccount /* :string*/,
  containerName /* :string */,
  filename /* :string*/,
) {
  return (dispatch /* :function */) => {
    const blobKey = containerName + filename;

    // return cached version if previously downloaded
    const localFile = localStorage.getItem(blobKey);
    if (localFile) {
      return fetch(localFile).then(res => res.blob()).then(blob => URL.createObjectURL(blob));
    }

    const getParams = Object.entries({ storageAccount, containerName, filename })
      .map(tuple => `${encodeURIComponent(tuple[0])}=${encodeURIComponent(tuple[1])}`)
      .join('&');

    // Download and return url to localstorage file
    const blobPromise = request(dispatch, `/api/downloadfile?${getParams}`, 'blob');
    return blobPromise.then((blob) => {
      if (typeof blob === 'object') {
        // Parse blob with FileReader and save to LocalStorage
        const filereader = new FileReader();
        filereader.onload = (event) => {
          const result = event.target.result;
          try {
            localStorage.setItem(blobKey, result);
            console.log(`Stored: ${blobKey}`);
            return result;
          } catch (e) {
            console.error(`Failed to store: ${blobKey}`);
            return null;
          }
        };
        filereader.readAsDataURL(blob);

        const localUrl = URL.createObjectURL(blob);
        return localUrl;
      }
      return Promise.reject("Server returned non 'object' response type");
    });
  };
}

/**
 * @param {string} email
 * @param {string} password
 */
export function saveUser(email /* :string*/, password /* :string */) {
  return (dispatch /* : function*/) => {
    dispatch({ type: 'SET_LOADING' });
    const body = {
      email,
      password,
    };
    return post(dispatch, '/register', body)
      .then((json) => {
        dispatch({ type: 'SET_LOGIN_MESSAGE', ...json });
        return json;
      })
      .catch((err) => {
        dispatch({ type: 'SET_LOGIN_MESSAGE', ...err });
        dispatch({ type: 'CLEAR_LOADING' });
        return { err };
      });
  };
}
