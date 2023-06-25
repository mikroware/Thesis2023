const { open: openShape } = require ('shapefile');
const fs = require('fs');
const path = require('path');
const simplify = require('@turf/simplify');
const cleanCoords = require('@turf/clean-coords').default;
const truncate = require('@turf/truncate').default;
const { coordEach } = require('@turf/meta');
const { project, projections } = require('../../util/projections')

const gpsCenterNetherlands = [
    52.243333, // Maybe turn around??
    5.634167,
];

function roundNumber(num, scale) {
    if(!("" + num).includes("e")) {
        return +(Math.round(num + "e+" + scale)  + "e-" + scale);
    } else {
        var arr = ("" + num).split("e");
        var sig = ""
        if(+arr[1] + scale > 0) {
            sig = "+";
        }
        return +(Math.round(+arr[0] + "e" + sig + (+arr[1] + scale)) + "e-" + scale);
    }
}

function getGeometryAverage(dataSet){
    const cords = dataSet.geometry.coordinates.map(cordSet => {
        const isMulti = dataSet.geometry.type === 'MultiPolygon';
        const cords = isMulti ? cordSet[0] : cordSet

        return cords[0];
    });

    const total = cords.reduce((prev, cord) => [prev[0] + cord[0], prev[1] + cord[1]], [0, 0]);

    return [
        total[0] / cords.length,
        total[1] / cords.length,
    ];
}

function getAverage(data){
    const avgCords = data.map(dataSet => getGeometryAverage(dataSet));

    const total = avgCords.reduce((prev, cord) => [prev[0] + cord[0], prev[1] + cord[1]], [0, 0]);

    return [
        total[0] / avgCords.length,
        total[1] / avgCords.length,
    ];
}

let avg = null;

