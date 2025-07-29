import WKT from 'https://cdn.skypack.dev/ol/format/WKT';
import Feature from 'https://cdn.skypack.dev/ol/Feature';
import { map, apiVectorSource, drawSource, overlay } from './mapSetup.js';
import { updateDataDisplay } from './uiHandler.js';
import {getCurrentEditFeature, setCurrentEditFeature, getCurrentDrawnFeature, setCurrentDrawnFeature, addGeneralInteractions, modify,translate} from './interactions.js';

// State değişkenleri (sadece bu dosyada tutulur)
let currentPage = 1;
let isLastPage = false;
export let pageSize = 10;
export let allFeaturesLoaded = [];

const wktFormat = new WKT();

// Getter/Setter
export function getCurrentPage() {
    return currentPage;
}
export function setCurrentPage(value) {
    currentPage = value;
}

export function getIsLastPage() {
    return isLastPage;
}
export function setIsLastPage(value) {
    isLastPage = value;
}

// API'den veri çekme
export async function loadApiData(pageNumber = 1) {
    const apiUrl = `https://localhost:7150/api/feature?pageNumber=${pageNumber}`;

    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error('HTTP hatası! Durum: ' + response.status);
        }
        const apiResponse = await response.json();

        allFeaturesLoaded = [];
        apiVectorSource.clear();

        const featuresToProcess = apiResponse.data || [];

        featuresToProcess.forEach(item => {
            try {
                const wktData = item.WKT || item.wkt;

                if (!wktData) {
                    console.warn('WKT verisi eksik veya tanımsız: ', item);
                    return;
                }

                const geometry = wktFormat.readGeometry(wktData, {
                    dataProjection: 'EPSG:4326',
                    featureProjection: 'EPSG:4326'
                });

                const feature = new Feature({
                    geometry: geometry,
                    isDrawnAndSaved: item.isDrawnAndSaved || false,
                    properties: item
                });
                feature.set('name', item.name || 'Bilinmeyen');
                feature.set('id', item.id);

                allFeaturesLoaded.push(feature);
            } catch (wktError) {
                console.error('WKT okuma hatası veya geometri hatası:', wktError, 'WKT:', item.WKT || item.wkt);
            }
        });

        setIsLastPage(allFeaturesLoaded.length < pageSize);
        await updateDataDisplay(true);

        console.log('API verileri başarıyla yüklendi. Toplam özellik sayısı:', allFeaturesLoaded.length);
    } catch (error) {
        console.error('API verileri çekilirken bir hata oluştu:', error);
        document.getElementById('featureCount').textContent = 'Veri yüklenemedi.';
    }
}

// Kaydetme / Güncelleme
export async function saveFeature() {
    const featureName = document.getElementById('featureName').value.trim();
    if (featureName === '') {
        alert('Lütfen bir isim giriniz!');
        return;
    }

    let featureToProcess;
    let apiUrl;
    let httpMethod;
    let featureIdToUpdate = null;

    const drawn = getCurrentDrawnFeature();
    const edit = getCurrentEditFeature();

    if (drawn) {
        featureToProcess = drawn;
        featureToProcess.set('name', featureName);
        apiUrl = 'https://localhost:7150/api/feature';
        httpMethod = 'POST';
    } else if (edit) {
        featureToProcess = edit;
        featureToProcess.set('name', featureName);
        const featureProps = featureToProcess.get('properties') || {};
        featureIdToUpdate = featureToProcess.get('id') || featureProps.id;

        if (!featureIdToUpdate) {
            alert('Güncellenecek özelliğin ID\'si bulunamadı.');
            overlay.setPosition(undefined);
            return;
        }
        apiUrl = `https://localhost:7150/api/feature/${featureIdToUpdate}`;
        httpMethod = 'PUT';
    } else {
        alert('Kaydedilecek veya güncellenecek bir özellik bulunamadı.');
        overlay.setPosition(undefined);
        return;
    }

    const wktString = wktFormat.writeFeature(featureToProcess, {
        dataProjection: 'EPSG:4326',
        featureProjection: 'EPSG:4326'
    });

    const featureDataToSend = {
        id: featureIdToUpdate,
        name: featureName,
        wkt: wktString
    };

    try {
        const response = await fetch(apiUrl, {
            method: httpMethod,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(featureDataToSend),
        });

        if (!response.ok) {
            throw new Error(`${httpMethod === 'POST' ? 'Kaydedilirken' : 'Güncellenirken'} bir hata oluştu: ` + response.statusText);
        }

        if (drawn) {
            drawSource.removeFeature(drawn);
            setCurrentDrawnFeature(null);
        }

        if (edit) {
            if (modify) map.removeInteraction(modify);
            if (translate) map.removeInteraction(translate);
            setCurrentEditFeature(null);
        }

        await loadApiData(getCurrentPage());
        overlay.setPosition(undefined);
        addGeneralInteractions();
    } catch (error) {
        console.error(`Özellik ${httpMethod === 'POST' ? 'kaydetme' : 'güncelleme'} hatası:`, error);
        alert(`Özellik ${httpMethod === 'POST' ? 'kaydedilirken' : 'güncellenirken'} bir sorun oluştu: ` + error.message);
        overlay.setPosition(undefined);
    }
}

// Silme
export async function deleteFeature(featureId) {
    const deleteUrl = `https://localhost:7150/api/feature/${featureId}`;

    try {
        const response = await fetch(deleteUrl, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error('Özellik silinirken bir hata oluştu: ' + response.statusText);
        }

        console.log(`Özellik (ID: ${featureId}) başarıyla silindi.`);
        if (allFeaturesLoaded.length === 0 && getCurrentPage() > 1) {
            setCurrentPage(getCurrentPage() - 1);
        }
        await loadApiData(getCurrentPage());
    } catch (error) {
        console.error('Özellik silme hatası:', error);
        alert('Özellik silinirken bir sorun oluştu: ' + error.message);
    }
}
