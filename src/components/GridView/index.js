import React, { useEffect } from "react";
import {
    actionsRegistry,
    withLocalize,
    getLocale,
    selectorsRegistry,
    systemAddPrompt,
    systemAddNotification,
} from '@penta-b/ma-lib';
import { components as GridComponents } from '@penta-b/grid';
import { trComponents } from '../../constants/gridButtons'
import { connect } from "react-redux";
import { GRID_FILTERABLE, GRID_PAGE_SIZE, GRID_PAGE_SIZE_OPTIONS, GRID_SORTABLE, LOCALIZATION_NAMESPACE } from "../../constants/constants";
const GridView = ({ features, t }) => {
    const featuresToPreview = features.map((feature) => {
        const locale = getLocale() && getLocale().name;
        return {
            "Id": feature.id,
            "Name": locale == "ar" ? feature.display_data_ar : feature.display_data_en,
        }
    })
    const columns = [{
        "id": "Id",
        "name": t("Id"),
        "type": "INT",
        "display": "Basic"

    }, {
        "id": "Name",
        "name": t("FeatureName"),
        "type": "STRING",
        "display": "Basic"

    }]
    const columnsConfig = columns.map((column) => {
        return {
            id: column.id,
            name: column.name,
            type: column.type,
            display: column.display,
            sortable: true,
            filterable: false,
            gridData: true
        }
    });

    useEffect(() => {
        console.log(features, 'features')
    }, [features])
    const newId = new Date().getUTCMilliseconds();
    return (
        <>

            <div>
                {t("Choose what Feature you want to see")}
            </div>
            <GridComponents.Grid
                settings={{
                    id: JSON.stringify(newId),
                    data: featuresToPreview,
                    columns: columnsConfig,
                    filterable: GRID_FILTERABLE,
                    sortable: GRID_SORTABLE,
                    pageSizeOptions: GRID_PAGE_SIZE_OPTIONS,
                    pageSiza: GRID_PAGE_SIZE,
                    language: getLocale() && getLocale().name,

                }}
                trComponents={trComponents}

            />
        </>
    );

}
const mapStateToProps = (state, ownProps) => {
    return {
        features: state.reducer.modalResponse,
    };
};
const mapDispatchToProps = (dispatch, ownProps) => {
    return {

    };
};
export default withLocalize(connect(mapStateToProps, mapDispatchToProps)(GridView), LOCALIZATION_NAMESPACE)