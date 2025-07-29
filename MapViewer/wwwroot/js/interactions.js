import Draw from 'https://cdn.skypack.dev/ol/interaction/Draw';
import Snap from 'https://cdn.skypack.dev/ol/interaction/Snap';
import Modify from 'https://cdn.skypack.dev/ol/interaction/Modify';
import Translate from 'https://cdn.skypack.dev/ol/interaction/Translate';
import { getCenter } from 'https://cdn.skypack.dev/ol/extent';
import { WKT } from 'https://cdn.skypack.dev/ol/format';

import { map, drawSource, apiVectorSource, overlay, infoOverlay,drawLayer, apiVectorLayer , infoElement} from './mapSetup.js';

export let draw, snap, modify, translate;

const typeSelect = document.getElementById('type');
const featureNameInput = document.getElementById('featureName');
const saveFeatureBtn = document.getElementById('saveFeatureBtn');
const popupCloser = document.getElementById('popup-closer');
const wktFormat = new WKT();


export function addGeneralInteractions() {
    if (modify) map.removeInteraction(modify);
    if (translate) map.removeInteraction(translate);

    modify = new Modify({ source: apiVectorSource });
    map.addInteraction(modify);
}

export function addInteractions() {
    const value = typeSelect.value;
    if (draw) map.removeInteraction(draw);
    if (snap) map.removeInteraction(snap);

    if (value !== 'None') {
        if (modify) map.removeInteraction(modify);
        if (translate) map.removeInteraction(translate);

        draw = new Draw({
            source: drawSource,
            type: value,
        });

        draw.on('drawend', function (event) {
            currentDrawnFeature = event.feature;
            const geometry = event.feature.getGeometry();
            let centerCoord;
            try {
                if (geometry.getType() === 'Point') {
                    centerCoord = geometry.getCoordinates();
                } else if (geometry.getType() === 'Polygon') {
                    const extent = geometry.getExtent();
                    centerCoord = getCenter(extent);
                } else if (geometry.getType() === 'LineString') {
                    const extent = geometry.getExtent();
                    centerCoord = getCenter(extent);
                } else {
                    const extent = geometry.getExtent();
                    centerCoord = getCenter(extent);
                }

                overlay.setPosition(centerCoord);
                document.getElementById('popup').style.display = 'block';
                featureNameInput.value = '';
                saveFeatureBtn.textContent = 'Kaydet';

            } catch (error) {
                console.error('Error positioning popup:', error);
                alert('Çizim tamamlandı ancak popup konumlandırılırken hata oluştu.');
            }
        });


        map.addInteraction(draw);
        snap = new Snap({ source: drawSource });
        map.addInteraction(snap);
        console.log('Draw interaction added for type:', value);
    } else {
        addGeneralInteractions();
    }
}

map.on('pointermove', function (event) {
    if (event.dragging || overlay.getPosition() !== undefined) {
        infoOverlay.setPosition(undefined);
        return;
    }

    let foundFeature = null;
    map.forEachFeatureAtPixel(event.pixel, function (feature, layer) {
        if (layer === apiVectorLayer || layer === drawLayer) {
            foundFeature = feature;
            return true;
        }
    });

    if (foundFeature) {
        const featureName = foundFeature.get('name') || 'İsimsiz Özellik';
        const geometryType = foundFeature.getGeometry().getType();
        const featureProps = foundFeature.get('properties') || {};
        const featureId = foundFeature.get('id') || featureProps.id || 'N/A';

        infoElement.innerHTML = `<strong>ID:</strong> ${featureId} <br> <strong>Ad:</strong> ${featureName}<br><strong>Tip:</strong> ${geometryType}`;
        const geometry = foundFeature.getGeometry();
        const coordinate = geometry.getType() === 'Point'
            ? geometry.getCoordinates()
            : getCenter(geometry.getExtent());

        infoOverlay.setPosition(coordinate);
        infoElement.style.display = 'block';
    } else {
        infoOverlay.setPosition(undefined);
    }
});

popupCloser.onclick = function () {
    overlay.setPosition(undefined);
    popupCloser.blur();
    if (currentDrawnFeature) {
        drawSource.removeFeature(currentDrawnFeature);
        currentDrawnFeature = null;
    }
    if (currentEditFeature) {
        if (modify) map.removeInteraction(modify);
        if (translate) map.removeInteraction(translate);
        currentEditFeature = null;
    }
    addGeneralInteractions();
    return false;
};

saveFeatureBtn.onclick = async function () {
    if (!currentDrawnFeature) return;

    const name = featureNameInput.value.trim();
    if (!name) {
        alert('Lütfen bir özellik adı girin.');
        return;
    }

    currentDrawnFeature.set('name', name);
    currentDrawnFeature.set('isDrawnAndSaved', true);

    const geometry = currentDrawnFeature.getGeometry();

    const wktString = wktFormat.writeGeometry(geometry, {
        dataProjection: 'EPSG:4326',
        featureProjection: 'EPSG:4326'
    });

    try {
        const response = await fetch('https://localhost:7150/api/feature', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: name,
                wkt: wktString
            })
        });

        if (!response.ok) {
            throw new Error('Veritabanına kayıt başarısız');
        }

        const result = await response.json();

        currentDrawnFeature.set('id', result.data?.id || null);

        drawSource.removeFeature(currentDrawnFeature);
        apiVectorSource.addFeature(currentDrawnFeature);

        console.log('Kayıt başarılı:', result.data);
    } catch (err) {
        console.error('Kayıt sırasında hata:', err);
        alert('Sunucuya kayıt sırasında bir hata oluştu.');
    }

    
    overlay.setPosition(undefined);
    currentDrawnFeature = null;
    addGeneralInteractions();
};


document.getElementById('undo').addEventListener('click', function () {
    if (draw) {
        draw.removeLastPoint();
    }
});

typeSelect.onchange = function () {
    overlay.setPosition(undefined);
    if (currentDrawnFeature) {
        drawSource.removeFeature(currentDrawnFeature);
        currentDrawnFeature = null;
    }
    if (currentEditFeature) {
        if (modify) map.removeInteraction(modify);
        if (translate) map.removeInteraction(translate);
        currentEditFeature = null;
    }
    addInteractions();
};

let currentEditFeature = null;
let currentDrawnFeature = null;

export function getCurrentEditFeature() {
    return currentEditFeature;
}
export function setCurrentEditFeature(feature) {
    currentEditFeature = feature;
}

export function getCurrentDrawnFeature() {
    return currentDrawnFeature;
}
export function setCurrentDrawnFeature(feature) {
    currentDrawnFeature = feature;
}
export function setModifyInteraction(newModify) {
    modify = newModify;
}
export function setTranslateInteraction(newTranslate) {
    translate = newTranslate;
}
export function getModifyInteraction() {
    return modify;
}

export function getTranslateInteraction() {
    return translate;
}
export function getDrawInteraction() {
    return draw;
}

export function getSnapInteraction() {
    return snap;
}