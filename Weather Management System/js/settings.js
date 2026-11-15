
import { getData, saveData } from "./storage.js";

const SETTINGS_KEY = "weatherSettings";

export function getSettings() {

    return getData(SETTINGS_KEY, {
        temperatureUnit: "celsius"
    });

}

export function updateTemperatureUnit(unit) {

    const settings = getSettings();

    settings.temperatureUnit = unit;

    saveData(SETTINGS_KEY, settings);

}

export function convertTemperature(celsius) {

    const settings = getSettings();

    if (settings.temperatureUnit === "fahrenheit") {
        return (celsius * 9 / 5) + 32;
    }

    return celsius;

}
