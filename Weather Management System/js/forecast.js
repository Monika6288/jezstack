
import { fetchWeatherAPI } from "./api.js";

export async function getForecast(latitude, longitude) {

    const data = await fetchWeatherAPI(latitude, longitude);

    return data.daily;
}
