// API Configuration
const API_KEY = '1fa9ff4126d95b8db54f3897a208e91c';
const BASE_URL = 'https://api.openweathermap.org/data/2.5';
const GEO_URL = 'https://api.openweathermap.org/geo/1.0';

// DOM Elements
const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const themeToggle = document.getElementById('themeToggle');
const unitToggles = document.querySelectorAll('#unitToggle');
const loadingSpinner = document.getElementById('loadingSpinner');

// Weather Display Elements
const cityName = document.getElementById('cityName');
const country = document.getElementById('country');
const currentDate = document.getElementById('currentDate');
const lastUpdated = document.getElementById('lastUpdated');
const temperature = document.getElementById('temperature');
const feelsLike = document.getElementById('feelsLike');
const weatherIcon = document.getElementById('weatherIcon');
const weatherDescription = document.getElementById('weatherDescription');
const humidity = document.getElementById('humidity');
const windSpeed = document.getElementById('windSpeed');
const pressure = document.getElementById('pressure');
const visibility = document.getElementById('visibility');
const clouds = document.getElementById('clouds');
const uvIndex = document.getElementById('uvIndex');
const hourlyCards = document.getElementById('hourlyCards');
const forecastCards = document.getElementById('forecastCards');
const sunrise = document.getElementById('sunrise');
const sunset = document.getElementById('sunset');
const aqiValue = document.getElementById('aqiValue');
const aqiLevel = document.getElementById('aqiLevel');
const pm25 = document.getElementById('pm25');
const pm10 = document.getElementById('pm10');
const o3 = document.getElementById('o3');

// State
let currentUnit = 'celsius';
let currentWeather = null;
let currentLocation = null;

// Theme Toggle
themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const icon = themeToggle.querySelector('i');
    icon.classList.toggle('fa-moon');
    icon.classList.toggle('fa-sun');
});

// Unit Toggle
unitToggles.forEach(toggle => {
    toggle.addEventListener('click', () => {
        unitToggles.forEach(t => t.classList.remove('active'));
        toggle.classList.add('active');
        currentUnit = toggle.dataset.unit;
        if (currentWeather) {
            updateWeatherDisplay(currentWeather);
            updateHourlyForecast(currentLocation);
            updateForecast(currentLocation);
        }
    });
});

// Search Functionality
searchBtn.addEventListener('click', handleSearch);
cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        handleSearch();
    }
});

async function handleSearch() {
    const city = cityInput.value.trim();
    if (!city) {
        showError('Please enter a city name');
        return;
    }

    showLoading();
    try {
        const location = await getCoordinates(city);
        currentLocation = location;
        const weatherData = await fetchWeatherData(location);
        currentWeather = weatherData;
        updateWeatherDisplay(weatherData);
        await updateHourlyForecast(location);
        await updateForecast(location);
        await updateAirQuality(location);
        updateBackground(weatherData.weather[0].main);
    } catch (error) {
        console.error('Error:', error);
        showError('City not found. Please try again with a valid city name.');
    } finally {
        hideLoading();
    }
}

async function getCoordinates(city) {
    const response = await fetch(
        `${GEO_URL}/direct?q=${city}&limit=1&appid=${API_KEY}`
    );
    if (!response.ok) throw new Error('City not found');
    const data = await response.json();
    if (data.length === 0) throw new Error('City not found');
    return data[0];
}

async function fetchWeatherData(location) {
    const response = await fetch(
        `${BASE_URL}/weather?lat=${location.lat}&lon=${location.lon}&appid=${API_KEY}&units=metric`
    );
    if (!response.ok) throw new Error('Weather data not available');
    return response.json();
}

async function updateHourlyForecast(location) {
    const response = await fetch(
        `${BASE_URL}/forecast?lat=${location.lat}&lon=${location.lon}&appid=${API_KEY}&units=metric`
    );
    if (!response.ok) throw new Error('Forecast not available');
    const data = await response.json();
    
    hourlyCards.innerHTML = '';
    const hourlyData = data.list.slice(0, 8); // Next 24 hours (3-hour intervals)

    hourlyData.forEach(hour => {
        const time = new Date(hour.dt * 1000);
        const temp = currentUnit === 'celsius'
            ? Math.round(hour.main.temp)
            : Math.round((hour.main.temp * 9/5) + 32);

        const card = document.createElement('div');
        card.className = 'hourly-card';
        card.innerHTML = `
            <div class="hour">${time.getHours()}:00</div>
            <img src="https://openweathermap.org/img/wn/${hour.weather[0].icon}@2x.png" alt="${hour.weather[0].description}">
            <div class="temp">${temp}°</div>
            <div class="description">${hour.weather[0].description}</div>
        `;
        hourlyCards.appendChild(card);
    });
}

