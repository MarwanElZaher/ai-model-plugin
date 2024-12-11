import React, { useEffect } from "react";
import { withLocalize, getLocale, componentRegistry } from '@penta-b/ma-lib';
import { components as GridComponents } from '@penta-b/grid';
import { gridComponents, trComponents } from '../../constants/gridButtons';
import { connect } from "react-redux";
import {
    GRID_FILTERABLE,
    GRID_PAGE_SIZE,
    GRID_PAGE_SIZE_OPTIONS,
    GRID_SORTABLE,
    LOCALIZATION_NAMESPACE
} from "../../constants/constants";
import { setModalMessage } from "../../actions/actions";

const GridView = (props) => {
    const { features, t, settings, setMessage } = props;
    const locale = getLocale()?.name;
    let gridGridComponents = [...gridComponents]
    let gridTrComponents = [...trComponents]

    useEffect(() => {
        //todo: add config to behavior settings
        const AddToSelection = componentRegistry.getComponent("AddToSelection");
        const RemoveFromSelection = componentRegistry.getComponent(
            "RemoveFromSelection"
        );
        const ReportingButton = componentRegistry.getComponent("ReportingButton")

        const AddToSelectionButtons = [{ component: AddToSelection, settings: {} }];
        const RemoveFromSelectionButtons = [{ component: RemoveFromSelection, settings: {} }];
        const ReportingButtonComponent = [{ component: ReportingButton, settings: {} }];
        //#region special case for the spatial search settings only
        if (settings.behaviorSettings?.selectFeature) {
            gridTrComponents.push(...AddToSelectionButtons);
        }
        if (settings.behaviorSettings?.unselectFeature) {
            gridTrComponents.push(...RemoveFromSelectionButtons);
        }

        if (settings.behaviorSettings?.selectAllFeatures) {
            gridGridComponents.push(...AddToSelectionButtons);
        }


        if (settings.behaviorSettings?.unselectAllFeatures) {
            gridGridComponents.push(...RemoveFromSelectionButtons);
        }
        if (settings.behaviorSettings?.allowReporting && ReportingButton) {
            gridGridComponents.push(...ReportingButtonComponent);
            gridTrComponents.push(...ReportingButtonComponent);
        }

        //#endregion
    }, [settings])

    useEffect(() => {
        if (features?.length > 0) {
            const count = features[0]?.count ?? features.length;
            setMessage(`${count} ${t("features found Choose Which One to do action on")}`);
        }
    }, [features]);

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
            trComponents={gridTrComponents}
            gridComponents={gridGridComponents}
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
        setMessage: (messsage) => dispatch(setModalMessage(messsage)),

    };
};
export default withLocalize(connect(mapStateToProps, mapDispatchToProps)(GridView), LOCALIZATION_NAMESPACE)