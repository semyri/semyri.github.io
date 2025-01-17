const currentLocationButton = document.getElementById('current-location-button');
const locationSelect = document.getElementById('location-select');
const toggleForecastButton = document.getElementById('toggle-forecast');
const currentDayDataDiv = document.getElementById('current-day-data');
const sevenDayForecastDiv = document.getElementById('seven-day-data');
const sevenDayForecastSection = document.getElementById('seven-day-forecast');
const currentForecastSection = document.getElementById('current-forecast');
const darkModeToggle = document.getElementById('dark-mode-toggle');
const body = document.body;
const toggleText = document.querySelector('.toggle-text');
const actionButtons = document.querySelectorAll('.action-button');
const locationDropdown = document.getElementById('location-select');
const weatherDataSection = document.getElementById('weather-data');

const locations = {
    venus: { latitude: 32.4335, longitude: -97.1025 },
    dallas: { latitude: 32.7831, longitude: -96.8067 },
    waco: { latitude: 31.5493, longitude: -97.1467 },
    'fort-worth': { latitude: 32.7254, longitude: -97.3208 }
};

const apiUrlBase = 'https://api.open-meteo.com/v1/forecast';
const defaultLocation = 'venus';

let currentWeatherData = null;

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
            displayCurrentDayForecast(data.daily, 0);
            displaySevenDayForecast(data.daily);
        })
        .catch(error => {
            console.error('Error fetching weather data:', error);
            currentDayDataDiv.innerHTML = '<p>Failed to fetch weather data.</p>';
            sevenDayForecastDiv.innerHTML = '';
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
    const date = new Date(dailyData.time[index]);
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
    dailyData.time.forEach((time, index) => {
        const date = new Date(time);
        const weatherCode = dailyData.weather_code[index];
        const tempMax = dailyData.temperature_2m_max[index];
        const tempMin = dailyData.temperature_2m_min[index];
        const sunrise = dailyData.sunrise[index];
        const sunset = dailyData.sunset[index];
        const precipitationSum = dailyData.precipitation_sum[index];
        const windSpeedMax = dailyData.wind_speed_10m_max[index];

        const dailyItem = document.createElement('div');
        dailyItem.classList.add('seven-day-item');
        if (body.classList.contains('dark-mode')) {
            dailyItem.classList.add('dark-mode');
        }
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

// Event listener for location change
locationSelect.addEventListener('change', () => {
    const selectedLocation = locationSelect.value;
    const { latitude, longitude } = locations[selectedLocation];
    getWeatherData(latitude, longitude);
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

// Function to toggle dark mode
function toggleDarkMode() {
    body.classList.toggle('dark-mode');
    toggleText.textContent = body.classList.contains('dark-mode') ? 'Dark Mode' : 'Light Mode';
    actionButtons.forEach(button => button.classList.toggle('dark-mode'));
    locationDropdown.classList.toggle('dark-mode');
    const sevenDayItems = document.querySelectorAll('.seven-day-item');
    sevenDayItems.forEach(item => item.classList.toggle('dark-mode', body.classList.contains('dark-mode')));
    if (weatherDataSection) {
        weatherDataSection.classList.toggle('dark-mode');
    }
    if (sevenDayForecastSection.style.display === 'block' && currentWeatherData && currentWeatherData.daily) {
        displaySevenDayForecast(currentWeatherData.daily);
    }
    localStorage.setItem('darkMode', body.classList.contains('dark-mode'));
}

// Event listener for dark mode toggle
darkModeToggle.addEventListener('change', toggleDarkMode);

// Check for saved dark mode preference on page load
if (localStorage.getItem('darkMode') === 'true') {
    darkModeToggle.checked = true;
    toggleDarkMode();
}

// Initial load - fetch data for the default location
const initialLocationData = locations[defaultLocation];
getWeatherData(initialLocationData.latitude, initialLocationData.longitude);

// Set the default selected option in the dropdown
locationSelect.value = defaultLocation;