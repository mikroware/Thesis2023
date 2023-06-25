import path from 'path'

/**
 *
 * @param {Express} api
 */
function apiTestData(api){
    api.get('/test/file', (req, res) => {
        // TODO: add some file as response
        res.download(path.resolve('testData', 'buurt_tud.geojson'), 'testfile.geojson', {
            // root: path.resolve('testData'),
        });
    });

    api.get('/test/meta', (req, res) => {
        // TODO: add some test meta data
        res.json({});
    });
}

export default apiTestData
