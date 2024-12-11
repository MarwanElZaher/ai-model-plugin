import {
  store,
  systemAddNotification,
  apiRegistry,
  actionsRegistry,
} from "@penta-b/ma-lib";

import { executeQuery, executeQueryFeature } from './query';
import { QUERY_TYPES, RESPONSE_TYPE } from "../constants/constants";
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

export const zoomToFeatures = (featRef) => {
  dispatch("zoomToFeatures", featRef);
};

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
    });
}
export const highlightFeatureGeometry = (geometry) => {
  apiRegistry
    .getApis(["Feature"])
    .then(([Feature]) => {
      const feature = new Feature({
        type: "Feature",
        geometry: geometry,
        properties: {},
      });
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


export const panMap = (extent, direction, panAmount = 100) => {
  const [west, south, east, north] = extent;

  switch (direction.toLowerCase()) {
    case 'right':
      return [west + panAmount, south, east + panAmount, north];
    case 'left':
      return [west - panAmount, south, east - panAmount, north];
    case 'up':
      return [west, south + panAmount, east, north + panAmount];
    case 'down':
      return [west, south - panAmount, east, north - panAmount];
    default:
      return extent;
  }
}
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


const getResponseType = (response, queryType) => {
  switch (queryType) {
    case QUERY_TYPES.FTS:
      return getResponseTypeForFTS(response);
    case QUERY_TYPES.QF:
      return getResponseTypeForQF(response);
  }


};
const getResponseTypeForFTS = (response) => {
  if (!response.length) return RESPONSE_TYPE.NONE;
  if (response.length == 1) return RESPONSE_TYPE.SINGLE;
  return RESPONSE_TYPE.MULTIPLE;
};

const getResponseTypeForQF = (response) => {
  if (!response?.[0]?.count) return RESPONSE_TYPE.NONE;
  if (response?.[0]?.count == 1) return RESPONSE_TYPE.SINGLE;
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
  setResponse,
  setMessage,
  queryType
) => {
  // Determine response type
  const responseType = getResponseType(queryResponse, queryType);

  switch (responseType) {
    case RESPONSE_TYPE.NONE:
      const message = "No features found matching your query";
      setMessage(message);
      notify(message, "info");
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
export const executeFullTextSearchAction = async (action, actionContext, projection, setGridVisible, setResponse, setMessage) => {

  if (action.action != 'query') return;

  const mapProjection = projection?.code || action.parameters.crs;
  const queryResponse = await executeQuery(
    action.parameters.layerId,
    mapProjection,
    action.parameters.searchText
  );
  if (!queryResponse) return;
  handleQueryResponse(queryResponse, actionContext, setGridVisible, setResponse, setMessage, QUERY_TYPES.FTS);

};



//-----------------------------------------------------

export const executeAdvancedQuery = async (action, projection, actionContext, setGridVisible, setResponse, setMessage) => {
  if (action.action != 'advancedQuery') return;

  const mapProjection = projection?.code || action.parameters.crs;
  const queryResponse = await executeQueryFeature(
    action.parameters.dataSource,
    mapProjection,
    action.parameters.returns,
    action.parameters.filter?.conditionList,
    actionContext?.tagertedFeatureRef
  );
  const responseData = queryResponse?.data;
  if (!responseData) return;
  handleQueryResponse(responseData, actionContext, setGridVisible, setResponse, setMessage, QUERY_TYPES.QF);

};

