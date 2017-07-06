const initialState = {
  annotate: null,
  login: null,
  loginMessage: null,
  view: 'list',
  loading: false,
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case 'SET_LOGIN':
      return {
        ...state,
        login: action.login,
      };

    case 'SET_LOGIN_MESSAGE':
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
        loading: true,
      };

    case 'CLEAR_LOADING':
      return {
        ...state,
        loading: false,
      };

    default:
      return state;
  }
};

export default reducer;
