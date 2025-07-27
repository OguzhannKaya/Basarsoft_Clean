const manualDrawTypeSelect = document.getElementById('manualDrawType');
const manualCoordsInput = document.getElementById('manualCoordsInput');
const manualFeatureNameInput = document.getElementById('manualFeatureName');
const addManualDrawingButton = document.getElementById('addManualDrawing');
const wktFormat = new ol.format.WKT();

addManualDrawingButton.addEventListener('click', function () {
    const drawType = manualDrawTypeSelect.value;
    const coordsText = manualCoordsInput.value.trim();
    const featureName = manualFeatureNameInput.value.trim() || 'Manuel Çizim';

    if (!coordsText) {
        alert('Lütfen koordinat veya WKT verisi girin.');
        return;
    }

    let geometry;
    let feature;

    try {
        const upperCaseCoordsText = coordsText.toUpperCase().replace(/\s+/g, ' ');

        if (drawType === 'Point') {
            const pointRegex = /^POINT\s*\(\s*(-?\d+(\.\d+)?)\s+(-?\d+(\.\d+)?)\s*\)$/;
            const match = upperCaseCoordsText.match(pointRegex);

            if (match && match.length === 5) {
                const lon = parseFloat(match[1]);
                const lat = parseFloat(match[3]);
                if (!isNaN(lon) && !isNaN(lat)) {
                    geometry = new ol.geom.Point(ol.proj.fromLonLat([lon, lat]));
                } else {
                    throw new Error('Geçersiz Point koordinat değerleri.');
                }
            } else {
                throw new Error('Geçersiz Point WKT formatı. Örn: POINT(boylam enlem)');
            }
        } else if (drawType === 'LineString') {
            if (!upperCaseCoordsText.startsWith('LINESTRING(')) {
                throw new Error('Geçersiz LineString WKT formatı. "LINESTRING(" ile başlamalı.');
            }
            geometry = wktFormat.readGeometry(coordsText, {
                dataProjection: 'EPSG:4326',
                featureProjection: 'EPSG:3857'
            });
            if (geometry.getType().toUpperCase() !== 'LINESTRING') {
                throw new Error(`Girilen WKT tipi (${geometry.getType()}) seçilen çizim tipi (LineString) ile eşleşmiyor.`);
            }
        } else if (drawType === 'Polygon') {
            if (!upperCaseCoordsText.startsWith('POLYGON(')) {
                throw new Error('Geçersiz Polygon WKT formatı. "POLYGON(" ile başlamalı.');
            }
            geometry = wktFormat.readGeometry(coordsText, {
                dataProjection: 'EPSG:4326',
                featureProjection: 'EPSG:3857'
            });
            if (geometry.getType().toUpperCase() !== 'POLYGON') {
                throw new Error(`Girilen WKT tipi (${geometry.getType()}) seçilen çizim tipi (Polygon) ile eşleşmiyor.`);
            }
        } else {
            alert('Desteklenmeyen manuel çizim tipi.');
            return;
        }

        feature = new ol.Feature({
            geometry: geometry
        });
        feature.set('name', featureName);

        drawingVectorSource.addFeature(feature);
        alert(`${featureName} adlı ${drawType} başarıyla eklendi.`);
        manualCoordsInput.value = '';
        manualFeatureNameInput.value = '';

    } catch (error) {
        alert('Çizim eklenirken hata oluştu: ' + error.message + '\nLütfen formatı kontrol edin.');
        console.error('Manuel çizim hatası:', error);
    }
});