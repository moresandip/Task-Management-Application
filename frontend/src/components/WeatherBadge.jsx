import { CloudSun, CloudRain, Sun, Cloud, Snowflake, Wind, Zap } from 'lucide-react';

/**
 * Maps an OpenWeatherMap icon code to a corresponding Lucide icon component.
 * OWM icon codes: https://openweathermap.org/weather-conditions
 */
function WeatherIcon({ iconCode, size = 14 }) {
  const iconMap = {
    '01d': Sun,
    '01n': Sun,
    '02d': CloudSun,
    '02n': CloudSun,
    '03d': Cloud,
    '03n': Cloud,
    '04d': Cloud,
    '04n': Cloud,
    '09d': CloudRain,
    '09n': CloudRain,
    '10d': CloudRain,
    '10n': CloudRain,
    '11d': Zap,
    '11n': Zap,
    '13d': Snowflake,
    '13n': Snowflake,
    '50d': Wind,
    '50n': Wind,
  };

  const Icon = iconMap[iconCode] || CloudSun;
  return <Icon size={size} />;
}

/**
 * WeatherBadge
 *
 * Displays a compact weather summary for a task's location.
 * Receives a `weather` object from the backend: { temp, description, icon, cityName }
 */
function WeatherBadge({ weather }) {
  if (!weather || weather.temp === undefined) return null;

  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-medium">
      <WeatherIcon iconCode={weather.icon} size={13} />
      <span>{weather.temp}°C</span>
      <span className="text-sky-500/70 capitalize hidden sm:inline">{weather.description}</span>
    </div>
  );
}

export default WeatherBadge;
