import { searchCity } from "./geocoding.js";
import { getCurrentWeather } from "./weather.js";
import { compareCities } from "./comparison.js";
import { addToHistory, clearHistory, getHistory } from "./history.js";
import { addFavorite, removeFavorite } from "./favourites.js";
import {
    displayWeather,
    displayForecast,
    displayFavorites,
    displayHistory,
    displayComparison
} from "./ui.js";
import { getCurrentDate } from "./utils.js";

// ======================================
// DATE
// ======================================
document.getElementById("currentDate").textContent = getCurrentDate();


// ======================================
// NAVIGATION
// ======================================
const navLinks = document.querySelectorAll(".navbar a");
const sections = document.querySelectorAll(".page-section");

function showSection(name) {

    navLinks.forEach(nav =>
        nav.classList.toggle("active", nav.dataset.section === name)
    );

    sections.forEach(section =>
        section.classList.toggle("active-section", section.id === name)
    );

    // Refresh lists whenever their page is opened
    if (name === "history") {
        loadSearchHistory();
    }

    if (name === "favourites") {
        displayFavorites(viewCity);
    }
}

navLinks.forEach(link => {
    link.addEventListener("click", event => {
        event.preventDefault();
        showSection(link.dataset.section);
    });
});


// ======================================
// WEATHER SEARCH
// ======================================
const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");

let currentLocation = null;

searchBtn.addEventListener("click", () => searchWeather());

cityInput.addEventListener("keydown", event => {
    if (event.key === "Enter") {
        searchWeather();
    }
});

// Load weather for a known location object
async function loadWeather(place, { record = true } = {}) {

    const weatherData = await getCurrentWeather(
        place.latitude,
        place.longitude
    );

    currentLocation = {
        id: place.id,
        name: place.name,
        country: place.country,
        latitude: place.latitude,
        longitude: place.longitude
    };

    displayWeather(weatherData, place.name, place.country);
    displayForecast(weatherData.daily);

    if (record) {
        addToHistory(currentLocation);
        loadSearchHistory();
    }
}

// Search by typed city name
async function searchWeather() {

    const city = cityInput.value.trim();

    if (!city) {
        alert("Please enter a city name.");
        return;
    }

    searchBtn.disabled = true;
    searchBtn.textContent = "Searching...";

    try {
        const place = await searchCity(city);
        await loadWeather(place);
    } catch (error) {
        alert(error.message);
        console.error(error);
    } finally {
        searchBtn.disabled = false;
        searchBtn.textContent = "Search";
    }
}

// View a city from Favourites / History (uses saved coordinates)
async function viewCity(city) {

    cityInput.value = city.name;

    showSection("dashboard");

    try {
        await loadWeather(city);
    } catch (error) {
        alert(error.message);
        console.error(error);
    }
}


// ======================================
// FAVOURITES
// ======================================
document.getElementById("addFavoriteBtn").addEventListener("click", () => {

    if (!currentLocation) {
        alert("Search for a city first.");
        return;
    }

    const added = addFavorite(currentLocation);

    alert(added
        ? "City added to favourites!"
        : "This city is already in your favourites.");

    displayFavorites(viewCity);
});

document.getElementById("favouritesContent")
    .addEventListener("removefavorite", event => {
        removeFavorite(event.detail);
        displayFavorites(viewCity);
    });


// ======================================
// SEARCH HISTORY
// ======================================
function loadSearchHistory() {
    displayHistory(viewCity);
}

document.getElementById("clearHistoryBtn").addEventListener("click", () => {

    if (confirm("Are you sure you want to clear search history?")) {
        clearHistory();
        loadSearchHistory();
        alert("Search history cleared successfully!");
    }
});


// ======================================
// COMPARE CITIES
// ======================================
const compareBtn = document.getElementById("compareBtn");

compareBtn.addEventListener("click", async () => {

    const nameOne = document.getElementById("compareCityOne").value.trim();
    const nameTwo = document.getElementById("compareCityTwo").value.trim();

    if (!nameOne || !nameTwo) {
        alert("Please enter both city names.");
        return;
    }

    compareBtn.disabled = true;
    compareBtn.textContent = "Comparing...";

    try {
        const [placeOne, placeTwo] = await Promise.all([
            searchCity(nameOne),
            searchCity(nameTwo)
        ]);

        displayComparison(await compareCities(placeOne, placeTwo));
    } catch (error) {
        alert(error.message);
        console.error(error);
    } finally {
        compareBtn.disabled = false;
        compareBtn.textContent = "Compare";
    }
});


// ======================================
// START UP
// ======================================
displayFavorites(viewCity);
loadSearchHistory();

// Show the last searched city, or Erode by default
(async () => {
    try {
        const last = getHistory()[0];
        const place = last || await searchCity("Erode");
        cityInput.value = place.name;
        await loadWeather(place, { record: false });
    } catch (error) {
        console.error("Initial load failed:", error);
    }
})();