
const BASE_URL = "https://api.open-meteo.com/v1/forecast";

const GEOCODING_URL =
    "https://geocoding-api.open-meteo.com/v1/search";

export async function fetchJSON(url) {
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error("Unable to fetch data from API.");
    }

    return await response.json();
}

export async function fetchWeatherAPI(latitude, longitude) {
    const params = new URLSearchParams({
        latitude,
        longitude,
        current: [
            "temperature_2m",
            "relative_humidity_2m",
            "apparent_temperature",
            "precipitation",
            "weather_code",
            "wind_speed_10m"
        ].join(","),
        hourly: "precipitation_probability",
        daily: [
            "weather_code",
            "temperature_2m_max",
            "temperature_2m_min"
        ].join(","),
        timezone: "auto",
        forecast_days: "5"
    });

    return fetchJSON(`${BASE_URL}?${params}`);
}

export async function fetchGeocodingAPI(city) {
    const params = new URLSearchParams({
        name: city,
        count: "5",
        language: "en",
        format: "json"
    });

    return fetchJSON(`${GEOCODING_URL}?${params}`);
}
