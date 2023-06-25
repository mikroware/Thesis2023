const proj4 = require('proj4');

// Add RD-NL aka EPSG:28992
proj4.defs(
    "EPSG:28992",
    "+proj=sterea +lat_0=52.15616055555555   +lon_0=5.38763888888889 +k=0.9999079 +x_0=155000 +y_0=463000  +ellps=bessel  +towgs84=565.040,49.910,465.840,-0.40939,0.35971,-1.86849,4.0772 +units=m +no_defs"
);
// One answer
// +towgs84=565.040,49.910,465.840,-0.40939,0.35971,-1.86849,4.0772

// From https://mygeodata.cloud/drive/crslist?dsid=0&search=28992&limit=50&offset=0
// +towgs84=565.4171,50.3319,465.5524,-0.398957,0.343988,-1.87740,4.0725

// Add RD-NEW aka EPSG:7415
// From: https://epsg.io/7415
proj4.defs(
    "EPSG:7415",
    "+proj=sterea +lat_0=52.15616055555555 +lon_0=5.38763888888889 +k=0.9999079 +x_0=155000 +y_0=463000 +ellps=bessel +towgs84=565.417,50.3319,465.552,-0.398957,0.343988,-1.8774,4.0725 +units=m +vunits=m +no_defs"
);

const projections = {
    RDNL: 'EPSG:28992',
    WGS84: 'EPSG:4326',
    RDNEW: 'EPSG:7415',
};

function project(from, to, coord){
    return proj4(from, to, coord);
}

function projectVector3(from, to, vector3){
    return [...proj4(from, to, [vector3[0], vector3[1]]), vector3[2]];
}

module.exports = {
    projections,
    project,
    projectVector3,
}
