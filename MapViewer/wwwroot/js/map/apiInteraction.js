const toggleApiDataButton = document.getElementById('toggleApiData');
const featureCountElement = document.getElementById('featureCount');
const apiDataListElement = document.getElementById('api-data-list');
let apiDataLoaded = false;

async function loadApiData() {
    const apiUrl = 'https://localhost:7150/api/feature';

    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error('HTTP hatası! Durum: ' + response.status);
        }
        const apiResponse = await response.json();
        const featuresData = apiResponse.data;

        apiVectorSource.clear();
        apiDataListElement.innerHTML = '';

        const wktFormatApi = new ol.format.WKT();

        featuresData.forEach(item => {
            try {
                const geometry = wktFormatApi.readGeometry(item.WKT, {
                    dataProjection: 'EPSG:4326',
                    featureProjection: 'EPSG:3857'
                });

                const feature = new ol.Feature({
                    geometry: geometry,
                    properties: item
                });
                feature.set('name', item.name || 'API Verisi');

                apiVectorSource.addFeature(feature);

                const listItem = document.createElement('li');
                listItem.setAttribute('data-id', item.id);
                listItem.innerHTML = `
                    <div class="feature-info">
                        <strong>ID:</strong> ${item.id || 'N/A'}<br>
                        <strong>Adı:</strong> ${item.name || 'N/A'}<br>
                        <span><strong>Geometri Tipi:</strong> ${geometry.getType() || 'N/A'}</span><br>
                        <span><strong>WKT:</strong> ${item.WKT ? item.WKT.substring(0, 50) + '...' : 'N/A'}</span>
                    </div>
                    <div class="list-actions">
                        <button class="edit-btn">Güncelle</button>
                        <button class="delete-btn">Sil</button>
                    </div>
                `;
                apiDataListElement.appendChild(listItem);

            } catch (e) {
                console.warn('WKT parse hatası:', item.WKT, e);
            }
        });

        featureCountElement.innerText = 'Yüklenen Veri Sayısı: ' + apiVectorSource.getFeatures().length;
        console.log('API verileri başarıyla yüklendi. Yüklenen feature sayısı:', apiVectorSource.getFeatures().length);

        if (apiVectorSource.getFeatures().length > 0) {
            const extent = apiVectorSource.getExtent();
            map.getView().fit(extent, { size: map.getSize(), padding: [50, 50, 50, 50] });
        }
        apiDataLoaded = true;

        addApiListEventListeners();

    } catch (error) {
        console.error('API verileri yüklenirken bir hata oluştu:', error);
        alert('API verileri yüklenemedi. Konsolu kontrol edin.');
        featureCountElement.innerText = 'Yüklenen Veri Sayısı: Hata!';
        apiDataLoaded = false;
    }
}

function clearApiData() {
    apiVectorSource.clear();
    apiDataListElement.innerHTML = '';
    featureCountElement.innerText = 'Yüklenen Veri Sayısı: 0';
    console.log('API verileri temizlendi.');
    apiDataLoaded = false;
}

toggleApiDataButton.addEventListener('click', async function () {
    if (apiVectorLayer.getVisible()) {
        apiVectorLayer.setVisible(false);
        clearApiData();
    } else {
        apiVectorLayer.setVisible(true);
        if (!apiDataLoaded || apiVectorSource.getFeatures().length === 0) {
            await loadApiData();
        }
    }
});

