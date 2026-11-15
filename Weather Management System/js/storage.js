
export function saveData(key, value) {

    localStorage.setItem(key, JSON.stringify(value));

}

export function getData(key, defaultValue = []) {

    const data = localStorage.getItem(key);

    if (data === null) {
        return defaultValue;
    }

    try {
        return JSON.parse(data);
    } catch (error) {
        console.error("Unable to read saved data:", error);
        return defaultValue;
    }

}

export function removeData(key) {

    localStorage.removeItem(key);

}
