import { componentRegistry } from '@penta-b/ma-lib'

const ZoomToFeatureButton = componentRegistry.getComponent("ZoomToFeatureButton")
const HighlightFeatureButton = componentRegistry.getComponent("HighlightFeatureButton")
const ClearHighlightButton = componentRegistry.getComponent("ClearHighlightButton")


export const trComponents = [
    { component: ZoomToFeatureButton, settings: {} },
    { component: HighlightFeatureButton, settings: {} },
    { component: ClearHighlightButton, settings: {} },
]
