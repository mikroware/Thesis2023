import ServerApplication from './util/ServerApplication'

const app = new ServerApplication();

// Consider splitting shapes and data
// .. shape files are smaller in size for example
// .. create a new simplified shape file and serve that one
// .. somehow need an id to link shape and data

// Read configuration file
// - Load data sources
// - Pre-process the data (mostly the shape files)
// - Set visualization properties (color and height)

// Manage client socket connections
// - Accept new connections
// - Send processing statuses
// - Send data on request
// - Send data updates (not on request)

// process.on('exit', () => {
//     console.log("======= NORMAL EXIT SERVER APPLICATION");
//     process.exit();
// });

// TODO: not sure if any of these help with my current port in use error after nodemon restart or server close..
process.once('SIGUSR2', () => {
    console.log("======= SIGUSR EXITING SERVER APPLICATION =======");
    process.exit();
});

process.once('SIGHUP', () => {
    console.log("======= SIGHUP EXITING SERVER APPLICATION =======");
    process.exit();
});

process.once('SIGTERM', () => {
    console.log("======= SIGTERM EXITING SERVER APPLICATION =======");
    process.exit();
});

process.on('SIGINT', () => {
    console.log("======= EXITING SERVER APPLICATION =======");

    app.closeServer(() => {
        console.log('Closed HTTP server.');
        process.exit(0);
    })
});