// Veritabanına Kaydet Butonu Mantığı
document.getElementById('saveToDatabase').addEventListener('click', async function () {
    const featuresToSave = drawingVectorSource.getFeatures();

    if (featuresToSave.length === 0) {
        alert('Kaydedilecek çizim bulunamadı.');
        return;
    }

    const lastFeature = featuresToSave[featuresToSave.length - 1];
    const featureName = lastFeature.get('name') || 'İsimsiz Çizim';
    const wkt = new ol.format.WKT().writeFeature(lastFeature, {
        dataProjection: 'EPSG:4326',
        featureProjection: 'EPSG:3857'
    });
    const geometryType = lastFeature.getGeometry().getType();

    const dataToSave = {
        name: featureName,
        wkt: wkt,
    };

    const apiUrl = 'https://localhost:7150/api/feature';

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dataToSave)
        });

        if (response.ok) {
            const result = await response.json();
            alert(`"${featureName}" (${geometryType}) veritabanına başarıyla kaydedildi!`);
            console.log('API Yanıtı:', result);
            drawingVectorSource.removeFeature(lastFeature);
            await loadApiData();
        } else {
            const errorText = await response.text();
            alert(`Veritabanına kaydederken hata oluştu: ${response.status} - ${errorText}`);
            console.error('API Hatası:', response.status, errorText);
        }
    } catch (error) {
        alert('Veritabanı bağlantısında hata oluştu: ' + error.message);
        console.error('Fetch Hatası:', error);
    }
});

// API Liste Butonları için Event Listener'lar
function addApiListEventListeners() {
    apiDataListElement.querySelectorAll('.delete-btn').forEach(button => {
        button.onclick = async function () {
            const listItem = this.closest('li');
            const featureId = listItem.getAttribute('data-id');

            if (!featureId || !confirm(`ID ${featureId} olan özelliği silmek istediğinizden emin misiniz?`)) {
                return;
            }

            const apiUrl = `https://localhost:7150/api/feature/${featureId}`;

            try {
                const response = await fetch(apiUrl, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    alert(`ID ${featureId} olan özellik başarıyla silindi.`);
                    console.log('API Yanıtı:', await response.json());
                    await loadApiData();
                } else {
                    const errorText = await response.text();
                    alert(`Özellik silinirken hata oluştu: ${response.status} - ${errorText}`);
                    console.error('API Hatası:', response.status, errorText);
                }
            } catch (error) {
                alert('Veritabanı bağlantısında hata oluştu: ' + error.message);
                console.error('Fetch Hatası:', error);
            }
        };
    });

    apiDataListElement.querySelectorAll('.edit-btn').forEach(button => {
        button.onclick = async function () {
            const listItem = this.closest('li');
            const featureId = listItem.getAttribute('data-id');

            if (!featureId) {
                alert('Güncellenecek özellik ID\'si bulunamadı.');
                return;
            }

            const currentFeature = apiVectorSource.getFeatures().find(f => f.get('properties').id == featureId);

            if (!currentFeature) {
                alert('Güncellenecek özellik haritada bulunamadı.');
                return;
            }

            const currentName = currentFeature.get('name');
            const newName = prompt(`ID ${featureId} olan özelliğin yeni adını girin:`, currentName);

            if (newName === null || newName.trim() === '') {
                alert('Güncelleme iptal edildi veya yeni ad boş bırakıldı.');
                return;
            }

            const updatedData = {
                id: featureId,
                name: newName.trim(),
                wkt: new ol.format.WKT().writeFeature(currentFeature, {
                    dataProjection: 'EPSG:4326',
                    featureProjection: 'EPSG:3857'
                })
            };

            const apiUrl = `https://localhost:7150/api/feature/${featureId}`;

            try {
                const response = await fetch(apiUrl, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(updatedData)
                });

                if (response.ok) {
                    alert(`ID ${featureId} olan özellik başarıyla güncellendi. Yeni Ad: ${newName}`);
                    console.log('API Yanıtı:', await response.json());
                    await loadApiData();
                } else {
                    const errorText = await response.text();
                    alert(`Özellik güncellenirken hata oluştu: ${response.status} - ${errorText}`);
                    console.error('API Hatası:', response.status, errorText);
                }
            } catch (error) {
                alert('Veritabanı bağlantısında hata oluştu: ' + error.message);
                console.error('Fetch Hatası:', error);
            }
        };
    });
}