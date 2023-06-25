const fs = require('fs');
const path = require('path');
const es = require('event-stream');
const JSONStream = require('jsonstream-next');
const { project, projectVector3, projections } = require('../../src/util/projections')

// Run like: node --max-old-space-size=4096 util\testing\cityJsonTileFilter.js

const v8 = require('v8');
const totalHeapSize = v8.getHeapStatistics().total_available_size;
let totalHeapSizeInMB = (totalHeapSize / 1024 / 1024).toFixed(2)
console.log("V8 Total Heap Size", totalHeapSizeInMB, "MB");


const fileOrigin = 'C:/Users/Mirko/Downloads/37en2.volledig/37en2.json';

const fileVertices = path.resolve('./testData/cityJsonVertices.json');


let vertices = []
function loadVertices(){
    vertices = JSON.parse('[' + fs.readFileSync(path.resolve(fileVertices), {
        encoding: 'utf8',
    }) + '[0,0,0]]');
    console.log(`Read vertices, length: ${vertices.length}`)
}
loadVertices();

function round(num, precision){
    const factor = Math.pow(10, precision);
    return Math.round(num * factor) / factor;
}

const transform = {
    scale: [ 0.001, 0.001, 0.001 ],
    translate: [ 84695.7419999987, 442332.622, -99.9899978637695 ]
};

const metaData = {
    geographicalExtent: [
        84695.7419999987,
        442332.622,
        -99.9899978637695,
        90657.0890000015,
        451029.554,
        147.850006103516
    ],
    referenceSystem: 'urn:ogc:def:crs:EPSG::7415'
};

function transformVertices(vi){
    return [
        round((vi[0] * transform.scale[0]) + transform.translate[0] - 155000, 1),
        round((vi[1] * transform.scale[1]) + transform.translate[1] - 463000, 1),
        round((vi[2] * transform.scale[2]) + transform.translate[2], 1)
    ];
}

const testVertices = [
    [1065929,7666077,99490],
    [1067019,7664286,99490],
    [1067080,7664327,99490],
]; // Total amount of vertices is: 26.205.700
testVertices.forEach(v => console.log(transformVertices(v)));

// Stats:
// - BuildingSolidLod1, geometries: 20053, boundaries: 20053, vertices: 1.965.432
// - Total, geometries: 106417, boundaries: 51.884.294, vertices: 157.558.155
// - Geo types, Solid === Building, MultiSurface = 86353
// - Lod === 1: 106417
// - Types:  {
//     Building: 20053,
//     Road: 20190,
//     WaterBody: 4126,
//     LandUse: 45822,
//     PlantCover: 12527,
//     GenericCityObject: 2337,
//     Bridge: 1362
//   }


function streamVertices(){
    console.log('Starting stream Vertices');
    let i = 0;
// CityObjects.* / vertices / transform
    const stream = fs.createReadStream(path.resolve(fileOrigin)).pipe(JSONStream.parse(['vertices', true], (item) => {
        i++;

        if(i === 1){
            console.log('Found the first item!');
            console.log(item);
        }

        // return i === 1 ? item : null;
        return item;
    }))
        .pipe(es.mapSync(function(data){
            // console.log(data);
            // console.log(data.geometry[0].boundaries[0]);
            // return data;
            return JSON.stringify(data) + ',';
        }))
        .pipe(fs.createWriteStream('testData/cityJsonVerticesTest.json', {
            encoding: 'utf8',
        }));

    stream.on('close', () => console.log(`Stream closed, ${i} items were found!`));
    stream.on('finish', () => console.log(`Stream finished, ${i} items were found!`));
}

const aroundCenter = [-69752.6, -16271];
const aroundRange = 300;

function isInRange(coord){
    return (coord[0] > aroundCenter[0] - aroundRange && coord[0] < aroundCenter[0] + aroundRange)
        && (coord[1] > aroundCenter[1] - aroundRange && coord[1] < aroundCenter[1] + aroundRange);
}

function streamCityObjects(){
    console.log('Starting stream CityObjects');

    const stats = {
        geometries: 0,
        boundaries: 0,
        vertices: 0,
        types: {},
        geo: {lod: {}, type: {}, },
        added: 0,
    };

    let i = 0;
    const stream = fs.createReadStream(path.resolve(fileOrigin)).pipe(JSONStream.parse(['CityObjects', true], (item) => {
        if(item.type !== 'Building') return null;

        const firstGeo = item.geometry[0];
        // All buildings are like this, so this is kinda unneeded
        if(firstGeo.type !== 'Solid' || firstGeo.lod !== '1') return null;

        i++;
        if(i === 1){
            console.log('Found the first item!');
            console.log(item);
        }

        stats.types[item.type] = (stats.types[item.type] || 0) + 1;

        // Only take the first x results for now
        // if(i > 10) return null;

        // const boundariesTest = [
        //     [
        //         [[0,1,2]],[[3,1,0]],[[3,4,1]],[[5,3,0]],[[6,2,7]],[[6,8,2]],[[8,0,2]],[[7,1,9]],[[7,2,1]],
        //         [[9,4,10]],[[9,1,4]],[[10,3,11]],[[10,4,3]],[[11,12,13]],[[11,5,12]],[[11,3,5]],[[13,8,6]],
        //         [[13,0,8]],[[13,12,0]],[[12,5,0]],[[9,6,7]],[[9,11,6]],[[10,11,9]],[[11,13,6]]
        //     ]
        // ];

        let someCoord = null;

        // Map the vertices and transform them
        stats.geometries += item.geometry.length;
        item.geometry.map(geo => {
            stats.geo.lod[geo.lod] = (stats.geo.lod[geo.lod] || 0) + 1;
            stats.geo.type[geo.type] = (stats.geo.type[geo.type] || 0) + 1;

            stats.boundaries += geo.boundaries.length;
            geo.boundaries = geo.boundaries.map(b => {
                return b.map(set => {
                    return set.map(subSet => {
                        // console.log('Mapping subset', subSet)
                        // console.log(subSet.map(one => transformVertices(vertices[one])))

                        // Array == solid it seems
                        if(Array.isArray(subSet)){
                            stats.vertices += subSet.length;

                            someCoord = transformVertices(vertices[subSet[0]]);

                            return subSet.map(one => transformVertices(vertices[one]));
                        }

                        // rest is multi surface probably
                        else {
                            stats.vertices++;

                            return transformVertices(subSet);
                        }
                    });
                });
            });

            return geo;
        });

        return someCoord ? (isInRange(someCoord) ? item : null) : null;

        // TODO: define center, put in property and normalize boundaries

        // return null;
        // return item;
    }))
        .pipe(es.mapSync(function(data){
            // console.log(data);
            // console.log(data.geometry[0].boundaries[0]);
            // return data;
            stats.added++;
            return JSON.stringify(data) + ',';
        }))
        .pipe(fs.createWriteStream('testData/cityJsonObjectsTest2.json', {
            encoding: 'utf8',
        }))

    stream.on('close', () => {
        console.log(`Stream closed, ${i} items were found!`)
        console.log(stats);
    });
    stream.on('finish', () => console.log(`Stream finished, ${i} items were found!`));
}
streamCityObjects();

// function delayResumeTime( jstr ) {
//     setInterval(function() {
//         jstr.resume();
//     }, 300);
// }
// delayResumeTime(stream)

// stream.on('header', (data) => console.log('header:', data));
// stream.on('footer', (data) => console.log('footer:', data));

// fs.writeFileSync('./testData/buildingsTud.cityjson', JSON.stringify(json[0]));

