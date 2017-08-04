const reducer = (state = null, action) => {
  switch (action.type) {
    case 'START_PREVIEW':
      return {
        storageAccount: action.storageAccount,
        containerName: action.containerName,
        filename: action.filename,
        labels: action.labels,
      };

    case 'START_PREVIEW_JPG':
      return {
        ...state,
        ...action.info,
      };

    case 'START_PREVIEW_TXT':
      return {
        ...state,
        text: action.text,
      };

    case 'STOP_PREVIEW':
      return null;

    case 'SET_LOC': // back button
      return null;

    default:
      return state;
  }
};

export default reducer;
