const currentLocationButton = document.getElementById('current-location-button');
const locationSelect = document.getElementById('location-select');
const toggleForecastButton = document.getElementById('toggle-forecast');
const currentDayDataDiv = document.getElementById('current-day-data');
const sevenDayForecastDiv = document.getElementById('seven-day-data');
const sevenDayForecastSection = document.getElementById('seven-day-forecast');
const currentForecastSection = document.getElementById('current-forecast');
const body = document.body;
const actionButtons = document.querySelectorAll('.action-button');
const locationDropdown = document.getElementById('location-select');
const weatherDataSection = document.getElementById('weather-data');
const currentConditionsBox = document.getElementById('current-conditions-box');

const locations = {
    venus: { latitude: 32.4335, longitude: -97.1025 },
    dallas: { latitude: 32.7831, longitude: -96.8067 },
    waco: { latitude: 31.5493, longitude: -97.1467 },
    'fort-worth': { latitude: 32.7254, longitude: -97.3208 }
};

const apiUrlBase = 'https://api.open-meteo.com/v1/forecast';
const currentConditionsApiUrlBase = 'https://api.open-meteo.com/v1/forecast'; // Same base URL
const defaultLocation = 'venus';

let currentWeatherData = null;

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
        })
        .catch(error => {
            console.error('Error fetching current weather data:', error);
            currentConditionsBox.innerHTML = '<p>Failed to fetch current weather.</p>';
        });
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
            // Find the index for the current day
            const today = new Date();
            const todayString = today.toISOString().split('T')[0];

            let currentDayIndex = -1;
            for (let i = 0; i < data.daily.time.length; i++) {
                const apiDate = new Date(data.daily.time[i]);
                const apiDateString = apiDate.toISOString().split('T')[0];

                if (apiDateString === todayString) {
                    currentDayIndex = i;
                    break;
                }
            }

            if (currentDayIndex !== -1) {
                displayCurrentDayForecast(data.daily, currentDayIndex);
            } else {
                currentDayDataDiv.innerHTML = '<p>Could not find forecast data for the current day.</p>';
            }
            displaySevenDayForecast(data.daily);
            getCurrentWeather(latitude, longitude); // Fetch current weather after daily forecast
        })
        .catch(error => {
            console.error('Error fetching weather data:', error);
            currentDayDataDiv.innerHTML = '<p>Failed to fetch weather data.</p>';
            sevenDayForecastDiv.innerHTML = '';
            currentConditionsBox.innerHTML = '<p>Failed to fetch weather data.</p>';
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

function displayCurrentDayForecast(dailyData, index) {
    currentDayDataDiv.innerHTML = '';
    if (index === -1) {
        currentDayDataDiv.innerHTML = '<p>No forecast data available for the selected day.</p>';
        return;
    }
    const date = new Date(dailyData.time[index]);
    date.setDate(date.getDate() + 1); // Add one day - TEMPORARY FIX: Consider proper timezone handling
    const weatherCode = dailyData.weather_code[index];
    const tempMax = dailyData.temperature_2m_max[index];
    const tempMin = dailyData.temperature_2m_min[index];
    const sunrise = dailyData.sunrise[index];
    const sunset = dailyData.sunset[index];
    const precipitationSum = dailyData.precipitation_sum[index];
    const windSpeedMax = dailyData.wind_speed_10m_max[index];

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
}

function displaySevenDayForecast(dailyData) {
    sevenDayForecastDiv.innerHTML = '';
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    let startIndex = -1;

    for (let i = 0; i < dailyData.time.length; i++) {
        const apiDate = new Date(dailyData.time[i]);
        const apiDateString = apiDate.toISOString().split('T')[0];
        if (apiDateString === todayString) {
            startIndex = i;
            break;
        }
    }

    if (startIndex !== -1) {
        const forecastToShow = dailyData.time.slice(startIndex).map((time, index) => ({
            time,
            weather_code: dailyData.weather_code[startIndex + index],
            temperature_2m_max: dailyData.temperature_2m_max[startIndex + index],
            temperature_2m_min: dailyData.temperature_2m_min[startIndex + index],
            sunrise: dailyData.sunrise[startIndex + index],
            sunset: dailyData.sunset[startIndex + index],
            precipitation_sum: dailyData.precipitation_sum[startIndex + index],
            wind_speed_10m_max: dailyData.wind_speed_10m_max[startIndex + index]
        }));

        forecastToShow.forEach(dayData => {
            const date = new Date(dayData.time);
            date.setDate(date.getDate() + 1); // Add one day - TEMPORARY FIX: Consider proper timezone handling
            const weatherCode = dayData.weather_code;
            const tempMax = dayData.temperature_2m_max;
            const tempMin = dayData.temperature_2m_min;
            const sunrise = dayData.sunrise;
            const sunset = dayData.sunset;
            const precipitationSum = dayData.precipitation_sum;
            const windSpeedMax = dayData.wind_speed_10m_max;

            const dailyItem = document.createElement('div');
            dailyItem.classList.add('seven-day-item');
            // No need to add dark-mode class here anymore since it's the default
            dailyItem.innerHTML = `
                <p><strong>${date.toLocaleDateString()}</strong></p>
                <p>Weather: ${getWeatherCondition(weatherCode)}</p>
                <p>High: ${tempMax}°F</p>
                <p>Low: ${tempMin}°F</p>
                <p>Sunrise: ${new Date(sunrise).toLocaleTimeString()}</p>
                <p>Sunset: ${new Date(sunset).toLocaleTimeString()}</p>
                <p>Precipitation: ${precipitationSum} in</p>
                <p>Max Wind Speed: ${windSpeedMax} mph</p>
            `;
            sevenDayForecastDiv.appendChild(dailyItem);
        });
    }
}

// Event listener for location change
locationSelect.addEventListener('change', () => {
    const selectedLocation = locationSelect.value;
    const { latitude, longitude } = locations[selectedLocation];
    getWeatherData(latitude, longitude);
    getCurrentWeather(latitude, longitude); // Fetch current weather on location change
});

// Event listener for the toggle button
toggleForecastButton.addEventListener('click', () => {
    if (sevenDayForecastSection.style.display === 'none') {
        if (currentWeatherData && currentWeatherData.daily) {
            displaySevenDayForecast(currentWeatherData.daily);
        }
        sevenDayForecastSection.style.display = 'block';
        currentForecastSection.style.display = 'none';
        toggleForecastButton.textContent = 'Show Today\'s Forecast';
    } else {
        currentForecastSection.style.display = 'block';
        sevenDayForecastSection.style.display = 'none';
        toggleForecastButton.textContent = 'Show 7-Day Forecast';
    }
});

// Event listener for the current location button
currentLocationButton.addEventListener('click', () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            position => {
                const latitude = position.coords.latitude;
                const longitude = position.coords.longitude;
                getWeatherData(latitude, longitude);
                getCurrentWeather(latitude, longitude); // Fetch current weather on current location
            },
            error => {
                let errorMessage = "Unable to retrieve your location.";
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = "Location access was denied. Please allow location access to use this feature.";
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = "Your location information is currently unavailable.";
                        break;
                    case error.TIMEOUT:
                        errorMessage = "The request to get your location timed out.";
                        break;
                }
                alert(errorMessage);
            }
        );
    } else {
        alert("Geolocation is not supported by your browser.");
    }
});

// Initial load - fetch data for the default location
const initialLocationData = locations[defaultLocation];
getWeatherData(initialLocationData.latitude, initialLocationData.longitude);
getCurrentWeather(initialLocationData.latitude, initialLocationData.longitude); // Fetch current weather on initial load

// Set the default selected option in the dropdown
locationSelect.value = defaultLocation;