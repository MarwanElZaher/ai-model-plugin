import React from "react";
import { withLocalize, getLocale } from '@penta-b/ma-lib';
import { components as GridComponents } from '@penta-b/grid';
import { trComponents } from '../../constants/gridButtons';
import { connect } from "react-redux";
import {
    GRID_FILTERABLE,
    GRID_PAGE_SIZE,
    GRID_PAGE_SIZE_OPTIONS,
    GRID_SORTABLE,
    LOCALIZATION_NAMESPACE
} from "../../constants/constants";

const GridView = ({ features, t }) => {
    const locale = getLocale()?.name;

    const mapFeatureToPreview = (feature) => ({
        Id: feature.id,
        Name: locale == "ar" ? feature.display_data_ar : feature.display_data_en,
        geometry: JSON.parse(feature.geom)
    });

    const getColumnsConfig = () => {
        const baseColumns = [
            {
                id: "Id",
                name: t("Id"),
                type: "INT",
                display: "Basic",
                sortable: true,
                filterable: false,
                gridData: true
            },
            {
                id: "Name",
                name: t("FeatureName"),
                type: "STRING",
                display: "Basic",
                sortable: true,
                filterable: false,
                gridData: true
            },
            {
                id: "more",
                name: t("Actions"),
                type: "component",
                display: "Basic",
                filterable: false,
                sortable: false
            }
        ];

        return baseColumns;
    };

    const gridSettings = {
        id: Date.now().toString(),
        data: features.map(mapFeatureToPreview),
        columns: getColumnsConfig(),
        filterable: GRID_FILTERABLE,
        sortable: GRID_SORTABLE,
        pageSizeOptions: GRID_PAGE_SIZE_OPTIONS,
        pageSiza: GRID_PAGE_SIZE,
        language: locale
    };

    return (
        <GridComponents.Grid
            settings={gridSettings}
            trComponents={trComponents}
        />
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