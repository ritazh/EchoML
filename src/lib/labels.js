/**
 * @param {string} storageAccount
 * @param {string} containerName
 * @param {string} filename
 * @return {Promise<label[]>}
 */
export async function loadLabels(storageAccount, containerName, filename) {
  const labelsUrl = `/api/labels/${storageAccount}/${containerName}/${filename}`;
  return fetch(labelsUrl, {
    method: 'get',
    credentials: 'include',
    headers: new Headers({
      'Content-Type': 'application/json',
    }),
  })
    .then(resp => resp.json())
    .catch((err) => {
      console.error(err);
      return [];
    });
}

/**
 * @param {string} storageAccount
 * @param {string} containerName
 * @param {string} filename
 * @param {array} labels
 * @return {Promise<{status: boolean, message: string}>} Save status
 */
export async function saveLabels(storageAccount, containerName, filename, labels) {
  return fetch('/api/labels', {
    method: 'post',
    credentials: 'include',
    headers: new Headers({
      'Content-Type': 'application/json',
    }),
    body: JSON.stringify({
      storageAccount,
      containerName,
      filename,
      labels,
    }),
  })
    .then((response) => {
      if (response.ok) {
        return response.json();
      }
      throw new Error(response.statusText);
    })
    .then(json => json)
    .catch((err) => {
      // console.error(err);
      throw new Error(`Failed to save labels: ${err.statusText}`);
    });
}
