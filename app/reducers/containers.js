const reducer = (state = [], action) => {
  switch (action.type) {
    case 'SET_CONTAINERS':
      return action.containers;

    default:
      return state;
  }
};

export default reducer;
