const currentLocationButton = document.getElementById('current-location-button');
const toggleForecastButton = document.getElementById('toggle-forecast');
const currentDayDataDiv = document.getElementById('current-day-data');
const sevenDayForecastDiv = document.getElementById('seven-day-data');
const sevenDayForecastSection = document.getElementById('seven-day-forecast');
const currentForecastSection = document.getElementById('current-forecast');
const body = document.body;
const actionButtons = document.querySelectorAll('.action-button');
const currentConditionsBox = document.getElementById('current-conditions-box');
const genieAdviceDiv = document.getElementById('genie-advice');
const searchButton = document.getElementById('search-button');
const citySearchInput = document.getElementById('city-search');
const citySuggestionsDiv = document.getElementById('city-suggestions');

// **IMPORTANT:** Replace with your actual OpenCage Geocoder API key
const OPENCAGE_API_KEY = '180a538889bf4c41b40f9be07d04bbf5';

const apiUrlBase = 'https://api.open-meteo.com/v1/forecast';
const currentConditionsApiUrlBase = 'https://api.open-meteo.com/v1/forecast';
const defaultLatitude = 32.4335; // Venus, TX latitude as default
const defaultLongitude = -97.1025; // Venus, TX longitude as default

let currentWeatherData = null;

const genieAdviceResponses = [
    // General good weather
    "Looks like a great day to be outside!",
    "Enjoy the pleasant weather!",
    "Perfect conditions for some fun.",
    "Make the most of this beautiful day.",
    "Weather's on your side today!",
    "Step outside and soak it up!",
    "What a lovely day it is.",
    "The weather is simply delightful.",
    "Embrace the day's beauty.",
    "A perfect day for outdoor adventures.",

    // Hot weather
    "Stay hydrated and find some shade!",
    "It's a scorcher, take it easy out there.",
    "Cool drinks are your best friend today.",
    "Might be a good day for indoor activities.",
    "Keep cool and carry on!",
    "Sunscreen is a must!",
    "Time for a dip in the pool!",
    "Find a way to beat the heat.",
    "The sun is strong today, be careful.",
    "Hydration is key in this heat.",

    // Cold weather
    "Bundle up, it's chilly out there!",
    "Brrr, stay warm and cozy.",
    "Perfect weather for a warm drink.",
    "Time to light a fire!",
    "Keep those layers on!",
    "Don't forget your hat and gloves.",
    "Embrace the cold with warm gear.",
    "A good day to stay indoors and relax.",
    "The cold is here, be prepared.",
    "Wrap up tight against the chill.",

    // Windy weather
    "Hold onto your hat, it's breezy!",
    "Careful with that kite!",
    "A bit blustery today, be mindful.",
    "The wind is picking up!",
    "Consider indoor activities if you're sensitive to wind.",
    "It's a windy one!",
    "Brace yourself for the gusts.",
    "The wind might make things interesting today.",
    "Keep an eye on things that might blow away.",
    "A good day for flying a kite (if you're careful!).",

    // Rainy weather
    "Don't forget your umbrella!",
    "Looks like it's going to be a wet one.",
    "Perfect weather for staying in with a good book.",
    "Time to cozy up indoors.",
    "The rain is here, be prepared.",
    "Grab your rain boots!",
    "Embrace the cozy sound of rain.",
    "A good day for indoor hobbies.",
    "Stay dry out there!",
    "The rain is falling, take it easy if you're out.",
];

// Helper function for debouncing
function debounce(func, delay) {
    let timeout;
    return function (...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), delay);
    };
}

async function fetchCitySuggestions(query) {
    const url = `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(query)}&key=${OPENCAGE_API_KEY}&limit=5`; // Limit to a few suggestions
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`OpenCage API error! Status: ${response.status}`);
        }
        const data = await response.json();
        return data.results;
    } catch (error) {
        console.error('Error fetching city suggestions:', error);
        return [];
    }
}

function displayCitySuggestions(suggestions) {
    citySuggestionsDiv.innerHTML = '';
    if (suggestions.length === 0) {
        citySuggestionsDiv.style.display = 'none';
        return;
    }

    suggestions.forEach(suggestion => {
        const suggestionDiv = document.createElement('div');
        suggestionDiv.textContent = suggestion.formatted;
        suggestionDiv.addEventListener('click', () => {
            citySearchInput.value = suggestion.formatted;
            citySuggestionsDiv.style.display = 'none';
            getWeatherData(suggestion.geometry.lat, suggestion.geometry.lng);
            getCurrentWeather(suggestion.geometry.lat, suggestion.geometry.lng);
        });
        citySuggestionsDiv.appendChild(suggestionDiv);
    });
    citySuggestionsDiv.style.display = 'block';
}

