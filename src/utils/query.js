import {
    query,
    systemShowLoading,
    systemHideLoading,
    store,
} from '@penta-b/ma-lib';

// Query Builder - Builds the query structure
const buildQueryData = (dataSource, crs, returns, conditionList) => {
    try {
        return [{
            dataSource: dataSource,
            ...(conditionList ? {
                filter: {
                    conditionList: [conditionList]
                }
            } : {}),
            returns: returns ?? [],
            crs: crs,
        }];
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

export const executeQuery = async (dataSource, crs, returns, conditionList) => {
    try {
        // Build query
        const queryData = buildQueryData(dataSource, crs, returns, conditionList);

        // Execute query
        const response = await executeQueryService(queryData);

        return response;
    } catch (error) {
        console.error('Query execution failed:', error);
        throw error;
    }
};
