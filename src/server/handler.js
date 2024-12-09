const crypto = require('crypto');
const { Firestore } = require('@google-cloud/firestore');
const predictClassification = require('../services/inferenceService');
const storeData = require('../services/storeData');

async function postPredictHandler(request, h) {
    const { image } = request.payload;
    const maxSize = 1000000;

    if (Buffer.byteLength(image) > maxSize) {
        return h
            .response({
                status: 'fail',
                message: `Payload content length greater than maximum allowed: ${maxSize}`,
            })
            .code(413);
    }

    const { model } = request.server.app;

    try {
        const prediction = await predictClassification(model, image);
        const id = crypto.randomUUID();
        const createdAt = new Date().toISOString();

        const data = {
            id,
            result: prediction.label,
            suggestion: prediction.suggestion,
            createdAt,
        };

        await storeData(id, data);

        return h
            .response({
                status: 'success',
                message: 'Model is predicted successfully',
                data,
            })
            .code(201);
    } catch (err) {
        console.error("Error in postPredictHandler:", err);
        return h
            .response({
                status: 'fail',
                message: err.message || 'Terjadi kesalahan dalam melakukan prediksi',
            })
            .code(400);
    }
}

async function getHistoriesHandler(request, h) {
    const db = new Firestore();
    const predictCollection = db.collection('prediction');

    try {
        const snapshot = await predictCollection.get();
        const histories = snapshot.docs.map(doc => ({
            id: doc.id,
            history: doc.data(),
        }));

        return h
            .response({
                status: 'success',
                data: histories,
            })
            .code(200);
    } catch (err) {
        console.error("Error in getHistoriesHandler:", err);
        return h
            .response({
                status: 'fail',
                message: 'Gagal mengambil data riwayat prediksi.',
            })
            .code(500);
    }
}

module.exports = {
    postPredictHandler,
    getHistoriesHandler,
};
