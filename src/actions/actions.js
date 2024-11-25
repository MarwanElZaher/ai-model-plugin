export const SET_MODEL_RESPONSE = "SET_MODEL_RESPONSE";
export const CLEAR_RESPONSE = "CLEAR_RESPONSE";


export const setModelResponse = (response) => {

  return {
    type: SET_MODEL_RESPONSE,
    payload: response
  }
};

export const clearResponse = () => {
  return {
    type: CLEAR_RESPONSE,
  }
}