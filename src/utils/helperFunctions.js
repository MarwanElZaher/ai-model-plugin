import {
  store,
  systemAddNotification,
  apiRegistry,
  actionsRegistry,
} from "@penta-b/ma-lib";
// import { buffer } from "@turf/turf";
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

export const zoomToFeature = (featRef) => {
  dispatch("zoomToFeatures", featRef);
};
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
export const resetMap = () => {
  dispatch("resetMap");
};
export const highlightFeature = (featRef) => {
  dispatch("addHighlight", featRef);
};

export const clearHighlights = () => {
  dispatch("clearHighlight");
};
export const layerVisibility = (layerId, visibility) => {
  storeDispatch('setLayerVisibility', layerId, visibility);
};
// export const generateBuffer = (GEOJSON, distance_in_meters) => {
//   return buffer(GEOJSON, distance_in_meters, { units: "meters" });
// };


export const purge = () => {
  bufferVl.clear();
  actorVl.clear();
  clearHighlights();
};





export const terminate = (componentId, removeComponent) => {
  componentId && removeComponent(componentId);
};