// Event listener for input in the city search box with debounce
citySearchInput.addEventListener('input', debounce(async function () {
    const query = citySearchInput.value.trim();
    if (query.length > 2) { // Start searching after a few characters
        const suggestions = await fetchCitySuggestions(query);
        displayCitySuggestions(suggestions);
    } else {
        citySuggestionsDiv.style.display = 'none';
    }
}, 300)); // 300ms delay

// Hide suggestions when the input loses focus
citySearchInput.addEventListener('blur', () => {
    // Use a slight delay to allow time for a suggestion to be clicked
    setTimeout(() => {
        citySuggestionsDiv.style.display = 'none';
    }, 100);
});

// Prevent the form from submitting and refreshing the page (if you have one)
const searchLocationContainer = document.querySelector('.search-location-container');
searchLocationContainer.addEventListener('submit', (event) => {
    event.preventDefault();
});

// Event listener for the search button (fallback if no suggestion clicked)
searchButton.addEventListener('click', async () => {
    const city = citySearchInput.value.trim();
    if (city) {
        const suggestions = await fetchCitySuggestions(city);
        if (suggestions.length > 0) {
            // Assuming the first result is the most relevant
            getWeatherData(suggestions[0].geometry.lat, suggestions[0].geometry.lng);
            getCurrentWeather(suggestions[0].geometry.lat, suggestions[0].geometry.lng);
        } else {
            alert(`City "${city}" not found.`);
        }
    } else {
        alert('Please enter a city name.');
    }
});

function displayGenieAdvice(currentWeather) {
    const temperature = currentWeather.temperature;
    const windSpeed = currentWeather.windspeed;
    const weatherCode = currentWeather.weathercode;

    let applicableAdvice = [];
    let addedSpecificAdvice = false; // Flag to track if specific advice was added

    // Add advice based on specific conditions
    if (temperature > 80) {
        applicableAdvice.push(...genieAdviceResponses.filter(advice => advice.includes("hydrated") || advice.includes("scorcher") || advice.includes("heat") || advice.includes("sun")));
        addedSpecificAdvice = true;
    }

    if (temperature < 50) {
        applicableAdvice.push(...genieAdviceResponses.filter(advice => advice.includes("bundle") || advice.includes("chilly") || advice.includes("cold") || advice.includes("warm")));
        addedSpecificAdvice = true;
    }

    if (windSpeed > 20) {
        applicableAdvice.push(...genieAdviceResponses.filter(advice => advice.includes("wind") || advice.includes("breezy") || advice.includes("blustery") || advice.includes("gusts")));
        addedSpecificAdvice = true;
    }

    if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(weatherCode)) {
        applicableAdvice.push(...genieAdviceResponses.filter(advice => advice.includes("umbrella") || advice.includes("wet") || advice.includes("rain")));
        addedSpecificAdvice = true;
    }

    if ([71, 73, 75, 77, 85, 86].includes(weatherCode)) {
        applicableAdvice.push(...genieAdviceResponses.filter(advice => advice.includes("snow") || advice.includes("cold") || advice.includes("warm")));
        addedSpecificAdvice = true;
    }

    if ([95, 96, 99].includes(weatherCode)) {
        applicableAdvice.push("Stay safe indoors, there's a thunderstorm!");
        addedSpecificAdvice = true;
    }

    // Add general "good weather" advice only if no specific advice was added
    if (!addedSpecificAdvice) {
        applicableAdvice.push(...genieAdviceResponses.filter(advice =>
            advice.includes("great day") || advice.includes("pleasant") || advice.includes("perfect") || advice.includes("beautiful")
        ));
    }

    // Select a random advice message
    let adviceToDisplay = "Enjoy your day!"; // Default message
    if (applicableAdvice.length > 0) {
        const randomIndex = Math.floor(Math.random() * applicableAdvice.length);
        adviceToDisplay = applicableAdvice[randomIndex];
    }

    genieAdviceDiv.textContent = adviceToDisplay;
}

