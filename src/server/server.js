require('dotenv').config();

const Hapi = require('@hapi/hapi');
const routes = require('../server/routes');
const loadModel = require('../services/loadModel');
const InputError = require('../exceptions/InputError');

(async () => {
    const server = Hapi.server({
        port: 3000,
        host: 'localhost',
        routes: {
            cors: { origin: ['*'] },
            payload: { maxBytes: 1000000 },
        },
    });

    server.app.model = await loadModel();
    server.route(routes);

    server.ext('onPreResponse', (request, h) => {
        const { response } = request;

        if (response.isBoom) {
            if (response.output.statusCode === 413) {
                return h
                    .response({
                        status: 'fail',
                        message: 'Payload content length greater than maximum allowed: 1000000',
                    })
                    .code(413);
            }

            if (response instanceof InputError) {
                return h
                    .response({
                        status: 'fail',
                        message: response.message,
                    })
                    .code(400);
            }

            return h
                .response({
                    status: 'fail',
                    message: 'Terjadi kesalahan dalam melakukan prediksi',
                })
                .code(500);
        }

        return h.continue;
    });

    await server.start();
    console.log(`Server started at: ${server.info.uri}`);
})();
