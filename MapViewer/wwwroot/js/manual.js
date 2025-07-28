import WKT from 'https://cdn.skypack.dev/ol/format/WKT';
import { map } from './mapSetup.js';
import { loadApiData, getCurrentPage } from './apiHandler.js';

const manualDrawTypeSelect = document.getElementById('manualDrawType');
const manualCoordsInput = document.getElementById('manualCoordsInput');
const manualFeatureNameInput = document.getElementById('manualFeatureName');
const addManualDrawingButton = document.getElementById('addManualDrawing');
const wktFormat = new WKT();

async function addManualDrawing() {
    const drawType = manualDrawTypeSelect.value;
    const coordsText = manualCoordsInput.value.trim();
    const featureName = manualFeatureNameInput.value.trim() || 'Manuel Çizim';

    if (!coordsText) {
        alert('Lütfen koordinat veya WKT verisi girin.');
        return;
    }

    let geometry;

    try {
        const upperCaseCoordsText = coordsText.toUpperCase().replace(/\s+/g, ' ');

        if (drawType === 'Point') {
            const pointRegex = /^POINT\s*\(\s*(-?\d+(\.\d+)?)\s+(-?\d+(\.\d+)?)\s*\)$/;
            const match = upperCaseCoordsText.match(pointRegex);
            if (match && match.length === 5) {
                const lon = parseFloat(match[1]);
                const lat = parseFloat(match[3]);
                geometry = wktFormat.readGeometry(`POINT(${lon} ${lat})`, {
                    dataProjection: 'EPSG:4326',
                    featureProjection: 'EPSG:3857'
                });
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

        const feature = new ol.Feature({
            geometry: geometry
        });
        feature.set('name', featureName);

        const wktStringForApi = wktFormat.writeGeometry(geometry, {
            dataProjection: 'EPSG:4326',
            featureProjection: 'EPSG:3857'
        });

        const featureDataToSend = {
            name: featureName,
            wkt: wktStringForApi
        };

        const response = await fetch('https://localhost:7150/api/feature', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(featureDataToSend),
        });

        const responseData = await response.json();

        if (!responseData.isSuccess && !responseData.message.toLowerCase().includes("successfully")) {
            throw new Error(`API işlemi başarısız: ${responseData.message}`);
        }

        alert(`${featureName} adlı ${drawType} başarıyla eklendi ve kaydedildi!`);

        manualCoordsInput.value = '';
        manualFeatureNameInput.value = '';

        await loadApiData(getCurrentPage());

        const extent = geometry.getExtent();
        map.getView().fit(extent, {
            size: map.getSize(),
            padding: [50, 50, 50, 50],
            duration: 500,
            maxZoom: 15
        });

    } catch (error) {
        alert('Çizim eklenirken hata oluştu: ' + error.message);
        console.error('Manuel çizim hatası:', error);
    }
}

addManualDrawingButton.addEventListener('click', () => {
    addManualDrawing().catch(console.error);
});

[manualCoordsInput, manualFeatureNameInput].forEach(input => {
    input.addEventListener('keydown', event => {
        if (event.key === 'Enter') {
            event.preventDefault();
            addManualDrawing().catch(console.error);
        }
    });
});
