// ============================================
// WEATHER APP - South Africa Focus
// Uses Open-Meteo API (Free, No API Key)
// ============================================

// --- DOM Elements ---
const cityInput = document.getElementById('city-input');
const searchBtn = document.getElementById('search-btn');
const locationBtn = document.getElementById('location-btn');
const quickBtns = document.querySelectorAll('.quick-btn');
const loadingEl = document.getElementById('loading');
const errorEl = document.getElementById('error');
const errorMessage = document.getElementById('error-message');
const weatherResult = document.getElementById('weather-result');

// Weather display elements
const cityNameEl = document.getElementById('city-name');
const currentDateEl = document.getElementById('current-date');
const weatherIconEl = document.getElementById('weather-icon');
const temperatureEl = document.getElementById('temperature');
const weatherDescEl = document.getElementById('weather-description');
const feelsLikeEl = document.getElementById('feels-like');
const humidityEl = document.getElementById('humidity');
const windSpeedEl = document.getElementById('wind-speed');
const visibilityEl = document.getElementById('visibility');
const forecastListEl = document.getElementById('forecast-list');

// --- WMO Weather Codes to Description & Icon Mapping ---
const weatherCodes = {
    0: { desc: 'Clear Sky', icon: '01d' },
    1: { desc: 'Mainly Clear', icon: '02d' },
    2: { desc: 'Partly Cloudy', icon: '03d' },
    3: { desc: 'Overcast', icon: '04d' },
    45: { desc: 'Foggy', icon: '50d' },
    48: { desc: 'Depositing Rime Fog', icon: '50d' },
    51: { desc: 'Light Drizzle', icon: '09d' },
    53: { desc: 'Moderate Drizzle', icon: '09d' },
    55: { desc: 'Dense Drizzle', icon: '09d' },
    61: { desc: 'Slight Rain', icon: '10d' },
    63: { desc: 'Moderate Rain', icon: '10d' },
    65: { desc: 'Heavy Rain', icon: '10d' },
    71: { desc: 'Slight Snow', icon: '13d' },
    73: { desc: 'Moderate Snow', icon: '13d' },
    75: { desc: 'Heavy Snow', icon: '13d' },
    77: { desc: 'Snow Grains', icon: '13d' },
    80: { desc: 'Slight Rain Showers', icon: '09d' },
    81: { desc: 'Moderate Rain Showers', icon: '09d' },
    82: { desc: 'Violent Rain Showers', icon: '09d' },
    85: { desc: 'Slight Snow Showers', icon: '13d' },
    86: { desc: 'Heavy Snow Showers', icon: '13d' },
    95: { desc: 'Thunderstorm', icon: '11d' },
    96: { desc: 'Thunderstorm with Hail', icon: '11d' },
    99: { desc: 'Thunderstorm with Heavy Hail', icon: '11d' }
};

// --- Helper Functions ---

function getWeatherInfo(code) {
    return weatherCodes[code] || { desc: 'Unknown', icon: '03d' };
}

function getWeatherIconUrl(iconCode) {
    return `https://openweathermap.org/img/wn/${iconCode}@4x.png`;
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

function formatDay(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'short' });
}

// --- UI Functions ---

function showLoading() {
    loadingEl.classList.remove('hidden');
    errorEl.classList.add('hidden');
    weatherResult.classList.add('hidden');
}

function showError(message) {
    loadingEl.classList.add('hidden');
    errorEl.classList.remove('hidden');
    weatherResult.classList.add('hidden');
    errorMessage.textContent = message;
}

function showWeather() {
    loadingEl.classList.add('hidden');
    errorEl.classList.add('hidden');
    weatherResult.classList.remove('hidden');
}

// --- API Functions ---

async function getCoordinates(city) {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=5&language=en&format=json`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (!data.results || data.results.length === 0) {
        throw new Error('City not found. Please check the spelling and try again.');
    }
    
    // Prefer South African results if multiple matches
    const saResult = data.results.find(r => r.country === 'South Africa');
    return saResult || data.results[0];
}

async function getWeatherData(lat, lon) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,visibility&daily=weather_code,temperature_2m_max,temperature_2m_min&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=auto`;
    const response = await fetch(url);
    return response.json();
}

