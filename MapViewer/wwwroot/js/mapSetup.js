import Map from 'https://cdn.skypack.dev/ol/Map';
import View from 'https://cdn.skypack.dev/ol/View';
import TileLayer from 'https://cdn.skypack.dev/ol/layer/Tile';
import OSM from 'https://cdn.skypack.dev/ol/source/OSM';
import VectorLayer from 'https://cdn.skypack.dev/ol/layer/Vector';
import VectorSource from 'https://cdn.skypack.dev/ol/source/Vector';
import Overlay from 'https://cdn.skypack.dev/ol/Overlay';
import Style from 'https://cdn.skypack.dev/ol/style/Style';
import Stroke from 'https://cdn.skypack.dev/ol/style/Stroke';
import Fill from 'https://cdn.skypack.dev/ol/style/Fill';
import Circle from 'https://cdn.skypack.dev/ol/style/Circle';
import { Projection } from 'https://cdn.skypack.dev/ol/proj';

export const map = new Map({
    target: 'map',
    layers: [
        new TileLayer({
            source: new OSM(),
        })
    ],
    view: new View({
        center: [32.8597, 39.9334],
        zoom: 10,
        projection: new Projection({
            code: "EPSG:4326",
            units: "degrees"
        }),
        extent: [-180, -90, 180, 90],
    })
});

export const apiVectorSource = new VectorSource();
export const apiVectorLayer = new VectorLayer({
    source: apiVectorSource,
    style: function (feature) {
        const geometryType = feature.getGeometry().getType();
        let style;

        if (feature.get('isDrawnAndSaved')) {
            style = new Style({
                fill: new Fill({
                    color: 'rgba(255, 200, 0, 0.5)'
                }),
                stroke: new Stroke({
                    color: 'rgba(255, 150, 0, 0.8)',
                    width: 2
                }),
                image: new Circle({
                    radius: 7,
                    fill: new Fill({
                        color: 'rgba(255, 200, 0, 0.7)'
                    }),
                    stroke: new Stroke({
                        color: 'rgba(255, 150, 0, 1)',
                        width: 1.5
                    })
                })
            });
        } else {
            switch (geometryType) {
                case 'Point':
                    style = new Style({
                        image: new Circle({
                            radius: 7,
                            fill: new Fill({
                                color: 'rgba(255, 100, 100, 0.7)'
                            }),
                            stroke: new Stroke({
                                color: 'rgba(255, 0, 0, 1)',
                                width: 1.5
                            })
                        })
                    });
                    break;
                case 'LineString':
                case 'MultiLineString':
                    style = new Style({
                        stroke: new Stroke({
                            color: 'rgba(0, 150, 255, 0.7)',
                            width: 3
                        })
                    });
                    break;
                case 'Polygon':
                case 'MultiPolygon':
                    style = new Style({
                        fill: new Fill({
                            color: 'rgba(100, 255, 100, 0.5)'
                        }),
                        stroke: new Stroke({
                            color: 'rgba(0, 128, 0, 0.8)',
                            width: 2
                        })
                    });
                    break;
                default:
                    style = new Style({
                        fill: new Fill({
                            color: 'rgba(200, 200, 200, 0.6)'
                        }),
                        stroke: new Stroke({
                            color: 'rgba(100, 100, 100, 1)',
                            width: 1
                        })
                    });
            }
        }
        return style;
    }
});

map.addLayer(apiVectorLayer);

export const drawSource = new VectorSource();
export const drawLayer = new VectorLayer({
    source: drawSource,
    style: new Style({
        fill: new Fill({
            color: 'rgba(255, 255, 255, 0.2)'
        }),
        stroke: new Stroke({
            color: '#ffcc33',
            width: 2
        }),
        image: new Circle({
            radius: 7,
            fill: new Fill({
                color: '#ffcc33'
            })
        })
    })
});
map.addLayer(drawLayer);

export const popupContainer = document.getElementById('popup');
export const overlay = new Overlay({
    element: popupContainer,
    autoPan: true,
    autoPanAnimation: {
        duration: 250,
    },
});
map.addOverlay(overlay);

export const infoElement = document.getElementById('info');
export const infoOverlay = new Overlay({
    element: infoElement,
    offset: [0, -10],
    positioning: 'bottom-center',
    stopEvent: false,
});
map.addOverlay(infoOverlay);