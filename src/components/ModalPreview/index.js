import React, { useState, useCallback, useEffect } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { clearHighlights, GEOJSONToFeature, highlightFeature, layerVisibility, notify, resetMap, setZoom, zoomIn, zoomOut, zoomToFeature } from '../../utils/helperFunctions';
import { executeQuery } from '../../utils/query';
import SpeechToText from '../SpeechToText';

function ModalPreview({ settings, features }) {
  const [userQuery, setUserQuery] = useState("");

  // a shared context to store results between actions
  let actionContext = {
    tagertedFeatureRef: null,
  };
  const genAI = new GoogleGenerativeAI(process.env.REACT_APP_GEMINI_API_KEY);

  useEffect(() => {
    if (userQuery) {
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
          "target": "layerId",
          "parameters": { additional_details }
        },
        {
          "type": "data_operation",
          "action": "query",
          "target": layer.id,
          "parameters": {
           conditionList : {tabularCondition|spatialCondition :{key: fieldName, operator: [ilike], value: {"%value%"}}},
            crs: selectedLayer.crs,
            dataSource: {id: selectedLayer.id}
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
              await executeDataAction(action);
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
    if (!actionContext.tagertedFeatureRef) return;
    const formDataFeatRef = await GEOJSONToFeature(actionContext.tagertedFeatureRef?.features?.[0]);
    switch (action.action) {
      case 'zoom':
        zoomToFeature(formDataFeatRef);
        break;
      case 'highlight':
        highlightFeature(formDataFeatRef);
        break;
      case 'pan':
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
   * Executes data query on a specfic layer, feature
   * @param {*} action action object
   */
  const executeDataAction = async (action) => {
    console.log(action, 'action', 'data')
    switch (action.action) {
      case 'query':
        const queryResponse = await executeQuery(
          action.parameters.dataSource,
          action.parameters.crs,
          action.parameters.returns,
          action.parameters.conditionList
        );
        if (!queryResponse || !queryResponse?.data?.[0]?.count) {
          notify(`There is no featrure with that name`, "info");
          return;
        }
        const parsedFeature = JSON.parse(queryResponse?.data?.[0]?.features)
        actionContext.tagertedFeatureRef = parsedFeature
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
    <div>
      {/* <input
        value={userQuery}
        onChange={(e) => setUserQuery(e.target.value)}
        placeholder="Describe desired map/data interaction"
      />
      <button onClick={dispatchActions}>Execute Actions</button> */}
      <SpeechToText lastTranscript={userQuery} setLastTranscript={setUserQuery} />

    </div>
  );
}

export default ModalPreview;