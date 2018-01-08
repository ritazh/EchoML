const logger = console;

export async function getContainers() {
  try {
    const containers = await fetch('/api/containers', {
      credentials: 'include',
    }).then(resp => resp.json());
    return containers;
  } catch (err) {
    logger.error(err);
    return [];
  }
}

export async function getBlobs(container) {
  try {
    const blobs = await fetch(`/api/containers/${container}/blobs`, {
      credentials: 'include',
    }).then(resp => resp.json());
    return blobs;
  } catch (err) {
    logger.error(err);
    return [];
  }
}

export async function getStorageAccount() {
  try {
    const { storageAccount } = await fetch('/api/storage_account', {
      credentials: 'include',
    }).then(resp => resp.json());
    return storageAccount;
  } catch (err) {
    logger.error(err);
    return null;
  }
}

export async function downloadFile(storageAccount, containerName, filename) {
  // Download and return url to localstorage file
  const downloadUrl = `/api/blobs/download/${storageAccount}/${containerName}/${filename}`;
  const blobPromise = fetch(downloadUrl, {
    method: 'get',
    credentials: 'include',
  }).then(resp => resp.blob());

  return blobPromise.then((blob) => {
    if (typeof blob === 'object') {
      const localUrl = URL.createObjectURL(blob);
      return localUrl;
    }
    return Promise.reject(new Error("Server returned non 'object' response type"));
  });
}

export async function addStorageAccount(name, accessKey) {
  try {
    const response = await fetch('/api/storage_accounts', {
      method: 'post',
      credentials: 'include',
      headers: new Headers({
        'Content-Type': 'application/json',
      }),
      body: JSON.stringify({
        name,
        accessKey,
      }),
    });
    const json = await response.json();
    logger.log(json);
  } catch (err) {
    logger.error(err);
  }
}

export async function getStorageAccountNames() {
  return fetch('/api/accounts', {
    method: 'get',
    credentials: 'include',
  })
    .then(r => r.json())
    .catch((err) => {
      logger.error(err);
      return [];
    });
}
