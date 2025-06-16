const axios = require('axios');

class GoogleMapsClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://maps.googleapis.com/maps/api';
  }

  async getCommuteTime(origin, destination, mode = 'driving') {
    try {
      const response = await axios.get(`${this.baseUrl}/directions/json`, {
        params: {
          origin,
          destination,
          mode,
          key: this.apiKey,
        },
      });

      if (response.data.status !== 'OK') {
        throw new Error(`Google Maps API error: ${response.data.status}`);
      }

      const route = response.data.routes[0];
      const leg = route.legs[0];

      return {
        duration: leg.duration.text,
        distance: leg.distance.text,
        mode,
        route: route.overview_polyline.points,
      };
    } catch (error) {
      console.error('Error getting commute time:', error);
      throw error;
    }
  }

  async getGeocode(address) {
    try {
      const response = await axios.get(`${this.baseUrl}/geocode/json`, {
        params: {
          address,
          key: this.apiKey,
        },
      });

      if (response.data.status !== 'OK') {
        throw new Error(`Google Maps API error: ${response.data.status}`);
      }

      const result = response.data.results[0];
      return {
        formattedAddress: result.formatted_address,
        location: result.geometry.location,
        placeId: result.place_id,
      };
    } catch (error) {
      console.error('Error geocoding address:', error);
      throw error;
    }
  }

  async getPlaceDetails(placeId) {
    try {
      const response = await axios.get(`${this.baseUrl}/place/details/json`, {
        params: {
          place_id: placeId,
          fields: 'name,formatted_address,geometry,rating,types',
          key: this.apiKey,
        },
      });

      if (response.data.status !== 'OK') {
        throw new Error(`Google Maps API error: ${response.data.status}`);
      }

      return response.data.result;
    } catch (error) {
      console.error('Error getting place details:', error);
      throw error;
    }
  }
}

module.exports = GoogleMapsClient; 