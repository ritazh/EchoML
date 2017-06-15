import { locToUrl } from '../common/util';

const initialState = {
  bookmark: 0,
  dir: [],
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case 'PUSH_LOC':
      history.pushState(null, null, locToUrl(action.loc));
      return action.loc;

    case 'SET_LOC':
      return action.loc;

    default:
      return state;
  }
};

export default reducer;