// var X0=155E3,Y0=463E3,lat0=52.1551744,lng0=5.38720621,latpqK=[];
// for(i=1;12>i;i++)latpqK[i]=[];
// latpqK[1].p=0;latpqK[1].q=1;latpqK[1].K=3235.65389;latpqK[2].p=2;latpqK[2].q=0;latpqK[2].K=-32.58297;latpqK[3].p=0;latpqK[3].q=2;latpqK[3].K=-0.2475;latpqK[4].p=2;latpqK[4].q=1;latpqK[4].K=-0.84978;latpqK[5].p=0;latpqK[5].q=3;latpqK[5].K=-0.0665;latpqK[6].p=2;latpqK[6].q=2;latpqK[6].K=-0.01709;latpqK[7].p=1;latpqK[7].q=0;latpqK[7].K=-0.00738;latpqK[8].p=4;latpqK[8].q=0;latpqK[8].K=0.0053;latpqK[9].p=2;
// latpqK[9].q=3;latpqK[9].K=-3.9E-4;latpqK[10].p=4;latpqK[10].q=1;latpqK[10].K=3.3E-4;latpqK[11].p=1;latpqK[11].q=1;latpqK[11].K=-1.2E-4;
// var lngpqL=[];
// for(i=1;13>i;i++)lngpqL[i]=[];
// lngpqL[1].p=1;lngpqL[1].q=0;lngpqL[1].K=5260.52916;lngpqL[2].p=1;lngpqL[2].q=1;lngpqL[2].K=105.94684;lngpqL[3].p=1;lngpqL[3].q=2;lngpqL[3].K=2.45656;lngpqL[4].p=3;lngpqL[4].q=0;lngpqL[4].K=-0.81885;lngpqL[5].p=1;lngpqL[5].q=3;lngpqL[5].K=0.05594;lngpqL[6].p=3;lngpqL[6].q=1;lngpqL[6].K=-0.05607;lngpqL[7].p=0;lngpqL[7].q=1;
// lngpqL[7].K=0.01199;lngpqL[8].p=3;lngpqL[8].q=2;lngpqL[8].K=-0.00256;lngpqL[9].p=1;lngpqL[9].q=4;lngpqL[9].K=0.00128;lngpqL[10].p=0;lngpqL[10].q=2;lngpqL[10].K=2.2E-4;lngpqL[11].p=2;lngpqL[11].q=0;lngpqL[11].K=-2.2E-4;lngpqL[12].p=5;lngpqL[12].q=0;lngpqL[12].K=2.6E-4;
// var XpqR=[];
// for(i=1;10>i;i++)XpqR[i]=[];
// XpqR[1].p=0;XpqR[1].q=1;XpqR[1].R=190094.945;XpqR[2].p=1;XpqR[2].q=1;XpqR[2].R=-11832.228;XpqR[3].p=2;XpqR[3].q=1;XpqR[3].R=-114.221;XpqR[4].p=0;XpqR[4].q=3;XpqR[4].R=-32.391;XpqR[5].p=1;
// XpqR[5].q=0;XpqR[5].R=-0.705;XpqR[6].p=3;XpqR[6].q=1;XpqR[6].R=-2.34;XpqR[7].p=1;XpqR[7].q=3;XpqR[7].R=-0.608;XpqR[8].p=0;XpqR[8].q=2;XpqR[8].R=-0.008;XpqR[9].p=2;XpqR[9].q=3;XpqR[9].R=0.148;
// var YpqS=[];
// for(i=1;11>i;i++)YpqS[i]=[];
// YpqS[1].p=1;YpqS[1].q=0;YpqS[1].S=309056.544;YpqS[2].p=0;YpqS[2].q=2;YpqS[2].S=3638.893;YpqS[3].p=2;YpqS[3].q=0;YpqS[3].S=73.077;YpqS[4].p=1;YpqS[4].q=2;YpqS[4].S=-157.984;YpqS[5].p=3;YpqS[5].q=0;YpqS[5].S=59.788;YpqS[6].p=0;YpqS[6].q=1;YpqS[6].S=0.433;YpqS[7].p=2;
// YpqS[7].q=2;YpqS[7].S=-6.439;YpqS[8].p=1;YpqS[8].q=1;YpqS[8].S=-0.032;YpqS[9].p=0;YpqS[9].q=4;YpqS[9].S=0.092;YpqS[10].p=1;YpqS[10].q=4;YpqS[10].S=-0.054;
// function gps2X(b,c){
//     var a=0;dlat=0.36*(b-lat0);dlng=0.36*(c-lng0);for(i=1;10>i;i++)a+=XpqR[i].R*Math.pow(dlat,XpqR[i].p)*Math.pow(dlng,XpqR[i].q);
//     return X0+a
// }
// function gps2Y(b,c){
//     var a=0;dlat=0.36*(b-lat0);dlng=0.36*(c-lng0);for(i=1;11>i;i++)a+=YpqS[i].S*Math.pow(dlat,YpqS[i].p)*Math.pow(dlng,YpqS[i].q);
//     return Y0+a
// }
// function RD2lat(b,c){
//     var a=0;dX=1E-5*(b-X0);dY=1E-5*(c-Y0);
//     for(i=1;12>i;i++){
//         a+=latpqK[i].K*Math.pow(dX,latpqK[i].p)*Math.pow(dY,latpqK[i].q);
//     }
//     return lat0+a/3600
// }
// function RD2lng(b,c){
//     var a=0;dX=1E-5*(b-X0);dY=1E-5*(c-Y0);
//     for(i=1;13>i;i++){
//         a+=lngpqL[i].K*Math.pow(dX,lngpqL[i].p)*Math.pow(dY,lngpqL[i].q);
//     }
//     return lng0+a/3600
// };
//
// function convertD2D(a){
//     negativeinput(a)
//         ?(tmpresult=a.substring(1),tmpresult=-1*parseFloat(tmpresult))
//         :positiveinput(a)
//             ?(tmpresult=a.substring(1),tmpresult=parseFloat(tmpresult))
//         :tmpresult=parseFloat(a);
//     return tmpresult
// }

