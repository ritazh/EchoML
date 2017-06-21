const reducer = (state = null, action) => {
  switch (action.type) {
    case 'SET_STORAGEACCOUNT':
      return action.storageaccount;

    default:
      return state;
  }
};

export default reducer;
