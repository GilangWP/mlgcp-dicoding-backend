const tf = require('@tensorflow/tfjs-node');
const InputError = require('../exceptions/InputError');

async function predictClassification(model, image) {
    try {
        const tensor = tf.node
            .decodeJpeg(image)
            .resizeNearestNeighbor([224, 224])
            .expandDims()
            .toFloat();

        const prediction = model.predict(tensor);
        const scoreArray = await prediction.data();
        console.log('Score Array:', scoreArray);
        const confidenceScore = scoreArray[0] * 100; 
        const label = confidenceScore > 50 ? 'Cancer' : 'Non-cancer';

        let explanation, suggestion;

        if (label === 'Cancer') {
            explanation = "Model mendeteksi adanya tanda-tanda kanker pada gambar yang diunggah.";
            suggestion = "Segera konsultasikan dengan tenaga medis profesional untuk evaluasi dan pengobatan lebih lanjut.";
        } else {
            explanation = "Model tidak mendeteksi tanda-tanda kanker pada gambar yang diunggah.";
            suggestion = "Jika Anda masih memiliki kekhawatiran, pertimbangkan untuk melakukan pemeriksaan rutin dengan dokter.";
        }

        return { confidenceScore, label, explanation, suggestion };
    } catch (error) {
        throw new InputError(`Terjadi kesalahan input: ${error.message}`);
    }
}


module.exports = predictClassification;