function createDataSet(dataSet, id){
    const type = dataSet.geometry.type;

    function createFinalCord(cords, i){
        let cord = cords[i];

        // Transform if needed
        if(cord > 1000){
            cord = i === 0
                ? -RD2lat(cords[0], cords[1])
                : RD2lng(cords[0], cords[1]);
        }else{
            cord = cord[1 - i];
        }

        // Center it
        cord = cord - (i === 0 ? -gpsCenterNetherlands[0] : gpsCenterNetherlands[1]);

        // Scale it
        cord = cord * 500;

        return cord;
    }

    // Make point
    // if(type === 'Point'){
    //     return {
    //         type: 'Polygon',
    //         id: id, // TODO: maybe generate some short hash?
    //         shapes: [{
    //             points: [[-10, -10], [-10, 10], [10, 10], [10, -10]].map(offset => {
    //                 const cord = [
    //                     dataSet.geometry.coordinates[0] + offset[0],
    //                     dataSet.geometry.coordinates[1] + offset[1],
    //                 ];
    //                 return [
    //                     roundNumber(createFinalCord(cord, 0), 2),
    //                     roundNumber(createFinalCord(cord, 1), 2),
    //                 ];
    //             }),
    //             holes: [],
    //         }],
    //         properties: dataSet.properties,
    //     };
    // }

    // Only a few types for now
    if(type !== 'Polygon' && type !== 'MultiPolygon') return false;

    // TODO: how to do these
    const xOffset = avg && avg[0] > 1000 ? -142600 : 0;
    const yOffset = avg && avg[1] > 1000 ? -452000 : 0;
    const factor = avg && avg[0] > 1000 ? 0.004 : 100;

    function createShape(cordSet){
        const isMulti = type === 'MultiPolygon';

        // TODO: consider how much rounding the cords creates faulty data
        function createCord(cord){
            return [
                roundNumber((cord[0] + xOffset) * factor, 2),
                // roundNumber(createFinalCord(cord, 0), 2),
                roundNumber((cord[1] + yOffset) * factor, 2),
                // roundNumber(createFinalCord(cord, 1), 2),
            ];
        }

        return {
            // Depending on the type, get the main shape points
            // TODO: half of the points are removed here temporary till there is shape simplification
            points: (isMulti ? cordSet[0] : cordSet).map(createCord), //.map((item, i) => i % 2 === 0 ? item : false).filter(Boolean),

            // Depending on the type, add the shape holes
            holes: isMulti ? cordSet.slice(1).map((cordSet) =>
                cordSet.map(createCord)
            ) : [],
        }
    }

    // let height = Math.round(dataSet.properties.AANT_INW / 10000);
    // if(height < 1) height = 1;

    // TODO: also link to a property
    // const colorPart = 0.2 + (0.6 / (Math.random() * 10));
    // const color = dataSet.properties.AANT_MAN < dataSet.properties.AANT_VROUW ? '#55FF55' : '#ff9459';

    return {
        type: type,
        id: id, // TODO: maybe generate some short hash?
        shapes: dataSet.geometry.coordinates.map(createShape),
        properties: dataSet.properties,
        // height: 1,// height,
        // color: height === 1 ? '#FF0000' : color,
        // color: height === 1 ? '#FF0000' : `(0, ${0.8 - colorPart}, ${colorPart})`,
    }
}

function simplifyAndClean(geoJson, simplifyTolerance){
    if(!simplifyTolerance) return geoJson;

    return cleanCoords(simplify(geoJson, {
        tolerance: simplifyTolerance,
        highQuality: false,
        mutate: true,
    }), {
        mutate: true,
    });
}

function truncateAndRound(geoJson, precision){
    return truncate(geoJson, {
        precision: precision,
        coordinates: 2,
        mutate: true,
    });
}

function addId(feature, id){
    feature.id = id;

    return feature;
}

function convertCoordsMutate(feature, from, to){
    coordEach(feature, (coord) => {
        const newCoords = project(from, to, coord);

        coord[0] = newCoords[0];
        coord[1] = newCoords[1];
    });
}

function translateCoords(feature, xOffset, yOffset, scale = false){
    // TODO: probably use @turf/transform-scale and @turf/transform-translate here?

    function updateCord(cord){
        cord[0] = (cord[0] + xOffset) * scale;
        cord[1] = (cord[1] + yOffset) * scale;
    }

    if(feature.type !== 'Feature'){
        console.warn(`translateCoords did not receive a feature, got type: ${feature.type}`);
        return feature;
    }

    const coordinates = feature.geometry.coordinates;
    const type = feature.geometry.type;

    switch(type){
        case 'Point':
            updateCord(coordinates);
            break;
        case 'LineString':
            coordinates.forEach(cord => updateCord(cord));
            break;
        case 'Polygon':
            coordinates.forEach(set => {
                // A set is an array with the first element an array of cords for the outer ring
                // The rest of the optional elements are arrays of cords for the holes
                set.forEach(cord => updateCord(cord));
            });
            break;
        case 'MultiPolygon':
            coordinates.forEach(polygon => {
                polygon.forEach(set => {
                    set.forEach(cord => updateCord(cord));
                });
            });
            break;
        default:
            console.warn(`translateCoords geometry type not supported, got type: ${type}`);
            break;
    }

    return feature;
}

function collectStatsFromFinalData(featureList){
    const stats = {
        objects: featureList.length,
        shapes: 0,
        shapePoints: 0,
        shapeHoles: 0,
        shapeHolePoints: 0,
        totalPoints: 0,
        types: {},
    };

    featureList.forEach((feature) => {
        const coordinates = feature.geometry.coordinates;
        const type = feature.geometry.type;

        stats.types[type] = stats.types[type] ? stats.types[type] + 1 : 1;

        switch(type){
            case 'Point':
                stats.shapes += 1;
                stats.shapePoints += 1;
                break;
            case 'LineString':
                stats.shapes += 1;
                stats.shapePoints += coordinates.length;
                break;
            case 'Polygon':
                stats.shapes += 1;
                coordinates.forEach((set, i) => {
                    // Outer ring
                    if(i === 0){
                        stats.shapePoints += set.length;
                    }

                    // The holes
                    else {
                        stats.shapeHoles += 1;
                        stats.shapeHolePoints += set.length;
                    }
                });
                break;
            case 'MultiPolygon':
                coordinates.forEach(polygon => {
                    stats.shapes += 1;
                    polygon.forEach((set, i) => {
                        // Outer ring
                        if(i === 0){
                            stats.shapePoints += set.length;
                        }

                        // The holes
                        else {
                            stats.shapeHoles += 1;
                            stats.shapeHolePoints += set.length;
                        }
                    });
                });
                break;
        }
    });

    stats.totalPoints = stats.shapePoints + stats.shapeHolePoints;

    return stats;
}

