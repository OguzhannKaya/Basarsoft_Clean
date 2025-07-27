const featureInfoOverlayElement = document.getElementById('feature-info-overlay');

const featureInfoOverlay = new ol.Overlay({
    element: featureInfoOverlayElement,
    offset: [10, 0],
    positioning: 'bottom-left',
    stopEvent: false,
    insertFirst: false,
});

map.addOverlay(featureInfoOverlay);

map.on('pointermove', function (event) {
    let foundFeature = null;

    map.forEachFeatureAtPixel(event.pixel, function (feature, layer) {
        if (layer === drawingVectorLayer || layer === apiVectorLayer) {
            foundFeature = feature;
            return true;
        }
    });

    if (foundFeature) {
        const featureName = foundFeature.get('name');
        const geometryType = foundFeature.getGeometry().getType();
        const id = foundFeature.get('properties') ? foundFeature.get('properties').id : 'N/A';

        featureInfoOverlayElement.innerHTML = `<strong>Ad:</strong> ${featureName}<br><strong>Tip:</strong> ${geometryType}<br><strong>ID:</strong> ${id}`;
        featureInfoOverlay.setPosition(event.coordinate);
        featureInfoOverlayElement.style.display = 'block';
    } else {
        featureInfoOverlayElement.style.display = 'none';
    }
});