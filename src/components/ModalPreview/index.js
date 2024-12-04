import React, { useCallback, useEffect } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { clearHighlights, executeDataAction, highlightFeatureGeometry, layerVisibility, notify, resetMap, setZoom, terminate, zoomIn, zoomOut, zoomToFeature } from '../../utils/helperFunctions';
import { withLocalize, selectorsRegistry, actionsRegistry } from '@penta-b/ma-lib';
import SpeechToText from '../SpeechToText';
import { connect } from 'react-redux';
import { GRID_VIEW, LOCALIZATION_NAMESPACE } from '../../constants/constants';
import { clearResponse, setGridVisible, setModalResponse, setNewComponentId, setUserQuery } from '../../actions/actions';

function ModalPreview({ settings, features, projection, userQuery, setUsersQuery, gridVisible, setGridVisiblity, componentId, setNewId, showGrid, removeComponent, setResponse, modalResponse, t }) {

  // a shared context to store results between actions
  let actionContext = {
    tagertedFeatureRef: null,
  };
  const genAI = new GoogleGenerativeAI(process.env.REACT_APP_GEMINI_API_KEY);

  useEffect(() => {
    if (gridVisible && !componentId) {
      showGrid({ title: t("features with similar spelling"), icon: t("icon") }, (id) => {
        setNewId(id);
      }, () => {
        setResponse([])
        setGridVisiblity(false)
        setNewId(null)
      });
    }
  }, [gridVisible, componentId]);

  // Separate useEffect for component removal
  useEffect(() => {
    if (!gridVisible && componentId) {
      terminate(componentId, removeComponent);
      setResponse([]);
    }
  }, [gridVisible, componentId]);

  useEffect(() => {
    if (userQuery.length > 0) {
      dispatchActions();
    }
  }, [userQuery]);


  const dispatchActions = useCallback(async () => {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const layerFieldsHandler = () => {
      const layers = settings?.dataSettings?.layers;
      if (!layers) return '';
      return layers.map((layer, i) => {
        const fields = layer.multifieldpicker;
        if (!fields) return '';
        return `
          LayerName: ${layer.layerName}
          LayerDetails: ${JSON.stringify(layer, null, 2)}
          Fields: ${fields.map(f => f.fieldName).join(', ')}
        `;
      }).join('\n');
    }

    const gridDataHandler = () => {
      const gridData = modalResponse?.map((feature) => {
        return `
        featureId: ${feature.id},
        featureNameAr: ${feature.display_data_ar},
        featureNameEn: ${feature.display_data_en}
        `;
      }).join('\n');
      return `
        Grid Data: ${gridData}
      `;
    }
    const prompt = `
      Context:
      - Map controls are global actions that affect the map as a whole (e.g., zooming in/out, resetting the map, clearing highlights).
      - Map interactions target specific layers or features (e.g., highlighting a feature, zooming to a feature, showing or hiding layers).
       - User can request multiple actions in a single sentence, such as "zoom and highlight".
      - Each requested action should be treated as a separate JSON object within the response array.
      - Map interactions (e.g., zoom, highlight) target specific features or layers.
       
      - When the user mentions "grid" in the "${userQuery}", prioritize the use of the **grid_interaction** type for feature actions.
       For example:
      - "Zoom to the {id} from the grid" → grid_interaction with action zoomGridFeature.
      - "Highlight this grid cell" → grid_interaction with action highlightGridFeature.
      - For any grid-specific requests, avoid using data operations or map interactions
      - ${gridDataHandler()} (contains current grid features)

      - If a feature needs to be highlighted, first perform a data operation to retrieve the feature, then zoom to and highlight it sequentially.
      - for example:
        - User Request: "Zoom to Cairo" | "where is cairo" → data operation to retrieve Cairo feature, then map interaction to zoom to Cairo.
        - User Request: "Highlight Cairo" | "where is cairo" → data operation to retrieve Cairo feature, then map interaction to highlight Cairo.
      - Available Layers and its fields: ${layerFieldsHandler()}
      User Request: ${userQuery}
      
      Respond with JSON array of actions:
      [
        {
        type: "grid_interaction",
        action: "zoomGridFeature|highlightGridFeature|removeGrid",
        target: feature.id,
        },
        {
          "type": "map_interaction",
          "action": "zoom|pan|highlight|showLayer|hideLayer",
          "target": "layer.id",
          "parameters": { additional_details }
        },
        {
          "type": "data_operation",
          "action": "query",
          "target": layer.id,
          "parameters": {
              layerId: {layer.id} //layerId is the uuid of the layer, 
              "crs": layer.crs,
              "searchText": "{searchText}"
              }
        },
        {
          "type": "map_control",
          "action": "zoomIn|zoomOut|setZoom|reset|clear|clearHighlights",
          "target": "map",
          "parameters": {zoomLevel| additional_details}

        }
      ]
        if user asks for highlighting a feature|layer we should do data operations to get the feature then highlight it
        always respond with a valid JSON
    `;
    console.log(prompt, "prompt")

    try {
      const result = await model.generateContent(prompt);
      const response = result.response.text();
      const cleanedResponse = response
        .match(/```(?:json)?\n([\s\S]*?)```/m)?.[1] // Extract content within ``` ```
        ?.replace(/\/\/[^\n]*/g, '')               // Remove inline comments
        ?.trim();                                  // Remove extra whitespace

      console.log('Cleaned response:', cleanedResponse);
      const actions = JSON.parse(cleanedResponse);
      console.log(actions, "actions")
      if (!actions.length) {
        notify("No actions found to execute, try another query eg. zoom to cairo gov", "info");
        return;
      }


      for (const action of actions) {
        try {
          switch (action.type) {
            case 'map_interaction':
              await executeMapAction(action);
              break;
            case 'data_operation':
              await executeDataAction(action, actionContext, projection, setGridVisiblity, setResponse);
              break;
            case 'map_control':
              await executeMapControlAction(action);
              break;
            case 'grid_interaction':
              await executeGridAction(action);
              break;
          }
        } catch (actionError) {
          console.error(`Error executing action: ${action.type}`, actionError);
        }
      }

    } catch (error) {
      console.error("Action dispatching error:", error);
    }
  }, [userQuery, settings?.dataSettings, features]);

  /**
   * Executes map interaction on a specfic layer, feature actions
   * @param {*} action action object
   */
  const executeMapAction = async (action) => {
    console.log(action, 'action', 'map')
    switch (action.action) {
      case 'zoom':
        if (!actionContext.tagertedFeatureRef) return
        zoomToFeature(actionContext.tagertedFeatureRef);
        break;
      case 'highlight':
        if (!actionContext.tagertedFeatureRef) return
        highlightFeatureGeometry(actionContext.tagertedFeatureRef);
        break;
      case 'showLayer':
        layerVisibility(action.target, true);
        break;
      case 'hideLayer':
        layerVisibility(action.target, false);
        break;
      default:
        console.warn(`Unknown map action: ${action.action}`);
        break;
    }
  };




  /**
   * Executes map control actions
   * @param {*} action action object
   */
  const executeMapControlAction = async (action) => {
    console.log(action, 'action', 'map control')
    switch (action.action) {
      case 'zoomIn':
        zoomIn(action?.parameters?.zoomLevel);
        break;
      case 'zoomOut':
        zoomOut(action?.parameters?.zoomLevel);
        break;
      case 'setZoom':
        setZoom(action?.parameters?.zoomLevel);
        break;
      case 'reset':
        resetMap();
        break;
      case 'clearHighlights':
        clearHighlights();
        break;
      default:
        console.warn(`Unknown map control action: ${action.action}`);
        break;
    }
  };
  const executeGridAction = async (action) => {
    console.log(action, 'action', 'grid');
    if (!gridVisible) {
      notify(t("There is no Grid to preform action on"), "info")
    }
    // Find the targeted feature based on the action's target
    const targetedFeature = modalResponse.find(feature => feature.id == action.target);
    // Parse the geometry only if the targeted feature exists
    const featureGeometry = targetedFeature ? JSON.parse(targetedFeature.geom) : null;

    switch (action.action) {
      case 'zoomGridFeature':
        if (featureGeometry) {
          zoomToFeature(featureGeometry);
        }
        break;

      case 'highlightGridFeature':
        if (featureGeometry) {
          highlightFeatureGeometry(featureGeometry);
        }
        break;

      case 'removeGrid':
        setGridVisiblity(false);
        break;

      default:
        console.warn(`Unknown grid action: ${action.action}`);
        break;
    }
  };

  return (
    <div className='cc-body'>
      <div className='container-c'>

        <SpeechToText userQuery={userQuery} setUserQuery={setUsersQuery} />
      </div>
    </div>
  );
}
const mapStateToProps = (state, { reducerId }) => {
  return {
    componentId: state.reducer.componentId,
    userQuery: state.reducer.userQuery,
    modalResponse: state.reducer.modalResponse,
    gridVisible: state.reducer.isGridVisible,
    projection: selectorsRegistry.getSelector(
      "selectMapProjection",
      state,
      reducerId
    ),
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    setNewId: (componentId) => dispatch(setNewComponentId(componentId)),
    showGrid: (props, onAdd, onRemove) =>
      dispatch(
        actionsRegistry.getActionCreator(
          'showComponent',
          LOCALIZATION_NAMESPACE,
          GRID_VIEW,
          props,
          onAdd,
          onRemove
        )
      ),
    setResponse: (response) => dispatch(setModalResponse(response)),
    clearModalResponse: () => dispatch(clearResponse()),
    setUsersQuery: (userQuery) => dispatch(setUserQuery(userQuery)),
    setGridVisiblity: (isGridVisible) => dispatch(setGridVisible(isGridVisible)),
    removeComponent: (id) => {
      return dispatch(actionsRegistry.getActionCreator('removeComponent', id));
    },
  }
};
export default withLocalize(connect(mapStateToProps, mapDispatchToProps)(ModalPreview), LOCALIZATION_NAMESPACE);