import React, { useCallback, useEffect } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { clearHighlights, executeDataAction, highlightFeature, layerVisibility, resetMap, setZoom, zoomIn, zoomOut, zoomToFeature } from '../../utils/helperFunctions';
import { withLocalize, selectorsRegistry, actionsRegistry } from '@penta-b/ma-lib';
import SpeechToText from '../SpeechToText';
import { connect } from 'react-redux';
import { GRID_VIEW, LOCALIZATION_NAMESPACE } from '../../constants/constants';
import { clearResponse, setGridVisible, setModalResponse, setNewComponentId, setUserQuery } from '../../actions/actions';

function ModalPreview({ settings, features, projection, userQuery, setUsersQuery, gridVisible, setGridVisiblity, componentId, setNewId, showGrid, removeComponent, setResponse }) {

  // a shared context to store results between actions
  let actionContext = {
    tagertedFeatureRef: null,
  };
  const genAI = new GoogleGenerativeAI(process.env.REACT_APP_GEMINI_API_KEY);

  useEffect(() => {
    if (gridVisible && !componentId) {
      showGrid({}, (id) => {
        setNewId(id);
      });
    }
  }, [gridVisible, componentId]);

  // Separate useEffect for component removal
  useEffect(() => {
    if (!gridVisible && componentId) {
      removeComponent(componentId);
    }
  }, [gridVisible, componentId]);

  useEffect(() => {
    if (userQuery.length > 0) {
      // Remove existing grid component first
      if (componentId) {
        removeComponent(componentId);
        setNewId(null);
      }
      // Then reset grid visibility state
      setGridVisiblity(false);
      // Finally dispatch actions for the new query
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

    const prompt = `
      Context:
      - Map controls are global actions that affect the map as a whole (e.g., zooming in/out, resetting the map, clearing highlights).
      - Map interactions target specific layers or features (e.g., highlighting a feature, zooming to a feature, showing or hiding layers).
       - User can request multiple actions in a single sentence, such as "zoom and highlight".
      - Each requested action should be treated as a separate JSON object within the response array.
      - Map interactions (e.g., zoom, highlight) target specific features or layers.
      - If a feature needs to be highlighted, first perform a data operation to retrieve the feature, then zoom to and highlight it sequentially.
      - Available Layers and Fields: ${layerFieldsHandler()}
      - Available Layers and its fields: ${layerFieldsHandler()}
      User Request: ${userQuery}
      
      Respond with JSON array of actions:
      [
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
        highlightFeature(actionContext.tagertedFeatureRef);
        break;
      case 'showLayer':
        layerVisibility(action.target, true);
        break;
      case 'hideLayer':
        layerVisibility(action.target, false);
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
    modelResponse: state.reducer.modelResponse,
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