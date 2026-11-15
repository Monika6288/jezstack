
import { getData, saveData } from "./storage.js";

const FAVORITES_KEY = "weatherFavorites";

// Get all favourite cities
export function getFavorites() {

    return getData(FAVORITES_KEY, []);

}

// Add a city
export function addFavorite(city) {

    const favorites = getFavorites();

    const exists = favorites.some(
        item => item.id === city.id
    );

    if (exists) {
        return false;
    }

    favorites.push(city);

    saveData(FAVORITES_KEY, favorites);

    return true;

}

// Remove a city
export function removeFavorite(cityId) {

    const favorites = getFavorites();

    const updatedFavorites = favorites.filter(
        city => city.id !== cityId
    );

    saveData(FAVORITES_KEY, updatedFavorites);

    return updatedFavorites;

}
