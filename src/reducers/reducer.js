import { SET_MODEL_RESPONSE, CLEAR_RESPONSE } from "../actions/actions";

const initState = {
  response: "",
};

const reducer = (state = initState, action) => {
  switch (action.type) {
    case SET_MODEL_RESPONSE:
      return {
        ...state,
        response: action.payload,
      };
    case CLEAR_RESPONSE:
      return {
        ...state,
        response: "",
      };
    default:
      return state;
  }
};

export default reducer;
