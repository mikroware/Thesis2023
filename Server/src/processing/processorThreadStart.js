// Register babel
require('@babel/register')({
    presets: ['@babel/preset-env'],
    plugins: [
        '@babel/plugin-proposal-class-properties',
        '@babel/plugin-proposal-private-methods',
    ],
});

// Polyfill some utilities
require('core-js/stable');
require('regenerator-runtime/runtime');

// Now we can require the actual application
require('./processorThread');
