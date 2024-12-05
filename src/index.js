/**
 * Author: Amr Samir
 * 
 * Description: 
 *  - This index file exports plugin's components and/or reducers and/or actions.
 */

import defaultLocalization from './messages';
import { LOCALIZATION_NAMESPACE } from './constants/constants';
import ModalTrigger from './components/ModalTrigger';
import ModalPreview from './components/ModalPreview';
import reducer from '../src/reducers/reducer';
import { clearResponse, setGridVisible, setModalResponse, setNewComponentId, setUserQuery, setModalMessage } from './actions/actions';
import GridView from './components/GridView';

ModalTrigger.Title = LOCALIZATION_NAMESPACE + ":title";
ModalTrigger.Icon = LOCALIZATION_NAMESPACE + ":icon";

const components = {
    ModalTrigger,
    ModalPreview,
    GridView
};

const reducers = {
    reducer,
}

const actions = {
    setModalResponse,
    clearResponse,
    setUserQuery,
    setGridVisible,
    setNewComponentId,
    setModalMessage,
}

const localization = {
    namespace: LOCALIZATION_NAMESPACE,
    defaultLocalization
}

export { components, reducers, actions, localization };