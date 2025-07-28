// Harita oluştur
const map = new ol.Map({
    target: 'map',
    layers: [
        new ol.layer.Tile({
            source: new ol.source.OSM()
        })
    ],
    view: new ol.View({
        center: ol.proj.fromLonLat([32.8597, 39.9334]),
        zoom: 10
    })
});

const apiVectorSource = new ol.source.Vector();
const apiVectorLayer = new ol.layer.Vector({
    source: apiVectorSource,
    style: function (feature) {
        const geometryType = feature.getGeometry().getType();
        let style;

        if (feature.get('isDrawnAndSaved')) {
            style = new ol.style.Style({
                fill: new ol.style.Fill({
                    color: 'rgba(255, 200, 0, 0.5)'
                }),
                stroke: new ol.style.Stroke({
                    color: 'rgba(255, 150, 0, 0.8)',
                    width: 2
                }),
                image: new ol.style.Circle({
                    radius: 7,
                    fill: new ol.style.Fill({
                        color: 'rgba(255, 200, 0, 0.7)'
                    }),
                    stroke: new ol.style.Stroke({
                        color: 'rgba(255, 150, 0, 1)',
                        width: 1.5
                    })
                })
            });
        } else {
            switch (geometryType) {
                case 'Point':
                    style = new ol.style.Style({
                        image: new ol.style.Circle({
                            radius: 7,
                            fill: new ol.style.Fill({
                                color: 'rgba(255, 100, 100, 0.7)'
                            }),
                            stroke: new ol.style.Stroke({
                                color: 'rgba(255, 0, 0, 1)',
                                width: 1.5
                            })
                        })
                    });
                    break;
                case 'LineString':
                case 'MultiLineString':
                    style = new ol.style.Style({
                        stroke: new ol.style.Stroke({
                            color: 'rgba(0, 150, 255, 0.7)',
                            width: 3
                        })
                    });
                    break;
                case 'Polygon':
                case 'MultiPolygon':
                    style = new ol.style.Style({
                        fill: new ol.style.Fill({
                            color: 'rgba(100, 255, 100, 0.5)'
                        }),
                        stroke: new ol.style.Stroke({
                            color: 'rgba(0, 128, 0, 0.8)',
                            width: 2
                        })
                    });
                    break;
                default:
                    style = new ol.style.Style({
                        fill: new ol.style.Fill({
                            color: 'rgba(200, 200, 200, 0.6)'
                        }),
                        stroke: new ol.style.Stroke({
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

const drawSource = new ol.source.Vector();
const drawLayer = new ol.layer.Vector({
    source: drawSource,
    style: new ol.style.Style({
        fill: new ol.style.Fill({
            color: 'rgba(255, 255, 255, 0.2)'
        }),
        stroke: new ol.style.Stroke({
            color: '#ffcc33',
            width: 2
        }),
        image: new ol.style.Circle({
            radius: 7,
            fill: new ol.style.Fill({
                color: '#ffcc33'
            })
        })
    })
});
map.addLayer(drawLayer);

const typeSelect = document.getElementById('type');
let draw, snap, modify, translate;

const popupContainer = document.getElementById('popup');
const popupCloser = document.getElementById('popup-closer');
const featureNameInput = document.getElementById('featureName');
const saveFeatureBtn = document.getElementById('saveFeatureBtn');

const overlay = new ol.Overlay({
    element: popupContainer,
    autoPan: true,
    autoPanAnimation: {
        duration: 250,
    },
});
map.addOverlay(overlay);

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

let currentDrawnFeature = null;
let currentEditFeature = null;

function addGeneralInteractions() {
    if (modify) map.removeInteraction(modify);
    if (translate) map.removeInteraction(translate);

    modify = new ol.interaction.Modify({ source: apiVectorSource });
    map.addInteraction(modify);
}

function addInteractions() {
    const value = typeSelect.value;
    if (draw) map.removeInteraction(draw);
    if (snap) map.removeInteraction(snap);

    if (value !== 'None') {
        if (modify) map.removeInteraction(modify);
        if (translate) map.removeInteraction(translate);

        draw = new ol.interaction.Draw({
            source: drawSource,
            type: value,
        });

        draw.on('drawend', function (event) {
            currentDrawnFeature = event.feature;
            const coordinate = event.feature.getGeometry().getLastCoordinate();
            let centerCoord = coordinate;
            if (event.feature.getGeometry().getType() === 'Polygon' || event.feature.getGeometry().getType() === 'LineString') {
                const extent = event.feature.getGeometry().getExtent();
                centerCoord = ol.extent.getCenter(extent);
            }
            overlay.setPosition(centerCoord);
            featureNameInput.value = '';
            featureNameInput.focus();
            saveFeatureBtn.textContent = 'Kaydet';
        });

        map.addInteraction(draw);
        snap = new ol.interaction.Snap({ source: drawSource });
        map.addInteraction(snap);
    } else {
        addGeneralInteractions();
    }
}

saveFeatureBtn.onclick = async function () {
    const featureName = featureNameInput.value.trim();
    if (featureName === '') {
        alert('Lütfen bir isim giriniz!');
        return;
    }

    const wktFormat = new ol.format.WKT();
    let featureToProcess;
    let apiUrl;
    let httpMethod;
    let featureIdToUpdate = null;

    if (currentDrawnFeature) {
        featureToProcess = currentDrawnFeature;
        featureToProcess.set('name', featureName);
        apiUrl = 'https://localhost:7150/api/feature';
        httpMethod = 'POST';
    } else if (currentEditFeature) {
        featureToProcess = currentEditFeature;
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
        featureProjection: 'EPSG:3857'
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

        if (currentDrawnFeature) {
            drawSource.removeFeature(currentDrawnFeature);
            currentDrawnFeature = null;
        }

        if (currentEditFeature) {
            if (modify) map.removeInteraction(modify);
            if (translate) map.removeInteraction(translate);
            currentEditFeature = null;
        }

        await loadApiData(currentPage);
        overlay.setPosition(undefined);
        addGeneralInteractions();
    } catch (error) {
        console.error(`Özellik ${httpMethod === 'POST' ? 'kaydetme' : 'güncelleme'} hatası:`, error);
        alert(`Özellik ${httpMethod === 'POST' ? 'kaydedilirken' : 'güncellenirken'} bir sorun oluştu: ` + error.message);
        overlay.setPosition(undefined);
    }
};

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

document.getElementById('undo').addEventListener('click', function () {
    if (draw) {
        draw.removeLastPoint();
    }
});

addInteractions();
addGeneralInteractions();

// Pagination variables
let currentPage = 1;
let pageSize = 10;
let isLastPage = false;
let allFeaturesLoaded = [];
let isApiDataVisible = true;

const featureCountElement = document.getElementById('featureCount');
const apiDataListElement = document.getElementById('api-data-list');
const apiDataScrollContainer = document.getElementById('api-data-scroll-container');

async function loadApiData(pageNumber = 1) {
    const apiUrl = `https://localhost:7150/api/feature?pageNumber=${pageNumber}`;

    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error('HTTP hatası! Durum: ' + response.status);
        }
        const apiResponse = await response.json();

        allFeaturesLoaded = [];
        apiVectorSource.clear();
        const wktFormatApi = new ol.format.WKT();

        const featuresToProcess = apiResponse.data || [];

        featuresToProcess.forEach(item => {
            try {
                const wktData = item.WKT || item.wkt;

                if (!wktData) {
                    console.warn('WKT verisi eksik veya tanımsız: ', item);
                    return;
                }

                const geometry = wktFormatApi.readGeometry(wktData, {
                    dataProjection: 'EPSG:4326',
                    featureProjection: 'EPSG:3857'
                });

                const feature = new ol.Feature({
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

        // Check if this is the last page
        isLastPage = allFeaturesLoaded.length < pageSize;

        updateDataDisplay(isApiDataVisible);
        updatePaginationControls();

        console.log('API verileri başarıyla yüklendi. Toplam özellik sayısı:', allFeaturesLoaded.length);
    } catch (error) {
        console.error('API verileri çekilirken bir hata oluştu:', error);
        featureCountElement.textContent = 'Veri yüklenemedi.';
    }
}

function updatePaginationControls() {
    const prevPageBtn = document.getElementById('prevPageBtn');
    const nextPageBtn = document.getElementById('nextPageBtn');
    const pageInfo = document.getElementById('pageInfo');

    pageInfo.textContent = `Sayfa ${currentPage}`;
    prevPageBtn.disabled = currentPage === 1;
    nextPageBtn.disabled = isLastPage;
}

function updateDataDisplay(isVisible) {
    apiVectorSource.clear();
    apiDataListElement.innerHTML = '';

    if (isVisible) {
        apiDataScrollContainer.style.display = 'block';

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
            apiDataListElement.appendChild(listItem);
        });
    } else {
        apiDataScrollContainer.style.display = 'none';
    }

    featureCountElement.textContent = isVisible ? allFeaturesLoaded.length : 0;
}

function handleUpdateFeature(featureId) {
    if (draw) map.removeInteraction(draw);
    if (snap) map.removeInteraction(snap);
    if (modify) map.removeInteraction(modify);
    if (translate) map.removeInteraction(translate);

    overlay.setPosition(undefined);
    drawSource.clear();

    currentEditFeature = allFeaturesLoaded.find(f => f.get('id') === featureId);

    if (currentEditFeature) {
        modify = new ol.interaction.Modify({
            features: new ol.Collection([currentEditFeature])
        });
        map.addInteraction(modify);

        translate = new ol.interaction.Translate({
            features: new ol.Collection([currentEditFeature])
        });
        map.addInteraction(translate);

        const geometry = currentEditFeature.getGeometry();
        const extent = geometry.getExtent();
        map.getView().fit(extent, {
            size: map.getSize(),
            padding: [50, 50, 50, 50],
            duration: 500
        });

        const centerCoord = geometry.getType() === 'Point' ? geometry.getCoordinates() : ol.extent.getCenter(extent);
        overlay.setPosition(centerCoord);
        featureNameInput.value = currentEditFeature.get('name') || '';
        saveFeatureBtn.textContent = 'Güncelle';
        featureNameInput.focus();
    } else {
        alert('Güncellenecek özellik haritada bulunamadı.');
    }
}

async function deleteFeature(featureId) {
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
        if (allFeaturesLoaded.length === 0 && currentPage > 1) {
            currentPage--;
        }
        await loadApiData(currentPage);
    } catch (error) {
        console.error('Özellik silme hatası:', error);
        alert('Özellik silinirken bir sorun oluştu: ' + error.message);
    }
}

const toggleApiDataBtn = document.getElementById('toggleApiDataBtn');
toggleApiDataBtn.onclick = function () {
    isApiDataVisible = !isApiDataVisible;
    apiVectorLayer.setVisible(isApiDataVisible);
    updateDataDisplay(isApiDataVisible);
    toggleApiDataBtn.textContent = isApiDataVisible ? 'API Verilerini Gizle/Göster' : 'API Verilerini Gizle/Göster';
};

const infoElement = document.getElementById('info');
const infoOverlay = new ol.Overlay({
    element: infoElement,
    offset: [0, -10],
    positioning: 'bottom-center',
    stopEvent: false,
});
map.addOverlay(infoOverlay);

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
            : ol.extent.getCenter(geometry.getExtent());

        infoOverlay.setPosition(coordinate);
        infoElement.style.display = 'block';
    } else {
        infoOverlay.setPosition(undefined);
    }
});

// Pagination event listeners
document.getElementById('prevPageBtn').addEventListener('click', async function () {
    if (currentPage > 1) {
        currentPage--;
        await loadApiData(currentPage);
    }
});

document.getElementById('nextPageBtn').addEventListener('click', async function () {
    if (!isLastPage) {
        currentPage++;
        await loadApiData(currentPage);
    }
});

const manualDrawTypeSelect = document.getElementById('manualDrawType');
const manualCoordsInput = document.getElementById('manualCoordsInput');
const manualFeatureNameInput = document.getElementById('manualFeatureName');
const addManualDrawingButton = document.getElementById('addManualDrawing');
const wktFormat = new ol.format.WKT();

addManualDrawingButton.addEventListener('click', async function () {
    const drawType = manualDrawTypeSelect.value;
    const coordsText = manualCoordsInput.value.trim();
    const featureName = manualFeatureNameInput.value.trim() || 'Manuel Çizim';

    if (!coordsText) {
        alert('Lütfen koordinat veya WKT verisi girin.');
        return;
    }

    let geometry;

    try {
        // Giriş metnini büyük harfe çevirip boşlukları tek boşlukla değiştirerek kontrol et
        const upperCaseCoordsText = coordsText.toUpperCase().replace(/\s+/g, ' ');

        if (drawType === 'Point') {
            // POINT(X Y) formatı için regex kontrolü
            const pointRegex = /^POINT\s*\(\s*(-?\d+(\.\d+)?)\s+(-?\d+(\.\d+)?)\s*\)$/;
            const match = upperCaseCoordsText.match(pointRegex);

            if (match && match.length === 5) {
                const lon = parseFloat(match[1]);
                const lat = parseFloat(match[3]);
                if (!isNaN(lon) && !isNaN(lat)) {
                    // WKT'den okunan koordinat EPSG:4326 olduğu için önce onu okuyup sonra harita projeksiyonuna çeviriyoruz.
                    // geometry = new ol.geom.Point(ol.proj.fromLonLat([lon, lat])); // Bu şekilde Point nesnesini doğrudan oluşturmak yerine WKT okuyucusunu kullanmak daha tutarlı.
                    geometry = wktFormat.readGeometry(`POINT(${lon} ${lat})`, {
                        dataProjection: 'EPSG:4326',
                        featureProjection: 'EPSG:3857'
                    });
                } else {
                    throw new Error('Geçersiz Point koordinat değerleri.');
                }
            } else {
                throw new Error('Geçersiz Point WKT formatı. Örn: POINT(boylam enlem)');
            }
        } else if (drawType === 'LineString') {
            // LINESTRING(...) formatı için regex kontrolü
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
            // POLYGON(...) formatı için regex kontrolü
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
            alert('Desteklenmeyen manuel çizim tipi. Lütfen Point, LineString veya Polygon seçin.');
            return;
        }

        const feature = new ol.Feature({
            geometry: geometry
        });
        feature.set('name', featureName);

        // API'ye gönderilecek WKT'yi EPSG:4326 olarak oluştur
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

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error('Özellik kaydedilirken bir hata oluştu: ' + errorText);
        }

        const responseData = await response.json();
        if (!responseData.isSuccess) {
            if (responseData.message && responseData.message.toLowerCase().includes("successfully")) {
                console.warn("API isSuccess=false ama mesaj başarı gösteriyor, devam ediliyor...");
                // Bu durumda alert vermeye gerek yok
            } else {
                throw new Error(`API işlemi başarısız: ${responseData.message}`);
            }
        }

        console.log('Manuel çizim başarıyla kaydedildi:', responseData);
        alert(`${featureName} adlı ${drawType} başarıyla eklendi ve kaydedildi!`);

        // Alanları temizle
        manualCoordsInput.value = '';
        manualFeatureNameInput.value = '';

        // Haritayı ve listeyi güncel verilerle yeniden yükle
        await loadApiData(currentPage);

        // Eklenen özelliğe odaklanmak için haritayı merkeze al (isteğe bağlı)
        const extent = geometry.getExtent();
        map.getView().fit(extent, {
            size: map.getSize(),
            padding: [50, 50, 50, 50],
            duration: 500
        });

    } catch (error) {
        alert('Çizim eklenirken hata oluştu: ' + error.message + '\nLütfen formatı kontrol edin.');
        console.error('Manuel çizim hatası:', error);
    }
});

// Load initial data
document.addEventListener('DOMContentLoaded', () => loadApiData(currentPage));