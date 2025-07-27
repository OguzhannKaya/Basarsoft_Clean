let draw; // Mevcut çizim etkileşimini saklamak için değişken

function addInteraction() {
    const typeSelect = document.getElementById('type');
    const value = typeSelect.value;
    if (draw) {
        map.removeInteraction(draw);
    }

    if (value !== 'None') {
        draw = new ol.interaction.Draw({
            source: drawingVectorSource,
            type: value,
        });
        map.addInteraction(draw);

        draw.on('drawend', function (event) {
            const feature = event.feature;
            const featureName = prompt('Lütfen çizdiğiniz ' + feature.getGeometry().getType() + ' için bir isim girin:', '');

            if (featureName === null || featureName.trim() === '') {
                drawingVectorSource.removeFeature(feature);
                alert('Çizim iptal edildi veya isimsiz bırakıldı.');
                return;
            }

            feature.set('name', featureName.trim());
            console.log('Çizim tamamlandı:', feature.getGeometry().getType(), 'İsim:', feature.get('name'), 'Koordinatlar:', feature.getGeometry().getCoordinates());
            alert('Yeni bir ' + feature.getGeometry().getType() + ' başarıyla çizildi ve "' + feature.get('name') + '" olarak adlandırıldı!');

            map.removeInteraction(draw);
            draw = null;
            typeSelect.value = 'None';
        });
    }
}

// Geri Al Butonu Mantığı
document.getElementById('undoDrawing').addEventListener('click', function () {
    if (draw && draw.get('sketchFeature')) {
        draw.removeLastPoint();
    } else {
        const features = drawingVectorSource.getFeatures();
        if (features.length > 0) {
            drawingVectorSource.removeFeature(features[features.length - 1]);
        }
    }
});

// Tüm Çizimleri Temizle Butonu Mantığı
document.getElementById('clearDrawings').addEventListener('click', function () {
    drawingVectorSource.clear();
    console.log('Harita üzerindeki çizimler temizlendi.');
    alert('Harita üzerindeki tüm çizimler temizlendi.');
});

// Çizim etkileşimini başlat
document.getElementById('type').onchange = addInteraction;