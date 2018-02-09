import axios from "axios";

const logger = console;

export async function getContainers() {
  try {
    const { data } = await axios.get("/api/containers", { withCredentials: true });
    return data;
  } catch (err) {
    logger.error(err);
    return [];
  }
}

export async function getBlobs(container) {
  try {
    const { data } = await axios.get(`/api/containers/${container}/blobs`, {
      withCredentials: true,
    });
    return data;
  } catch (err) {
    logger.error(err);
    return [];
  }
}

export async function getStorageAccount() {
  try {
    const { data } = await axios.get("/api/storage_account", { withCredentials: true });
    const { storageAccount } = data;
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
    method: "get",
    credentials: "include",
  }).then(resp => resp.blob());

  return blobPromise.then(blob => {
    if (typeof blob === "object") {
      const localUrl = URL.createObjectURL(blob);
      return localUrl;
    }
    return Promise.reject(new Error("Server returned non 'object' response type"));
  });
}

export async function addStorageAccount(name, accessKey) {
  try {
    const { data } = await axios.post("/api/storate_accounts", {
      withCredentials: true,
      headers: {
        "Content-Type": "application/json",
      },
      data: {
        name,
        accessKey,
      },
    });
    logger.log(data);
  } catch (err) {
    logger.error(err);
  }
}

export async function getStorageAccountNames() {
  return fetch("/api/accounts", {
    method: "get",
    credentials: "include",
  })
    .then(r => r.json())
    .catch(err => {
      logger.error(err);
      return [];
    });
}
