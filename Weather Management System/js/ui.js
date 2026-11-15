import { getWeatherInfo, formatDate } from "./utils.js";
import { convertTemperature, getSettings } from "./settings.js";
import { getFavorites } from "./favourites.js";
import { getHistory } from "./history.js";

function getTemperatureSymbol() {
    return getSettings().temperatureUnit === "fahrenheit" ? "F" : "C";
}

function formatTemp(celsius) {
    return `${Math.round(convertTemperature(celsius))}°${getTemperatureSymbol()}`;
}

// ======================================
// DASHBOARD
// ======================================
export function displayWeather(data, city, country) {

    const current = data.current;
    const weatherInfo = getWeatherInfo(current.weather_code);

    const currentHour = current.time.slice(0, 13);

    const hourIndex = data.hourly.time.findIndex(time =>
        time.startsWith(currentHour)
    );

    const rainProbability = hourIndex >= 0
        ? data.hourly.precipitation_probability[hourIndex]
        : null;

    document.getElementById("cityName").textContent = `${city}, ${country}`;
    document.getElementById("temperature").textContent = formatTemp(current.temperature_2m);
    document.getElementById("weatherDescription").textContent = weatherInfo[0];

    const icon = document.getElementById("weatherIcon");
    if (icon) {
        icon.textContent = weatherInfo[1];
    }

    document.getElementById("humidity").textContent = `${current.relative_humidity_2m}%`;
    document.getElementById("windSpeed").textContent = `${current.wind_speed_10m} km/h`;
    document.getElementById("feelsLike").textContent = formatTemp(current.apparent_temperature);
    document.getElementById("rainChance").textContent =
        rainProbability === null ? "N/A" : `${rainProbability}%`;
}

// ======================================
// FORECAST
// ======================================
export function displayForecast(daily) {

    const container = document.getElementById("forecastContent");

    container.innerHTML = "";

    daily.time.forEach((date, index) => {

        const weatherInfo = getWeatherInfo(daily.weather_code[index]);

        const card = document.createElement("div");
        card.className = "forecast-card";

        card.innerHTML = `
            <h3>${formatDate(date)}</h3>
            <span class="forecast-icon">${weatherInfo[1]}</span>
            <p>${weatherInfo[0]}</p>
            <h3>${formatTemp(daily.temperature_2m_max[index])}</h3>
            <p>Min: ${formatTemp(daily.temperature_2m_min[index])}</p>
        `;

        container.appendChild(card);
    });
}

// ======================================
// FAVOURITES
// ======================================
export function displayFavorites(onViewCity) {

    const container = document.getElementById("favouritesContent");
    const favorites = getFavorites();

    container.innerHTML = "";

    if (favorites.length === 0) {
        container.textContent = "No favourite cities added yet.";
        return;
    }

    favorites.forEach(city => {

        const card = document.createElement("div");
        card.className = "favorite-card";

        const cityName = document.createElement("h3");
        cityName.textContent = city.name;

        const country = document.createElement("p");
        country.textContent = city.country;

        const viewButton = document.createElement("button");
        viewButton.textContent = "View Weather";
        viewButton.addEventListener("click", () => onViewCity(city));

        const removeButton = document.createElement("button");
        removeButton.textContent = "Remove";
        removeButton.className = "remove-btn";
        removeButton.addEventListener("click", () => {
            card.dispatchEvent(
                new CustomEvent("removefavorite", {
                    bubbles: true,
                    detail: city.id
                })
            );
        });

        card.append(cityName, country, viewButton, removeButton);
        container.appendChild(card);
    });
}

// ======================================
// SEARCH HISTORY
// ======================================
export function displayHistory(onViewCity) {

    const container = document.getElementById("historyContent");
    const history = getHistory();

    container.innerHTML = "";

    if (history.length === 0) {
        container.textContent = "No search history available.";
        return;
    }

    history.forEach(city => {

        const card = document.createElement("div");
        card.className = "history-card";

        const name = document.createElement("h3");
        name.textContent = city.name;

        const country = document.createElement("p");
        country.textContent = city.country;

        const viewButton = document.createElement("button");
        viewButton.textContent = "View Weather";
        viewButton.addEventListener("click", () => onViewCity(city));

        card.append(name, country, viewButton);
        container.appendChild(card);
    });
}

// ======================================
// COMPARE CITIES
// ======================================
export function displayComparison(result) {

    const container = document.getElementById("compareContent");

    container.innerHTML = "";

    [result.cityOne, result.cityTwo].forEach(city => {

        const w = city.weather;
        const info = getWeatherInfo(w.weather_code);

        const card = document.createElement("div");
        card.className = "compare-card";

        const title = document.createElement("h3");
        title.textContent = city.name;

        const icon = document.createElement("span");
        icon.className = "forecast-icon";
        icon.textContent = info[1];

        const temp = document.createElement("h2");
        temp.textContent = formatTemp(w.temperature_2m);

        const desc = document.createElement("p");
        desc.textContent = info[0];

        const rows = document.createElement("ul");
        [
            `Feels like: ${formatTemp(w.apparent_temperature)}`,
            `Humidity: ${w.relative_humidity_2m}%`,
            `Wind: ${w.wind_speed_10m} km/h`
        ].forEach(text => {
            const li = document.createElement("li");
            li.textContent = text;
            rows.appendChild(li);
        });

        card.append(title, icon, temp, desc, rows);
        container.appendChild(card);
    });
}