import { getBlobs, getContainers } from "./azure";

export const fetchContainers = async () => {
  return getContainers();
};

export const fetchBlobs = async containerName => {
  return getBlobs(containerName);
};

export default fetchBlobs;