function getFileContent(filePath, cb){
    // Handle input files which are already json
    if(path.extname(filePath) === '.json'){
        return cb(JSON.parse(fs.readFileSync(filePath)));
    }

    // Handle geojson (same as above I think??)
    if(path.extname(filePath) === '.geojson'){
        return cb(JSON.parse(fs.readFileSync(filePath)));
    }

    const results = [];

    openShape(filePath)
        .then(source => source
            .read()
            .then(function read(result) {
                if(result.done){
                    cb(results);
                    return true;
                }

                results.push(result.value)

                return source.read().then(read);
            })
        )
        .catch(error => console.error(error.stack));
}

function run(workerData, done){
    const file = workerData.file;
    const simplifyTolerance = workerData.simplifyTolerance;
    const cordSystem = workerData.cordSystem;
    const cordSystemType = workerData.cordSystemType;
    const idPrefix = workerData.idPrefix || '';

    if(!file){
        throw new Error('workerData must contain key `file`');
    }

    getFileContent(file, (data) => {
        // if(simplifyTolerance){
        //     const options = {
        //         tolerance: simplifyTolerance,
        //         highQuality: false,
        //         mutate: true,
        //     };
        //
        //     data = data.map(set => simplify(set, options));
        // }
        //
        // avg = getAverage(data);

        // console.log('AVG', avg);
        // console.log(RD2lng(avg[0], avg[1]));
        // console.log(RD2lat(avg[0], avg[1]));

        // const finalData = data.map((set, i)c => createDataSet(set, idPrefix + i)).filter(Boolean);

        data.forEach((feature, i) => simplifyAndClean(feature, simplifyTolerance))
        data.forEach((feature, i) => addId(feature, idPrefix + i))

        // If cords are in WGS84, apply different processing
        if(cordSystemType === 'WGS84'){
            data.forEach((feature, i) => {
                const coordinates = feature.geometry.coordinates;
                const type = feature.geometry.type;

                if(type === 'Polygon') {
                    feature.properties.location = `${coordinates[0][0][0]};${coordinates[0][0][1]}`;
                } else if(type === 'MultiPolygon') {
                    feature.properties.location = `${coordinates[0][0][0][0]};${coordinates[0][0][0][1]}`;
                }

                // TODO: this also depends on the source type? geojson?
                convertCoordsMutate(feature, projections.WGS84, projections.RDNL)
            });

            data.forEach((feature, i) => {
                // Some nasty translations?
                // TODO: this makes the coords relative to one corner
                const coordinates = feature.geometry.coordinates;
                const type = feature.geometry.type;

                if(type === 'Polygon') {
                    const c = coordinates[0][0];
                    translateCoords(feature, -c[0], -c[1], cordSystem.scale);
                } else if(type === 'MultiPolygon') {
                    const c = coordinates[0][0][0];
                    translateCoords(feature, -c[0], -c[1], cordSystem.scale);
                } else {
                    // TODO: Why is this?
                    translateCoords(feature, -155000 + 115, -463000 - 635, cordSystem.scale)
                }
            });
        }

        // No processing!
        else if(cordSystemType === 'plain'){
            data.forEach((feature, i) => {
                const geo = feature.geometry[0];

                if(!geo) return;

                if(geo.type === 'Solid') {
                    const cord = geo.boundaries[0][0][0][0];
                    const cordWgs = project(projections.RDNL, projections.WGS84, [cord[0] + 155000, cord[1] + 463000]);
                    feature.location = `${cordWgs[0]};${cordWgs[1]}`;
                }
            });
        }

        // Assume default RD-NL old
        else {
            data.forEach((feature, i) =>
                translateCoords(feature, -cordSystem.centerX, -cordSystem.centerY, cordSystem.scale)
            );
        }

        if(cordSystemType !== 'plain' && cordSystemType !== 'WGS84'){
            data.forEach((feature, i) => truncateAndRound(feature, 1))
        }

        const finalData = data.filter(Boolean);

        done({
            data: finalData,
            dataStats: collectStatsFromFinalData(finalData),
        });
    });
}

export const runGetShapeFileAndProcess = (data) => {
    return new Promise((resolve, reject) => {
        run(data, resolve);
    });
};
