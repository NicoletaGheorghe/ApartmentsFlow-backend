const GoogleMapsClient = require('../utils/googleMapsClient');
const Apartment = require('../models/apartment.model');

const mapsClient = new GoogleMapsClient(process.env.GOOGLE_MAPS_API_KEY);

exports.getCommuteTime = async (req, res) => {
  try {
    const { apartmentId, destination, mode = 'driving' } = req.body;

    // Get apartment location
    const apartment = await Apartment.findById(apartmentId);
    if (!apartment) {
      return res.status(404).json({ error: 'Apartment not found' });
    }

    const origin = `${apartment.location.coordinates[1]},${apartment.location.coordinates[0]}`;

    // Get commute time
    const commuteInfo = await mapsClient.getCommuteTime(origin, destination, mode);

    res.json({
      success: true,
      data: commuteInfo,
    });
  } catch (error) {
    console.error('Error getting commute time:', error);
    res.status(500).json({
      error: 'Error getting commute time',
      details: error.message,
    });
  }
};

exports.getMultipleCommuteTimes = async (req, res) => {
  try {
    const { apartmentId, destinations, mode = 'driving' } = req.body;

    // Get apartment location
    const apartment = await Apartment.findById(apartmentId);
    if (!apartment) {
      return res.status(404).json({ error: 'Apartment not found' });
    }

    const origin = `${apartment.location.coordinates[1]},${apartment.location.coordinates[0]}`;

    // Get commute times for all destinations
    const commutePromises = destinations.map((destination) =>
      mapsClient.getCommuteTime(origin, destination, mode)
    );

    const commuteResults = await Promise.all(commutePromises);

    res.json({
      success: true,
      data: commuteResults,
    });
  } catch (error) {
    console.error('Error getting multiple commute times:', error);
    res.status(500).json({
      error: 'Error getting commute times',
      details: error.message,
    });
  }
};

exports.getPlaceDetails = async (req, res) => {
  try {
    const { placeId } = req.params;

    const placeDetails = await mapsClient.getPlaceDetails(placeId);

    res.json({
      success: true,
      data: placeDetails,
    });
  } catch (error) {
    console.error('Error getting place details:', error);
    res.status(500).json({
      error: 'Error getting place details',
      details: error.message,
    });
  }
};
