import Collection from 'https://cdn.skypack.dev/ol/Collection';
import Modify from 'https://cdn.skypack.dev/ol/interaction/Modify';
import Translate from 'https://cdn.skypack.dev/ol/interaction/Translate';
import { getCenter } from 'https://cdn.skypack.dev/ol/extent';
import WKT from 'https://cdn.skypack.dev/ol/format/WKT';
import Feature from 'https://cdn.skypack.dev/ol/Feature';
import { map, apiVectorSource, drawSource, overlay, apiVectorLayer, drawLayer, infoOverlay, infoElement } from './mapSetup.js';
import { allFeaturesLoaded, loadApiData, deleteFeature, getCurrentPage, setCurrentPage, getIsLastPage } from './apiHandler.js';
import { getCurrentEditFeature, setCurrentEditFeature, addInteractions, setModifyInteraction, setTranslateInteraction, getModifyInteraction, getTranslateInteraction, getDrawInteraction, getSnapInteraction } from './interactions.js';

const wktFormat = new WKT();

// Göster/Gizle butonu mantığı
let isApiDataVisible = true;

document.addEventListener('DOMContentLoaded', () => {
    const toggleBtn = document.getElementById('toggleApiDataBtn');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            isApiDataVisible = !isApiDataVisible;
            updateDataDisplay(isApiDataVisible);

            toggleBtn.textContent = isApiDataVisible ? 'Verileri Gizle' : 'Verileri Göster';
        });

        toggleBtn.textContent = isApiDataVisible ? 'Verileri Gizle' : 'Verileri Göster';
    }
});

export function updateDataDisplay(isVisible) {
    apiVectorSource.clear();
    document.getElementById('api-data-list').innerHTML = '';

    if (isVisible) {
        document.getElementById('api-data-scroll-container').style.display = 'block';

        allFeaturesLoaded.forEach(feature => {
            apiVectorSource.addFeature(feature);

            const listItem = document.createElement('li');
            const featureProps = feature.get('properties') || {};
            const featureId = feature.get('id') || featureProps.id || 'Yok';
            const featureName = feature.get('name') || 'Bilinmiyor';

            listItem.dataset.featureId = featureId;
            listItem.dataset.isDrawnAndSaved = feature.get('isDrawnAndSaved');

            const textContent = document.createElement('span');
            textContent.innerHTML = `<strong>ID:</strong> ${featureId}<br>
                <strong>Ad:</strong> ${featureName}<br>
                <strong>Tür:</strong> ${feature.getGeometry().getType()}`;
            listItem.appendChild(textContent);

            const buttonContainer = document.createElement('div');
            buttonContainer.classList.add('list-item-buttons');

            const updateButton = document.createElement('button');
            updateButton.textContent = 'Güncelle';
            updateButton.classList.add('update-btn');
            updateButton.onclick = function () {
                handleUpdateFeature(featureId);
            };
            buttonContainer.appendChild(updateButton);

            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Sil';
            deleteButton.classList.add('delete-btn');
            deleteButton.onclick = async function () {
                if (confirm(`'${featureName}' adlı özelliği silmek istediğinizden emin misiniz?`)) {
                    await deleteFeature(featureId);
                }
            };
            buttonContainer.appendChild(deleteButton);

            listItem.appendChild(buttonContainer);
            document.getElementById('api-data-list').appendChild(listItem);
        });

        setupPaginationControls();
    } else {
        document.getElementById('api-data-scroll-container').style.display = 'none';
    }

    document.getElementById('featureCount').textContent = isVisible ? allFeaturesLoaded.length : 0;
}

function handleUpdateFeature(featureId) {
    const currentModify = getModifyInteraction();
    const currentTranslate = getTranslateInteraction();
    const currentDraw = getDrawInteraction();
    const currentSnap = getSnapInteraction();

    if (currentDraw) map.removeInteraction(currentDraw);
    if (currentSnap) map.removeInteraction(currentSnap);
    if (currentTranslate) map.removeInteraction(currentTranslate);
    if (currentModify) map.removeInteraction(currentModify);

    overlay.setPosition(undefined);
    drawSource.clear();

    const editFeature = allFeaturesLoaded.find(f => f.get('id') === featureId);
    setCurrentEditFeature(editFeature);

    if (editFeature) {
        const newModify = new Modify({ features: new Collection([editFeature]) });
        map.addInteraction(newModify);
        setModifyInteraction(newModify);

        const newTranslate = new Translate({ features: new Collection([editFeature]) });
        map.addInteraction(newTranslate);
        setTranslateInteraction(newTranslate);

        const geometry = editFeature.getGeometry();
        const extent = geometry.getExtent();
        const centerCoord = getCenter(extent);

        map.getView().fit(extent, {
            duration: 500,
            maxZoom: 18,
            padding: [100, 100, 100, 100]
        });

        overlay.setPosition(centerCoord);
        document.getElementById('popup').style.display = 'block';
        document.getElementById('featureName').value = editFeature.get('name') || '';
        document.getElementById('saveFeatureBtn').textContent = 'Güncelle';
        document.getElementById('featureName').focus();
    } else {
        alert('Güncellenecek özellik haritada bulunamadı.');
    }
}



function setupPaginationControls() {
    const prevPageBtn = document.getElementById('prevPageBtn');
    const nextPageBtn = document.getElementById('nextPageBtn');
    const pageInfo = document.getElementById('pageInfo');

    pageInfo.textContent = `Sayfa ${getCurrentPage()}`;
    prevPageBtn.disabled = getCurrentPage() === 1;
    nextPageBtn.disabled = getIsLastPage();

    prevPageBtn.onclick = async function () {
        if (getCurrentPage() > 1) {
            setCurrentPage(getCurrentPage() - 1);
            await loadApiData(getCurrentPage());
        }
    };

    nextPageBtn.onclick = async function () {
        if (!getIsLastPage()) {
            setCurrentPage(getCurrentPage() + 1);
            await loadApiData(getCurrentPage());
        }
    };
}
