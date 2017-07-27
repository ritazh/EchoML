const initialState = {
  login: null,
  loginMessage: null,
  view: 'list',
  loading: 0, // track loading as a stack to allow parallel load states. > 0 means loading.
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case 'SET_LOGIN':
      return {
        ...state,
        login: action.login,
      };

    case 'SET_LOGIN_MESSAGE':
      console.log(action.message);
      return {
        ...state,
        loginMessage: action.message,
      };

    case 'CHANGE_VIEW':
      return {
        ...state,
        view: action.view,
      };

    case 'SET_LOADING':
      return {
        ...state,
        loading: state.loading + 1,
      };

    case 'CLEAR_LOADING':
      return {
        ...state,
        loading: state.loading - 1,
      };

    default:
      return state;
  }
};

export default reducer;