function getCurrentWeather(latitude, longitude) {
    const params = new URLSearchParams({
        latitude: latitude,
        longitude: longitude,
        current_weather: true,
        temperature_unit: 'fahrenheit',
        wind_speed_unit: 'mph'
    });

    const apiUrl = `${currentConditionsApiUrlBase}?${params.toString()}`;

    fetch(apiUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            displayCurrentConditions(data.current_weather);
            // Call the genie advice function after fetching current weather
            displayGenieAdvice(data.current_weather);
        })
        .catch(error => {
            console.error('Error fetching current weather data:', error);
            currentConditionsBox.innerHTML = '<p>Failed to fetch current weather.</p>';
            genieAdviceDiv.textContent = "";
        });
}

function getWeatherCondition(code) {
    switch (code) {
        case 0: return "Clear sky";
        case 1: return "Mainly clear";
        case 2: return "Partly cloudy";
        case 3: return "Overcast";
        case 45: case 48: return "Fog";
        case 51: case 53: case 55: return "Drizzle";
        case 56: case 57: return "Freezing Drizzle";
        case 61: case 63: case 65: return "Rain";
        case 66: case 67: return "Freezing Rain";
        case 71: case 73: case 75: return "Snow fall";
        case 77: return "Snow grains";
        case 80: case 81: case 82: return "Rain showers";
        case 85: case 86: return "Snow showers";
        case 95: return "Thunderstorm";
        case 96: case 99: return "Thunderstorm with hail";
        default: return "Unknown";
    }
}

function displayCurrentConditions(currentWeather) {
    const temperature = currentWeather.temperature;
    const windSpeed = currentWeather.windspeed;
    const weatherCode = currentWeather.weathercode;
    const condition = getWeatherCondition(weatherCode);

    currentConditionsBox.innerHTML = `
        <p><strong>Current Conditions:</strong></p>
        <p>Temperature: ${temperature}°F</p>
        <p>Weather: ${condition}</p>
        <p>Wind Speed: ${windSpeed} mph</p>
    `;
}

function getWeatherData(latitude, longitude) {
    const params = new URLSearchParams({
        latitude: latitude,
        longitude: longitude,
        daily: 'weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_sum,wind_speed_10m_max',
        temperature_unit: 'fahrenheit',
        wind_speed_unit: 'mph',
        precipitation_unit: 'inch',
        timezone: 'America/Chicago'
    });

    const apiUrl = `${apiUrlBase}?${params.toString()}`;

    fetch(apiUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            currentWeatherData = data;
            displayCurrentDayForecast(data.daily); // Display today's forecast
            displaySevenDayForecast(data.daily); // Display the 7-day forecast
            // **REMOVED THIS LINE:** getCurrentWeather(latitude, longitude); // Fetch current weather after daily forecast
        })
        .catch(error => {
            console.error('Error fetching weather data:', error);
            currentDayDataDiv.innerHTML = '<p>Failed to fetch weather data.</p>';
            sevenDayForecastDiv.innerHTML = '';
            currentConditionsBox.innerHTML = '<p>Failed to fetch weather data.</p>';
            genieAdviceDiv.textContent = "";
        });
}

function displayCurrentDayForecast(dailyData) {
    currentDayDataDiv.innerHTML = '';
    if (!dailyData || !dailyData.time || dailyData.time.length === 0) {
        currentDayDataDiv.innerHTML = '<p>No forecast data available.</p>';
        return;
    }

    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth(); // Month is 0-indexed
    const currentDate = today.getDate();

    const todayDataIndex = dailyData.time.findIndex(apiDateString => {
        const apiDate = new Date(apiDateString);
        return (
            apiDate.getFullYear() === currentYear &&
            apiDate.getMonth() === currentMonth &&
            apiDate.getDate() === currentDate
        );
    });

    if (todayDataIndex !== -1) {
        const date = new Date(dailyData.time[todayDataIndex]);
        const weatherCode = dailyData.weather_code[todayDataIndex];
        const tempMax = dailyData.temperature_2m_max[todayDataIndex];
        const tempMin = dailyData.temperature_2m_min[todayDataIndex];
        const sunrise = dailyData.sunrise[todayDataIndex];
        const sunset = dailyData.sunset[todayDataIndex];
        const precipitationSum = dailyData.precipitation_sum[todayDataIndex];
        const windSpeedMax = dailyData.wind_speed_10m_max[todayDataIndex];

        const forecastHTML = `
            <p><strong>${date.toLocaleDateString()}</strong></p>
            <p>Weather: ${getWeatherCondition(weatherCode)}</p>
            <p>High: ${tempMax}°F</p>
            <p>Low: ${tempMin}°F</p>
            <p>Sunrise: ${new Date(sunrise).toLocaleTimeString()}</p>
            <p>Sunset: ${new Date(sunset).toLocaleTimeString()}</p>
            <p>Precipitation: ${precipitationSum} in</p>
            <p>Max Wind Speed: ${windSpeedMax} mph</p>
        `;
        currentDayDataDiv.innerHTML = forecastHTML;
    } else {
        currentDayDataDiv.innerHTML = '<p>Could not find today\'s forecast data.</p>';
    }
}

