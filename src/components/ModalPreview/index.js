import React, { useCallback, useEffect } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { clearHighlights, executeAdvancedQuery, executeFullTextSearchAction, highlightFeatureGeometry, layerVisibility, notify, panMap, resetMap, setZoom, terminate, zoomIn, zoomOut, zoomToFeature } from '../../utils/helperFunctions';
import { withLocalize, selectorsRegistry, actionsRegistry } from '@penta-b/ma-lib';
import SpeechToText from '../SpeechToText';
import { connect } from 'react-redux';
import { GRID_VIEW, LOCALIZATION_NAMESPACE } from '../../constants/constants';
import { clearResponse, setGridVisible, setModalMessage, setModalResponse, setNewComponentId, setUserQuery } from '../../actions/actions';
import TextToSpeech from '../TextToSpeech';

function ModalPreview({ settings, features, projection, userQuery, setUsersQuery, gridVisible, setGridVisiblity, componentId, setNewId, showGrid, removeComponent, setResponse, modalResponse, t, setMessage, selectMapBBox, setMapBBox }) {


  // a shared context to store results between actions
  let actionContext = {
    tagertedFeatureRef: null,
  };
  const genAI = new GoogleGenerativeAI(process.env.REACT_APP_GEMINI_API_KEY);

  useEffect(() => {
    if (gridVisible && !componentId) {
      showGrid({ title: t("features found"), icon: t("icon") }, (id) => {
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
      if (actionContext.tagertedFeatureRef) {
        actionContext.tagertedFeatureRef = null;
      }
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
    I am PentaB's specialized GIS assistant. I prioritize actions based on user intent and the presence of "grid" in queries:

     If userQuery includes "grid":
     - Return ONLY grid_interaction type responses
     - Example formats:
       - "Zoom to {id} from grid" → grid_interaction with zoomGridFeature
       - "Highlight grid cell" → grid_interaction with highlightGridFeature
     
     Otherwise, follow these priorities:
     1. For queries with profanity/insults → model_response (professional reminder)
     2. For direct questions → model_response
     3. For map controls → map_control
     4. For feature/layer interactions → map_interaction
     5. For data queries → Choose based on query complexity:

     Simple Queries (use single query):
        - Basic text search: "find cairo" | "search for cairo" | "where is street 9"
        - Use case: When searching text across layer
        Example Response:
        [
          {
            "type": "data_operation",
            "action": "query",
            "target": "layer.id",
            "parameters": {
              "layerId": "layer.id",
              "searchText": "searchText",
              "returnGeometry": true
            }
          }
        ]
                
        Complex Queries (use query + advancedQuery):
        - Spatial queries: 
          * Pattern: "{feature} in|inside|within {location}"
          * Example: "hospitals in Alexandria" triggers:
            1. First query to get Alexandria from governorates layer
            2. Then advancedQuery to find hospitals within that geometry
        
        - Attribute queries:
          * Pattern: "{feature} with {condition} {value}"
          * Example: "hospitals with more than 100 patients"
        
        - Combined queries:
          * Pattern: "{feature} with {condition} {value} in {location}"
          * Example: "hospitals with 100 patients in Alexandria"

     Example 1 - Simple text search:
     Query: "find cairo"
     Response:
     [
       {
         "type": "data_operation",
         "action": "query",
         "target": "layer.id",
         "parameters": {
           "layerId": "layer.id",
           "searchText": "cairo",
           "returnGeometry": true
         }
       }
     ]

     Example 2 - Complex spatial query:
     Query: "hospitals in Alexandria"
     Response:
     [
       {
         "type": "data_operation",
         "action": "query",
         "target": {layer.id},
         "parameters": {
           "layerId": {layer.id},  // Use specific layer ID
           "searchText": "Alexandria", 
           "returnGeometry": true
         }
       },
       {
         "type": "data_operation",
         "action": "advancedQuery",
         "target": "hospitals",
         "parameters": {
           "returnAs": "json",
           "dataSource": {
             "id": {layer.id}  // Using layer ID uuid
           },
           "pageNumber": 1,
           "pageSize": 100,
           "crs": "layer.crs",
           "filter": {
             "conditionList": [
             {
                 "geometry": "@previous.geometry",
                 "key": "geom",
                 "spatialRelation": "INTERSECT"
              },
               {
                 "key": "fieldName",
                 "operator": "=|>|<|>=|<=|like|!=|<>",
                 "value": "value"
             },
             ],
             "logicalOperation": "AND"
           },
           "returns": [
             {
               "fieldName": "id"
             },
             {
               "fieldName": "name"
             }
           ]
         }
       }
     ]

     Context:
     - Map controls: global actions (zoom, reset, clear)
     - Map interactions: layer/feature specific actions
     - Multiple actions per sentence supported
     - Each action = separate JSON object
     - ${gridDataHandler()} (current grid features)
     - Available Layers: ${layerFieldsHandler()}
     - Layer IDs are specific identifiers (e.g., {layer.id},) not the search terms

     User Request: ${userQuery}

     Response format (JSON array):
     [
       {
         "type": "grid_interaction",
         "action": "zoomGridFeature|highlightGridFeature|removeGrid",
         "target": feature.id
       }
       // OR
       {
         "type": "data_operation",
         "action": "query",
         "target": "layer.id",  // Use specific layer ID
         "parameters": {
           "layerId": "layer.id",  // Use specific layer ID
           "crs": "layer.crs",
           "searchText": "searchText",
           "returnGeometry": true
         }
       },
       {
         "type": "data_operation",
         "action": "advancedQuery",
         "target": "layer.id",  // Use specific layer ID
         "parameters": {
           "returnAs": "json",
           "dataSource": {
             "id": "layer.id"  // Use specific layer ID
           },
           "pageNumber": 1,
           "pageSize": 100,
           "crs": "layer.crs",
           "filter": {
             "conditionList": [
             {
                 "geometry": "geojson|@previous.geometry",
                 "key": "geom",
                 "spatialRelation": "INTERSECT|IN|NOT_IN|TOUCH|CONTAINED|DWITHIN"
             },  
              {
                 "key": "fieldName",
                 "operator": "=|>|<|>=|<=|like|!=|<>",
                 "value": "value"
             },
             ],
             "logicalOperation": "AND|OR"
           },
           "returns": [
             {
               "fieldName": "field1"
             },
             {
               "fieldName": "field2"
             }
           ]
         }
       },
       {
         "type": "map_interaction",
         "action": "zoom|highlight|showLayer|hideLayer",
         "target": "layer.id",  // Use specific layer ID
         "parameters": { additional_details },
         "message": "user message"
       },
       {
         "type": "map_control",
         "action": "zoomIn|zoomOut|setZoom|reset|clear|clearHighlights|pan",
         "target": "map",
         "parameters": {zoomLevel}|{panDirection: "up|down|right|left", panAmount: "must be number"},
         "message": "user message"
       },
       {
         "type": "model_response",
         "action": "setMessage",
         "message": "response message",
         "parameters": {
           "type": "info"
         }
       }
     ]
     
     Notes:
     - All responses must include a message describing the action on target in same language as userQuery
     - For highlighting: perform data operation first
     - Layer IDs must be specific identifiers "layer.id", not search terms
     - Always Highlight and zoom after data operation
     - Always return valid JSON
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
        const message = t("No actions found to execute, try another query example zoom to cairo gov");
        setMessage(message);
        notify(message, "info");
        return;
      }


      for (const action of actions) {
        try {
          switch (action.type) {
            case 'map_interaction':
              await executeMapAction(action);
              break;
            case 'data_operation':
              await executeDataAction(action);
              break;
            case 'map_control':
              setMessage(action.message);
              await executeMapControlAction(action);
              break;
            case 'grid_interaction':
              await executeGridAction(action);
              break;
            case 'model_response':
              setMessage(action.message);
              break;
          }
        } catch (actionError) {
          const errorMessage = `Error executing action: ${action.type}`;
          console.error(errorMessage, actionError);
          setMessage(errorMessage);
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
        setMessage(action.message);
        zoomToFeature(actionContext.tagertedFeatureRef);
        break;
      case 'highlight':
        if (!actionContext.tagertedFeatureRef) return
        setMessage(action.message);
        highlightFeatureGeometry(actionContext.tagertedFeatureRef);
        break;
      case 'showLayer':
        setMessage(action.message);
        layerVisibility(action.target, true);
        break;
      case 'hideLayer':
        setMessage(action.message);
        layerVisibility(action.target, false);
        break;
      default:
        const message = `Unknown map action: ${action.action}`;
        console.warn(message);
        setMessage(message);
        break;
    }
  };

  const executeDataAction = async (action) => {
    console.log(action, 'action', 'data')
    switch (action.action) {
      case 'query':
        await executeFullTextSearchAction(action, actionContext, projection, setGridVisiblity, setResponse, setMessage);
        break;
      //executing queryFeature on a single feature
      case 'advancedQuery':
        if (actionContext?.tagertedFeatureRef == 1) {
          await executeAdvancedQuery(action, projection, actionContext, setGridVisiblity, setResponse, setMessage);
        }
        break;
      default:
        const message = `Unknown data action: ${action.action}`;
        console.warn(message);
        setMessage(message);
        break;
    }
  }


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
      case 'pan':
        const newMapBBox = panMap(selectMapBBox, action?.parameters?.panDirection, action?.parameters?.panAmount);
        setMapBBox(newMapBBox);
        break;
      default:
        const message = `Unknown map control action: ${action.action}`;
        console.warn(message);
        setMessage(message);
        break;
    }
  };
  const executeGridAction = async (action) => {
    console.log(action, 'action', 'grid');
    if (!gridVisible) {
      const message = t("There is no Grid to preform action on");
      console.warn(message);
      setMessage(message);
      notify(message, 'info')
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
        const message = `Unknown grid action: ${action.action}`;
        console.warn(message);
        setMessage(message);
        break;
    }
  };

  return (
    <div className='cc-body'>
      <div className='container-c'>
        <SpeechToText userQuery={userQuery} setUserQuery={setUsersQuery} />
        <TextToSpeech />
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
    selectMapBBox: selectorsRegistry.getSelector(
      "selectMapBBox",
      state,
      reducerId
    ),
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    setMapBBox: (bbox) =>
      dispatch(actionsRegistry.getActionCreator("setMapBBOX", bbox)),
    setMessage: (messsage) => dispatch(setModalMessage(messsage)),
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