export const SET_MODAL_RESPONSE = "SET_MODAL_RESPONSE";
export const CLEAR_RESPONSE = "CLEAR_RESPONSE";
export const SET_USER_QUERY = "SET_USER_QUERY";
export const SET_GRID_VISIBLE = "SET_GRID_VISIBLE";
export const SET_NEW_COMPONENT_ID = "SET_NEW_COMPONENT_ID";
export const SET_MODAL_MESSAGE = "SET_MODAL_MESSAGE";

export const setModalResponse = (response) => {
  return {
    type: SET_MODAL_RESPONSE,
    payload: response
  }
};

export const clearResponse = () => {
  return {
    type: CLEAR_RESPONSE,
  }
};

export const setUserQuery = (userQuery) => {
  return {
    type: SET_USER_QUERY,
    payload: userQuery
  }
};

export const setGridVisible = (isGridVisible) => {
  return {
    type: SET_GRID_VISIBLE,
    payload: isGridVisible
  }
};
export const setNewComponentId = (componentId) => {
  return {
    type: SET_NEW_COMPONENT_ID,
    payload: componentId
  }
};

export const setModalMessage = (message) => {
  return {
    type: SET_MODAL_MESSAGE,
    payload: message
  }
};