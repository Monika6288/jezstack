
import { fetchGeocodingAPI } from "./api.js";

export async function searchCity(city) {

    const data = await fetchGeocodingAPI(city);

    if (!data.results || data.results.length === 0) {
        throw new Error("City not found. Please try another city.");
    }

    return data.results[0];
}
