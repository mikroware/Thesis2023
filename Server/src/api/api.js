import bodyParser from 'body-parser'
import express from 'express'
import cors from 'cors'
import apiConfig from './apiConfig'
import apiEditing from './apiEditing'
import apiTestData from './apiTestData'

/**
 *
 * @param app {ServerApplication}
 */
function api(app){
    const api = express();

    api.use(bodyParser.json());
    api.use(cors());

    api.use('/cache', express.static('./cache'));
    api.use('/testData', express.static('./testData'));

    api.get('/info', (req, res) => {
        res.json({
            running: true,
            version: 1,
            system: app.store.getState().system,
        });
    });

    apiConfig(api, app);
    apiEditing(api, app);

    apiTestData(api);

    return api
}

export default api