async function updateForecast(location) {
    const response = await fetch(
        `${BASE_URL}/forecast?lat=${location.lat}&lon=${location.lon}&appid=${API_KEY}&units=metric`
    );
    if (!response.ok) throw new Error('Forecast not available');
    const data = await response.json();
    
    forecastCards.innerHTML = '';
    const dailyForecasts = data.list.filter(forecast => 
        forecast.dt_txt.includes('12:00:00')
    ).slice(0, 5);

    dailyForecasts.forEach(forecast => {
        const date = new Date(forecast.dt * 1000);
        const temp = currentUnit === 'celsius'
            ? Math.round(forecast.main.temp)
            : Math.round((forecast.main.temp * 9/5) + 32);
        const minTemp = currentUnit === 'celsius'
            ? Math.round(forecast.main.temp_min)
            : Math.round((forecast.main.temp_min * 9/5) + 32);
        const maxTemp = currentUnit === 'celsius'
            ? Math.round(forecast.main.temp_max)
            : Math.round((forecast.main.temp_max * 9/5) + 32);

        const card = document.createElement('div');
        card.className = 'weather-card forecast-card';
        card.innerHTML = `
            <div class="forecast-date">${date.toLocaleDateString('en-US', { weekday: 'short' })}</div>
            <img src="https://openweathermap.org/img/wn/${forecast.weather[0].icon}@2x.png" alt="${forecast.weather[0].description}">
            <div class="forecast-temp">
                <span class="max">${maxTemp}°</span>
                <span class="min">${minTemp}°</span>
            </div>
            <div class="forecast-desc">${forecast.weather[0].description}</div>
            <div class="forecast-details">
                <div class="detail">
                    <i class="fas fa-tint"></i>
                    <span>${forecast.main.humidity}%</span>
                </div>
                <div class="detail">
                    <i class="fas fa-wind"></i>
                    <span>${Math.round(forecast.wind.speed * 3.6)} km/h</span>
                </div>
            </div>
        `;
        forecastCards.appendChild(card);
    });
}

async function updateAirQuality(location) {
    const response = await fetch(
        `${BASE_URL}/air_pollution?lat=${location.lat}&lon=${location.lon}&appid=${API_KEY}`
    );
    if (!response.ok) return;
    const data = await response.json();
    
    const aqi = data.list[0].main.aqi;
    const components = data.list[0].components;
    
    aqiValue.textContent = aqi;
    aqiLevel.textContent = getAQILevel(aqi);
    pm25.textContent = Math.round(components.pm2_5);
    pm10.textContent = Math.round(components.pm10);
    o3.textContent = Math.round(components.o3);
}

function getAQILevel(aqi) {
    const levels = ['Good', 'Fair', 'Moderate', 'Poor', 'Very Poor'];
    return levels[aqi - 1] || 'Unknown';
}

function updateWeatherDisplay(data) {
    cityName.textContent = data.name;
    country.textContent = data.sys.country;
    
    const now = new Date();
    currentDate.textContent = now.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    lastUpdated.textContent = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });
    
    const temp = currentUnit === 'celsius' 
        ? Math.round(data.main.temp)
        : Math.round((data.main.temp * 9/5) + 32);
    temperature.textContent = `${temp}°`;
    
    const feelsLikeTemp = currentUnit === 'celsius'
        ? Math.round(data.main.feels_like)
        : Math.round((data.main.feels_like * 9/5) + 32);
    feelsLike.textContent = `${feelsLikeTemp}°`;
    
    weatherIcon.src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
    weatherDescription.textContent = data.weather[0].description;
    
    humidity.textContent = `${data.main.humidity}%`;
    windSpeed.textContent = `${Math.round(data.wind.speed * 3.6)} km/h`;
    pressure.textContent = `${data.main.pressure} hPa`;
    visibility.textContent = `${(data.visibility / 1000).toFixed(1)} km`;
    clouds.textContent = `${data.clouds.all}%`;
    
    const sunriseTime = new Date(data.sys.sunrise * 1000);
    const sunsetTime = new Date(data.sys.sunset * 1000);
    
    sunrise.textContent = sunriseTime.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });
    sunset.textContent = sunsetTime.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });

    // Update weather effects
    updateWeatherEffects(data.weather[0].main);
}

function updateBackground(weatherCondition) {
    document.body.className = '';
    document.body.classList.add(`weather-${weatherCondition.toLowerCase()}`);
}

