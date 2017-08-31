const initialState = {
  predictions: [],
};
export default (state = initialState, action) => {
  switch (action.type) {
    case 'SET_PREDICTIONS':
      return {
        ...state,
        predictions: action.predictions,
      };
    case 'CLEAR_PREDICTIONS':
      return {
        ...state,
        predictions: [],
      };
    default:
      return { ...state };
  }
};