// --- Main Weather Fetch ---

async function fetchWeather(city) {
    try {
        showLoading();
        
        const location = await getCoordinates(city);
        const weather = await getWeatherData(location.latitude, location.longitude);
        
        displayCurrentWeather(location.name, location.country, weather.current);
        displayForecast(weather.daily);
        
        showWeather();
        
    } catch (error) {
        showError(error.message || 'Failed to fetch weather data. Please try again.');
    }
}

async function fetchWeatherByCoords(lat, lon) {
    try {
        showLoading();
        
        const geoUrl = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`;
        const geoResponse = await fetch(geoUrl);
        const geoData = await geoResponse.json();
        const cityName = geoData.address.city || geoData.address.town || geoData.address.village || 'Your Location';
        const country = geoData.address.country || '';
        
        const weather = await getWeatherData(lat, lon);
        
        displayCurrentWeather(cityName, country, weather.current);
        displayForecast(weather.daily);
        
        showWeather();
        
    } catch (error) {
        showError('Could not get weather for your location.');
    }
}

// --- Display Functions ---

function displayCurrentWeather(city, country, current) {
    const weatherInfo = getWeatherInfo(current.weather_code);
    
    cityNameEl.textContent = `${city}${country ? ', ' + country : ''}`;
    currentDateEl.textContent = formatDate(new Date());
    weatherIconEl.src = getWeatherIconUrl(weatherInfo.icon);
    weatherIconEl.alt = weatherInfo.desc;
    temperatureEl.textContent = Math.round(current.temperature_2m);
    weatherDescEl.textContent = weatherInfo.desc;
    feelsLikeEl.textContent = `${Math.round(current.apparent_temperature)}°`;
    humidityEl.textContent = `${current.relative_humidity_2m}%`;
    windSpeedEl.textContent = `${Math.round(current.wind_speed_10m)} mph`;
    visibilityEl.textContent = `${(current.visibility / 1609).toFixed(1)} mi`;
}

function displayForecast(daily) {
    forecastListEl.innerHTML = '';
    
    for (let i = 0; i < 7; i++) {
        const weatherInfo = getWeatherInfo(daily.weather_code[i]);
        const dayName = i === 0 ? 'Today' : formatDay(daily.time[i]);
        
        const forecastItem = document.createElement('div');
        forecastItem.className = 'forecast-item';
        forecastItem.innerHTML = `
            <span class="forecast-day">${dayName}</span>
            <img class="forecast-icon" src="${getWeatherIconUrl(weatherInfo.icon)}" alt="${weatherInfo.desc}">
            <span class="forecast-desc">${weatherInfo.desc}</span>
            <div class="forecast-temps">
                <span class="temp-high">${Math.round(daily.temperature_2m_max[i])}°</span>
                <span class="temp-low">${Math.round(daily.temperature_2m_min[i])}°</span>
            </div>
        `;
        
        forecastListEl.appendChild(forecastItem);
    }
}

// --- Geolocation ---

function getUserLocation() {
    if (!navigator.geolocation) {
        showError('Geolocation is not supported by your browser.');
        return;
    }
    
    locationBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    
    navigator.geolocation.getCurrentPosition(
        (position) => {
            locationBtn.innerHTML = '<i class="fas fa-location-arrow"></i>';
            fetchWeatherByCoords(position.coords.latitude, position.coords.longitude);
        },
        () => {
            locationBtn.innerHTML = '<i class="fas fa-location-arrow"></i>';
            showError('Unable to retrieve your location. Please search manually.');
        }
    );
}

// --- Event Listeners ---

searchBtn.addEventListener('click', () => {
    const city = cityInput.value.trim();
    if (city) fetchWeather(city);
});

cityInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        const city = cityInput.value.trim();
        if (city) fetchWeather(city);
    }
});

locationBtn.addEventListener('click', getUserLocation);

// Quick city buttons
quickBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const city = btn.dataset.city;
        cityInput.value = city;
        fetchWeather(city);
    });
});

// --- Init: Load Johannesburg by default ---
fetchWeather('Johannesburg');