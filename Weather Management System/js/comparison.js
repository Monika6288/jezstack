
import { getCurrentWeather } from "./weather.js";

export async function compareCities(cityOne, cityTwo) {

    const [weatherOne, weatherTwo] = await Promise.all([

        getCurrentWeather(
            cityOne.latitude,
            cityOne.longitude
        ),

        getCurrentWeather(
            cityTwo.latitude,
            cityTwo.longitude
        )

    ]);

    return {
        cityOne: {
            name: cityOne.name,
            weather: weatherOne.current
        },

        cityTwo: {
            name: cityTwo.name,
            weather: weatherTwo.current
        }
    };

}
