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
import { clearResponse, setModelResponse } from './actions/actions';

ModalTrigger.Title = LOCALIZATION_NAMESPACE + ":title";
ModalTrigger.Icon = LOCALIZATION_NAMESPACE + ":icon";

const components = {
    ModalTrigger,
    ModalPreview
};

const reducers = {
    reducer,
}

const actions = {
    setModelResponse,
    clearResponse
}

const localization = {
    namespace: LOCALIZATION_NAMESPACE,
    defaultLocalization
}

export { components, reducers, actions, localization };