function showLoading() {
    loadingSpinner.style.display = 'block';
}

function hideLoading() {
    loadingSpinner.style.display = 'none';
}

function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    document.querySelector('.search-container').appendChild(errorDiv);
    
    setTimeout(() => {
        errorDiv.remove();
    }, 3000);
}

// Add default city on load
window.addEventListener('load', () => {
    cityInput.value = 'London';
    handleSearch();
});

// Weather Animation Functions
function initializeWeatherAnimations() {
    // Add weather effect containers to the body
    const weatherEffects = [
        'rain',
        'sunny',
        'cloudy',
        'snowy',
        'thunderstorm'
    ];

    weatherEffects.forEach(type => {
        const effect = document.createElement('div');
        effect.className = `weather-effect ${type}`;
        document.body.appendChild(effect);
    });

    // Add click handlers to hourly forecast cards
    document.querySelectorAll('.hourly-card').forEach(card => {
        card.addEventListener('click', () => {
            // Remove active class from all cards
            document.querySelectorAll('.hourly-card').forEach(c => c.classList.remove('active'));
            // Add active class to clicked card
            card.classList.add('active');

            // Remove active class from all weather effects
            document.querySelectorAll('.weather-effect').forEach(effect => effect.classList.remove('active'));

            // Get weather type from the card's class
            const weatherType = card.classList.contains('weather-rainy') ? 'rain' :
                              card.classList.contains('weather-sunny') ? 'sunny' :
                              card.classList.contains('weather-cloudy') ? 'cloudy' :
                              card.classList.contains('weather-snowy') ? 'snowy' :
                              card.classList.contains('weather-thunderstorm') ? 'thunderstorm' : null;

            // Activate the corresponding weather effect
            if (weatherType) {
                document.querySelector(`.weather-effect.${weatherType}`).classList.add('active');
            }
        });
    });
}

// Call the initialization function when the DOM is loaded
document.addEventListener('DOMContentLoaded', initializeWeatherAnimations);

// Create stars for cosmic background
function createStars() {
    const starsContainer = document.createElement('div');
    starsContainer.className = 'stars';
    document.body.appendChild(starsContainer);

    for (let i = 0; i < 100; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        star.style.left = `${Math.random() * 100}%`;
        star.style.top = `${Math.random() * 100}%`;
        star.style.width = `${Math.random() * 3}px`;
        star.style.height = star.style.width;
        star.style.animationDelay = `${Math.random() * 3}s`;
        starsContainer.appendChild(star);
    }
}

// Create rain effect
function createRainEffect() {
    const rainContainer = document.createElement('div');
    rainContainer.className = 'rain-effect';
    document.body.appendChild(rainContainer);

    for (let i = 0; i < 50; i++) {
        const drop = document.createElement('div');
        drop.className = 'rain-drop';
        drop.style.left = `${Math.random() * 100}%`;
        drop.style.animationDelay = `${Math.random() * 2}s`;
        rainContainer.appendChild(drop);
    }
}

// Create sun effect
function createSunEffect() {
    const sunContainer = document.createElement('div');
    sunContainer.className = 'sun-effect';
    document.body.appendChild(sunContainer);

    for (let i = 0; i < 12; i++) {
        const ray = document.createElement('div');
        ray.className = 'sun-ray';
        ray.style.transform = `rotate(${i * 30}deg)`;
        ray.style.animationDelay = `${i * 0.2}s`;
        sunContainer.appendChild(ray);
    }
}

// Update weather effects based on weather type
function updateWeatherEffects(weatherType) {
    // Remove existing effects
    document.querySelectorAll('.rain-effect, .sun-effect').forEach(effect => effect.remove());

    // Add new effects based on weather type
    switch (weatherType.toLowerCase()) {
        case 'rain':
        case 'drizzle':
        case 'shower rain':
            createRainEffect();
            break;
        case 'clear sky':
        case 'sunny':
            createSunEffect();
            break;
        // Add more weather types as needed
    }
}

// Initialize weather effects
function initializeWeatherEffects() {
    createStars();
    
    // Add click handlers to hourly forecast cards
    document.querySelectorAll('.hourly-card').forEach(card => {
        card.addEventListener('click', () => {
            const weatherType = card.getAttribute('data-weather');
            updateWeatherEffects(weatherType);
            
            // Update active state
            document.querySelectorAll('.hourly-card').forEach(c => c.classList.remove('active'));
            card.classList.add('active');
        });
    });
}

// Call initialization when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeWeatherEffects();
}); 