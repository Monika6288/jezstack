
import { getData, saveData } from "./storage.js";

const HISTORY_KEY = "weatherSearchHistory";

// Add searched city to history
export function addToHistory(city) {

    let history = getHistory();

    // Avoid duplicate entries
    history = history.filter(
        item => item.id !== city.id
    );

    // Add latest search at the beginning
    history.unshift(city);

    // Keep only latest 10 searches
    history = history.slice(0, 10);

    saveData(HISTORY_KEY, history);

}

// Get search history
export function getHistory() {

    return getData(HISTORY_KEY, []);

}

// Clear all history
export function clearHistory() {

    saveData(HISTORY_KEY, []);

}
