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

export const geminiResponseHandler = (modelResponse) => {
  if (!modelResponse) return;
  const { action, degree, target } = modelResponse;
  switch (action) {
    case "zoomIn":
      if (degree) {
        setZoom(degree);
      } else {
        zoomIn();
      }
      break;
    case "zoomOut":
      if (degree) {
        setZoom(-degree);
      } else {
        zoomOut();
      }
      break;
    case "setZoom":
      setZoom(degree);
      break;
    case "highlight":
      highlightFeature(target);
      break;

    default:
      break;
  }
}

export const GEOJSONToFeature = async (GEOJSON) => {
  return await apiRegistry.getApis(["Feature"]).then(([Feature]) => {
    return new Feature({ ...GEOJSON });
  });
};

export const zoomToFeature = (featRef) => {
  dispatch("zoomToFeatures", featRef);
};
export const zoomIn = () => {
  dispatch("zoomIn");
};
export const zoomOut = () => {
  dispatch("zoomOut");
};
export const setZoom = (level) => {
  dispatch("setZoom", level);
};

export const highlightFeature = (featRef) => {
  dispatch("addHighlight", featRef);
};

export const clearHighlights = () => {
  dispatch("clearHighlight");
};

// export const generateBuffer = (GEOJSON, distance_in_meters) => {
//   return buffer(GEOJSON, distance_in_meters, { units: "meters" });
// };


export const purge = () => {
  bufferVl.clear();
  actorVl.clear();
  clearHighlights();
};

export const handleResponseParsing = (response) => {
  try {
    const cleanedResponse = response.replace(/```json|```/g, "").trim();

    const parsedResponse = JSON.parse(cleanedResponse);
    console.log(parsedResponse, "parsedResponse")
    return parsedResponse
  } catch (error) {
    console.error('Error parsing the response:', error);
    return null;
  }
};




export const terminate = (componentId, removeComponent) => {
  componentId && removeComponent(componentId);
};
