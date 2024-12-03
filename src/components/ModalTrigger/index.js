import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import {
  actionsRegistry, withLocalize,
} from '@penta-b/ma-lib';
import { terminate } from '../../utils/helperFunctions';
import { LOCALIZATION_NAMESPACE } from '../../constants/constants';
let componentId = null;

const ModalTrigger = ({ showComponent, removeComponent, t, deactivate, isActive }) => {

  useEffect(() => {

    if (isActive) {
      showComponent(
        {
          icon: t("icon"),
          title: t("title"),
        },
        (id) => (componentId = id),
        deactivate
      );
    } else if (!isActive) {
      terminate(componentId, removeComponent);
    }
  }, [isActive])
  return null
}

const mapDispatchToProps = (dispatch) => {
  return {
    showComponent: (props, onAdd) => dispatch(actionsRegistry.getActionCreator('showComponent', 'ai-model-plugin', 'ModalPreview', props, onAdd)),
    removeComponent: (id) =>
      dispatch(actionsRegistry.getActionCreator("removeComponent", id)),
  }
}

export default withLocalize(connect(null, mapDispatchToProps)(ModalTrigger), LOCALIZATION_NAMESPACE);