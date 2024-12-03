import {
    query,
    systemShowLoading,
    systemHideLoading,
    store,
    request,
} from '@penta-b/ma-lib';
import { notify } from './helperFunctions';

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
        notify("errorMessage", "error");
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

// const buildQueryData = (dataSource, crs, returns, conditionList) => {
//     try {
//         return [{
//             dataSource: dataSource,
//             ...(conditionList ? {
//                 filter: {
//                     conditionList: [conditionList]
//                 }
//             } : {}),
//             returns: returns ?? [],
//             crs: crs,
//         }];
//     } catch (error) {
//         console.error('Error building query:', error);
//         throw error;
//     }
// };


// export const executeQuery = async (dataSource, crs, returns, conditionList) => {
//     try {
//         // Build query
//         const queryData = buildQueryData(dataSource, crs, returns, conditionList);

//         // Execute query
//         const response = await executeQueryService(queryData);

//         return response;
//     } catch (error) {
//         console.error('Query execution failed:', error);
//         throw error;
//     }
// };




// Query Service - Handles the API call
// const executeQueryService = async (queryData) => {
//     store.dispatch(systemShowLoading());

//     try {
//         const response = await query.queryFeatures(queryData);
//         return response;
//     } catch (error) {
//         console.error('Query service error:', error);
//         throw error;
//     } finally {
//         store.dispatch(systemHideLoading());
//     }
// };