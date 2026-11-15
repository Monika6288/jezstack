
import { fetchWeatherAPI } from "./api.js";

export async function getCurrentWeather(latitude, longitude) {

    const data = await fetchWeatherAPI(latitude, longitude);

    return data;
}
