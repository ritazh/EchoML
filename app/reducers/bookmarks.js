const reducer = (state = [], action) => {
  switch (action.type) {
    case 'SET_BOOKMARKS':
      return action.bookmarks;

    default:
      return state;
  }
};

export default reducer;
