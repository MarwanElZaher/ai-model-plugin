import {
  store,
  systemAddNotification,
  apiRegistry,
  actionsRegistry,
} from "@penta-b/ma-lib";
import { executeQuery } from './query';
export const dispatch = actionsRegistry.dispatch.bind(actionsRegistry);
export const storeDispatch = store.dispatch.bind(store);

export const notify = (message, type) => {
  storeDispatch(systemAddNotification(message, type));
};


export const GEOJSONToFeature = async (GEOJSON) => {
  return await apiRegistry.getApis(["Feature"]).then(([Feature]) => {
    return new Feature({ ...GEOJSON });
  });
};

// export const zoomToFeature = (featRef) => {
//   dispatch("zoomToFeatures", featRef);
// };

//zoom to Feature function by using feature bbox 
export const zoomToFeature = (geometry) => {
  apiRegistry
    .getApis(["Feature"])
    .then(([Feature]) => {
      const feature = new Feature({
        type: "Feature",
        geometry: geometry,
        properties: {},
      });

      actionsRegistry.dispatch("setMapBBOX", feature.getBBox());
      actionsRegistry.dispatch("addHighlight", feature);
    });
}

export const zoomIn = (zoomLevel) => {
  if (zoomLevel) {
    dispatch("setZoom", zoomLevel);
  } else {
    dispatch("zoomIn");
  }
};
export const zoomOut = (zoomLevel) => {
  if (zoomLevel) {
    dispatch("setZoom", -zoomLevel);
  } else {
    dispatch("zoomOut");
  }
};
export const setZoom = (level) => {
  dispatch("setZoom", level);
};
//to do map extent
export const resetMap = () => {
  dispatch("clearHighlight");
  dispatch("setZoom", 0);
};
export const highlightFeature = (featRef) => {
  dispatch("addHighlight", featRef);
};

export const clearHighlights = () => {
  dispatch("clearHighlight");
};
export const layerVisibility = (layerId, visibility) => {
  dispatch('setLayerVisibility', layerId, visibility);
};



export const purge = () => {
  bufferVl.clear();
  actorVl.clear();
  clearHighlights();
};





export const terminate = (componentId, removeComponent) => {
  componentId && removeComponent(componentId);
};
export const debounce = (func, wait) => {
  let timeout; return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
};

const RESPONSE_TYPE = {
  NONE: 'NONE',
  SINGLE: 'SINGLE',
  MULTIPLE: 'MULTIPLE'
};
const getResponseType = (response) => {
  if (!response?.length) return RESPONSE_TYPE.NONE;
  if (response.length == 1) return RESPONSE_TYPE.SINGLE;
  return RESPONSE_TYPE.MULTIPLE;
};

const handleSingleFeature = (featureData, actionContext) => {
  const parsedFeature = JSON.parse(featureData?.geom);
  actionContext.tagertedFeatureRef = parsedFeature;
  return parsedFeature;
};

const handleMultipleFeatures = (featuresData, setGridVisible, setResponse) => {
  setGridVisible(true);
  setResponse(featuresData);
};

export const handleQueryResponse = async (
  queryResponse,
  actionContext,
  setGridVisible,
  setResponse
) => {
  // Determine response type
  const responseType = getResponseType(queryResponse);

  switch (responseType) {
    case RESPONSE_TYPE.NONE:
      notify("No features found matching your query", "info");
      return null;

    case RESPONSE_TYPE.SINGLE:
      return handleSingleFeature(queryResponse[0], actionContext);

    case RESPONSE_TYPE.MULTIPLE:
      return handleMultipleFeatures(queryResponse, setGridVisible, setResponse);

    default:
      console.error('Unknown response type');
      return null;
  }
};


/**
 * Executes data query on a specfic layer, feature
 * @param {*} action action object
 */
export const executeDataAction = async (action, actionContext, projection, setGridVisible, setResponse) => {
  console.log(action, 'action', 'data')

  if (action.action != 'query') return;

  const mapProjection = projection?.code || action.parameters.crs;
  const queryResponse = await executeQuery(
    action.parameters.layerId,
    mapProjection,
    action.parameters.searchText
  );
  handleQueryResponse(queryResponse, actionContext, setGridVisible, setResponse);

};