function displaySevenDayForecast(dailyData) {
    sevenDayForecastDiv.innerHTML = '';
    if (!dailyData || !dailyData.time) {
        sevenDayForecastDiv.innerHTML = '<p>No 7-day forecast data available.</p>';
        return;
    }

    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    const currentDate = today.getDate();

    const todayDataIndex = dailyData.time.findIndex(apiDateString => {
        const apiDate = new Date(apiDateString);
        return (
            apiDate.getFullYear() === currentYear &&
            apiDate.getMonth() === currentMonth &&
            apiDate.getDate() === currentDate
        );
    });

    if (todayDataIndex === -1) {
        sevenDayForecastDiv.innerHTML = '<p>Could not find today\'s forecast data in the 7-day data.</p>';
        return;
    }

    for (let i = todayDataIndex; i < dailyData.time.length; i++) {
        const date = new Date(dailyData.time[i]);
        const weatherCode = dailyData.weather_code[i];
        const tempMax = dailyData.temperature_2m_max[i];
        const tempMin = dailyData.temperature_2m_min[i];
        const sunrise = dailyData.sunrise[i];
        const sunset = dailyData.sunset[i];
        const precipitationSum = dailyData.precipitation_sum[i];
        const windSpeedMax = dailyData.wind_speed_10m_max[i];

        const dailyItem = document.createElement('div');
        dailyItem.classList.add('seven-day-item');
        dailyItem.innerHTML = `
            <p><strong>${date.toLocaleDateString()}</strong></p>
            <p>Weather: ${getWeatherCondition(weatherCode)}</p>
            <p>High: ${tempMax}°F</p>
            <p>Low: ${tempMin}°F</p>
            <p>Sunrise: ${new Date(sunrise).toLocaleTimeString()} </p>
            <p>Sunset: ${new Date(sunset).toLocaleTimeString()} </p>
            <p>Precipitation: ${precipitationSum} in</p>
            <p>Max Wind Speed: ${windSpeedMax} mph</p>
        `;
        sevenDayForecastDiv.appendChild(dailyItem);

        if (sevenDayForecastDiv.children.length >= 7) {
            break;
        }
    }
}

// Event listener for the toggle button
toggleForecastButton.addEventListener('click', () => {
    if (sevenDayForecastSection.style.display === 'none') {
        sevenDayForecastSection.style.display = 'block';
        currentForecastSection.style.display = 'none';
        toggleForecastButton.textContent = 'Show Today\'s Forecast';
    } else {
        currentForecastSection.style.display = 'block';
        sevenDayForecastSection.style.display = 'none';
        toggleForecastButton.textContent = 'Show 7-Day Forecast';
    }
});

// Function to get weather data based on current location
function getWeatherForCurrentLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            position => {
                const latitude = position.coords.latitude;
                const longitude = position.coords.longitude;
                getWeatherData(latitude, longitude);
                getCurrentWeather(latitude, longitude);
            },
            error => {
                console.error("Error getting location:", error);
                // If getting current location fails, use the default location
                getWeatherData(defaultLatitude, defaultLongitude);
                getCurrentWeather(defaultLatitude, defaultLongitude);
                let errorMessage = "Unable to retrieve your location. Displaying default location.";
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = "Location access was denied. Displaying default location.";
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = "Your location information is currently unavailable. Displaying default location.";
                        break;
                    case error.TIMEOUT:
                        errorMessage = "The request to get your location timed out. Displaying default location.";
                        break;
                }
                alert(errorMessage);
            }
        );
    } else {
        // Geolocation not supported, use default location
        getWeatherData(defaultLatitude, defaultLongitude);
        getCurrentWeather(defaultLatitude, defaultLongitude);
        alert("Geolocation is not supported by your browser. Displaying default location.");
    }
}

// Event listener for the current location button
currentLocationButton.addEventListener('click', getWeatherForCurrentLocation);

// **Call getWeatherForCurrentLocation when the page loads**
getWeatherForCurrentLocation();