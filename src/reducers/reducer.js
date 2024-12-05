import { SET_MODAL_RESPONSE, CLEAR_RESPONSE, SET_GRID_VISIBLE, SET_USER_QUERY, SET_NEW_COMPONENT_ID, SET_MODAL_MESSAGE } from "../actions/actions";

const initState = {
  modalResponse: [],
  userQuery: "",
  isGridVisible: false,
  componentId: null,
  modalMessage: "",
};

const reducer = (state = initState, action) => {
  switch (action.type) {
    case SET_MODAL_RESPONSE:
      return {
        ...state,
        modalResponse: action.payload,
      };
    case CLEAR_RESPONSE:
      return {
        ...state,
        modalResponse: [],
      };
    case SET_USER_QUERY:
      return {
        ...state,
        userQuery: action.payload,
      };
    case SET_GRID_VISIBLE:
      return {
        ...state,
        isGridVisible: action.payload,
      };
    case SET_NEW_COMPONENT_ID:
      return {
        ...state,
        componentId: action.payload,
      };
    case SET_MODAL_MESSAGE:
      return {
        ...state,
        modalMessage: action.payload,
      };
    default:
      return state;
  }
};

export default reducer;
