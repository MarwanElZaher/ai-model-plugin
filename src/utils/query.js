import {
    query,
    systemShowLoading,
    systemHideLoading,
    store,
    request,
} from '@penta-b/ma-lib';
import { notify } from './helperFunctions';
import { simplify } from "@turf/simplify";

//region start---findCandidatesQuery
// Query Builder - Builds the query structure
const buildQueryData = (layerId, crs, searchText) => {
    try {
        return [{
            dataSource: {
                "systemLayer": true
            },
            layers: [
                {
                    id: layerId,
                    searchField: "text"
                }
            ],
            limit: "10",
            searchText: searchText,
            crs: crs,
        }];
    } catch (error) {
        console.error('Error building query:', error);
        throw error;
    }
};

const executeQueryEndPoint = async (queryData) => {
    store.dispatch(systemShowLoading());
    try {
        const res = await request({
            method: "post",
            url: "/query/api/query/findCandidates",
            data: [...queryData],
        });

        if (res.status == 200) {
            console.log(
                "Request To findCandidates Success and return with data "
            );
            const performedData = performSearchResult(res?.data);
            store.dispatch(systemHideLoading());
            return performedData;
        }
    } catch (event) {
        console.error(
            "Request To findCandidates FAIL and return with error - {} ",
            event
        );
        store.dispatch(systemHideLoading());
        return null;
    } finally {
        store.dispatch(systemHideLoading());

    }
};
const performSearchResult = (resultArray) => {
    return [...resultArray].filter((x) => x).flat(1);
}

export const executeQuery = async (layerId, crs, searchText) => {
    try {
        // Build query
        const queryData = buildQueryData(layerId, crs, searchText);

        // Execute query
        const response = await executeQueryEndPoint(queryData);

        return response;
    } catch (error) {
        console.error('Query execution failed:', error);
        throw error;
    }
};
// region end---findCandidatesQuery





// region start-----QueryFeatrues
// builds query body

const mapConditionsWithGeometry = (conditions, targetLocation) => {
    // Iterate through conditions and update geometry if it exists
    return conditions.map(condition => {
        //convert geometry to simplified format
        const simplifiedCoordinates = simplify(targetLocation);
        console.log(simplifiedCoordinates, "simplifiedCoordinates")

        // Check if condition has the dummy geometry coming from ai response
        if (condition.geometry) {
            return {
                ...condition.spatialCondition,
                geometry: JSON.stringify(simplifiedCoordinates)
            };
        }
        return condition;
    });
}

const buildQueryFeatureBody = (dataSource, crs, returns, conditionList, geometry) => {
    try {
        return [
            {
                "returnAs": "json",
                dataSource: dataSource,
                ...((conditionList && geometry) ? {
                    // injecting geometry into conditionList
                    filter: {
                        conditionList: mapConditionsWithGeometry(conditionList, geometry),
                        logicalOperation: "AND"
                    }
                } : {
                    filter: {
                        conditionList: [conditionList],
                        logicalOperation: "AND"
                    }
                }),
                returns: returns ?? [],
                crs: crs,
            }
        ];
    } catch (error) {
        console.error('Error building query:', error);
        throw error;
    }
};
// Query Service - Handles the API call
const executeQueryService = async (queryData) => {
    store.dispatch(systemShowLoading());

    try {
        const response = await query.queryFeatures(queryData);
        return response;
    } catch (error) {
        console.error('Query service error:', error);
        throw error;
    } finally {
        store.dispatch(systemHideLoading());
    }
};

export const executeQueryFeature = async (dataSource, crs, returns, conditionList, geom) => {
    try {
        // Build query
        const queryData = buildQueryFeatureBody(dataSource, crs, returns, conditionList, geom);

        // Execute query
        const response = await executeQueryService(queryData);

        return response;
    } catch (error) {
        console.error('Query execution failed:', error);
        throw error;
    }
};
//region end-----QueryFeatrues



