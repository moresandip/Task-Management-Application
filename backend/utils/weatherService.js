const axios = require('axios');

/**
 * Fetches current weather data for a given city from the OpenWeatherMap API.
 *
 * @param {string} city - The city or place name (e.g. "Mumbai", "New York")
 * @returns {Promise<{temp: number, description: string, icon: string, cityName: string} | null>}
 *   Returns a weather object on success, or null if the city is not found or the API call fails.
 */
const getWeatherByCity = async (city) => {
  if (!city) return null;

  const apiKey = process.env.OPENWEATHER_API_KEY;

  if (!apiKey) {
    console.warn('⚠️  OPENWEATHER_API_KEY is not set — skipping weather fetch');
    return null;
  }

  try {
    const { data } = await axios.get(
      'https://api.openweathermap.org/data/2.5/weather',
      {
        params: {
          q: city,
          appid: apiKey,
          units: 'metric',  // Temperature in Celsius
        },
        timeout: 5000, // 5-second timeout to avoid blocking the request
      }
    );

    return {
      temp: Math.round(data.main.temp),
      description: data.weather[0]?.description || '',
      icon: data.weather[0]?.icon || '',
      cityName: data.name,
    };
  } catch (error) {
    // Log a friendly message but don't crash the request
    if (error.response?.status === 404) {
      console.warn(`⚠️  Weather: city "${city}" not found`);
    } else {
      console.error(`❌ Weather fetch failed for "${city}":`, error.message);
    }
    return null;
  }
};

module.exports = { getWeatherByCity };
