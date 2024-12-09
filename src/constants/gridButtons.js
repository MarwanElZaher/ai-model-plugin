import { componentRegistry } from "@penta-b/ma-lib";

const ZoomToFeatureButton = componentRegistry.getComponent(
    "ZoomToFeatureButton"
);
const HighlightButton = componentRegistry.getComponent(
    "HighlightFeatureButton"
);
const UnHighlightButton = componentRegistry.getComponent(
    "ClearHighlightButton"
);
const MoreInfoButton = componentRegistry.getComponent("MoreInfoButton");

export const trComponents = [

    { component: ZoomToFeatureButton, settings: {} },
    { component: HighlightButton, settings: {} },
    { component: UnHighlightButton, settings: {} },
    { component: MoreInfoButton, settings: { back: true } },
];

export const gridComponents = [

    { component: ZoomToFeatureButton, settings: {} },
    { component: HighlightButton, settings: {} },
    { component: UnHighlightButton, settings: {} },
];
