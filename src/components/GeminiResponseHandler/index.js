import { connect } from "react-redux";
import { actionsRegistry, withLocalize } from "@penta-b/ma-lib";
import { LOCALIZATION_NAMESPACE } from "../../constants/constants";
const geminiResponseHandler = ({ modelResponse, zoomIn }) => {
    if (modelResponse) {
        const { action, parameters } = modelResponse;
        switch (action) {
            case "zoom":
                zoomIn();
                break;
            case "highlight":
                break;
            case "draw":
                break;
            default:
                break;
        }
    }
}
const mapStateToProps = (state) => {
    return {
        modelResponse: state.reducer.response,
    };
};
const mapDispatchToProps = (dispatch) => {
    return {
        zoomIn: () =>
            dispatch(
                actionsRegistry.getActionCreator(
                    "zoomIn",
                )
            ),
    };
};
export default withLocalize(connect(mapStateToProps, mapDispatchToProps)(geminiResponseHandler), LOCALIZATION_NAMESPACE);