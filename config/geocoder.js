const NodeGeocoder = require('node-geocoder');

const options = {
  provider: process.env.GEOCODER_PROVIDER || 'openstreetmap',
};

const geocoder = NodeGeocoder(options);

module.exports = geocoder;
