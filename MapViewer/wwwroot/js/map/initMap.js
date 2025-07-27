// 1. Çizim Katmanları
const drawingVectorSource = new ol.source.Vector();
const drawingVectorLayer = new ol.layer.Vector({
    source: drawingVectorSource,
    // ...stil
});

const apiVectorSource = new ol.source.Vector({ format: new ol.format.GeoJSON() });
const apiVectorLayer = new ol.layer.Vector({
    source: apiVectorSource,
    // ...stil
});
apiVectorLayer.setVisible(false);

// 2. Koordinat Dönüşümü
const ankaraCoords = [32.8597, 39.9334];
const transformedCoords = ol.proj.fromLonLat(ankaraCoords);

// 3. Haritayı Oluştur
const map = new ol.Map({
    target: 'map',
    layers: [
        new ol.layer.Tile({
            source: new ol.source.OSM()
        }),
        drawingVectorLayer,
        apiVectorLayer
    ],
    view: new ol.View({
        center: transformedCoords,
        zoom: 10
    })
});

// 4. Export Et
window.map = map;
window.drawingVectorSource = drawingVectorSource;
window.apiVectorSource = apiVectorSource;
window.apiVectorLayer = apiVectorLayer;