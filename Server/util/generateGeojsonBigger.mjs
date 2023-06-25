import fs from 'fs'
import { repeat } from 'ramda'

function generateGeojsonBigger(testDataFile){
    const data = JSON.parse(fs.readFileSync(`./testData/${testDataFile}.geojson`, { encoding: 'utf8' }));
    const biggers = [2, 5, 10, 15, 20, 30, 40, 50, 100, 200];

    biggers.forEach(multi => {
        fs.writeFileSync(
            `./testData/${testDataFile}-${multi}.geojson`,
            JSON.stringify(repeat(data, multi).flat()),
        );
    });
}

generateGeojsonBigger('voetpad_tud');
