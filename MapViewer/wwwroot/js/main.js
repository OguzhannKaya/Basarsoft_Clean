import Map from 'ol/Map.js';
import View from 'ol/View.js';
import TileLayer from 'ol/layer/Tile.js';
import OSM from 'ol/source/OSM.js';
import { fromLonLat } from 'ol/proj.js';

const map = new Map({
    target: 'map',
    layers: [
        new TileLayer({
            source: new OSM()
        })
    ],
    view: new View({
        center: fromLonLat([0, 0]),
        zoom: 2
    })
});

// Accessibility: Add keyboard navigation support
map.getViewport().addEventListener('keydown', function (event) {
    const view = map.getView();
    const center = view.getCenter();
    const delta = 100000; // Adjust panning distance
    switch (event.key) {
        case 'ArrowUp':
            view.setCenter([center[0], center[1] + delta]);
            break;
        case 'ArrowDown':
            view.setCenter([center[0], center[1] - delta]);
            break;
        case 'ArrowLeft':
            view.setCenter([center[0] - delta, center[1]]);
            break;
        case 'ArrowRight':
            view.setCenter([center[0] + delta, center[1]]);
            break;
        case '+':
            view.setZoom(view.getZoom() + 1);
            break;
        case '-':
            view.setZoom(view.getZoom() - 1);
            break;
    }
});