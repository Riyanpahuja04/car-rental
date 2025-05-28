// --- AJAX-based Car Data ---
// Fetch all cars from backend
window.fetchAllCars = function(callback) {
  fetch('/api/cars')
    .then(res => res.json())
    .then(cars => callback(cars))
    .catch(() => callback([]));
};
// Fetch car by VIN
window.fetchCarByVIN = function(vin, callback) {
  fetch(`/api/cars/${vin}`)
    .then(res => res.json())
    .then(car => callback(car))
    .catch(() => callback(null));
};
// Save last selected car VIN
window.saveLastCarVIN = function(vin) {
  localStorage.setItem('lastCarVIN', vin);
};
// Get last selected car VIN
window.getLastCarVIN = function() {
  return localStorage.getItem('lastCarVIN');
};
// Reservation form persistence (unchanged)
window.saveReservationForm = function(data) {
  localStorage.setItem('reservationForm', JSON.stringify(data));
};
window.loadReservationForm = function() {
  try {
    return JSON.parse(localStorage.getItem('reservationForm')) || {};
  } catch {
    return {};
  }
};
window.clearReservationForm = function() {
  localStorage.removeItem('reservationForm');
};
// --- Render Car Grid with AJAX ---
function createFilters(cars, filterPrefix = '') {
  const carTypes = Array.from(new Set(cars.map(car => car.type))).filter(Boolean);
  const carBrands = Array.from(new Set(cars.map(car => car.make))).filter(Boolean);
  const filterDiv = document.getElementById(filterPrefix + 'car-filter');
  if (!filterDiv) return;
  // Save current filter values before clearing
  const prevType = document.getElementById(filterPrefix + 'type-filter')?.value || '';
  const prevBrand = document.getElementById(filterPrefix + 'brand-filter')?.value || '';
  // Remove old filters if present
  filterDiv.querySelectorAll('label, select').forEach(el => el.remove());
  // Type filter
  const typeLabel = document.createElement('label');
  typeLabel.textContent = 'Type:';
  typeLabel.setAttribute('for', filterPrefix + 'type-filter');
  typeLabel.style.marginRight = '0.5rem';
  const typeSelect = document.createElement('select');
  typeSelect.id = filterPrefix + 'type-filter';
  typeSelect.innerHTML = '<option value="">All</option>' + carTypes.map(t => `<option value="${t}">${t}</option>`).join('');
  typeSelect.style.marginRight = '1rem';
  // Restore previous value if possible
  typeSelect.value = prevType;
  // Brand filter
  const brandLabel = document.createElement('label');
  brandLabel.textContent = 'Brand:';
  brandLabel.setAttribute('for', filterPrefix + 'brand-filter');
  brandLabel.style.marginRight = '0.5rem';
  const brandSelect = document.createElement('select');
  brandSelect.id = filterPrefix + 'brand-filter';
  brandSelect.innerHTML = '<option value="">All</option>' + carBrands.map(b => `<option value="${b}">${b}</option>`).join('');
  // Restore previous value if possible
  brandSelect.value = prevBrand;
  // Add to filterDiv
  filterDiv.appendChild(typeLabel);
  filterDiv.appendChild(typeSelect);
  filterDiv.appendChild(brandLabel);
  filterDiv.appendChild(brandSelect);
  // Add listeners
  typeSelect.addEventListener('change', function() {
    renderCarsAJAX(document.getElementById(filterPrefix + 'search')?.value?.toLowerCase() || '', filterPrefix);
  });
  brandSelect.addEventListener('change', function() {
    renderCarsAJAX(document.getElementById(filterPrefix + 'search')?.value?.toLowerCase() || '', filterPrefix);
  });
}

function getFilterValues(filterPrefix = '') {
  const type = document.getElementById(filterPrefix + 'type-filter')?.value || '';
  const brand = document.getElementById(filterPrefix + 'brand-filter')?.value || '';
  return { type, brand };
}

// --- Use AJAX to fetch car data and update UI dynamically ---
function renderCarsAJAX(filter = '', filterPrefix = '') {
  window.fetchAllCars(function(cars) {
    createFilters(cars, filterPrefix);
    const { type, brand } = getFilterValues(filterPrefix);
    const list = document.getElementById(filterPrefix + 'car-list');
    if (!list) return;
    list.innerHTML = '';
    let filtered = cars.filter(car => {
      const matchesType = !type || car.type === type;
      const matchesBrand = !brand || car.make === brand;
      const matchesKeyword =
        car.make.toLowerCase().includes(filter) ||
        car.model.toLowerCase().includes(filter) ||
        car.type.toLowerCase().includes(filter) ||
        (car.description && car.description.toLowerCase().includes(filter));
      return matchesType && matchesBrand && matchesKeyword;
    });
    // Only show available cars on homepage (filterPrefix === 'home-')
    if (filterPrefix === 'home-') {
      filtered = filtered.filter(car => car.available);
    }
    if (filtered.length === 0) {
      list.innerHTML = '<p>No cars found.</p>';
      return;
    }
    filtered.forEach(car => {
      const card = document.createElement('div');
      card.className = 'car-card';
      card.innerHTML = `
        <img src="${car.image}" alt="${car.make} ${car.model}" loading="lazy" />
        <h3>${car.make} ${car.model}</h3>
        <p>Year: ${car.year} | Mileage: ${car.mileage.toLocaleString()} km | Fuel: ${car.fuel}</p>
        <p>Price per day: $${car.price}</p>
        <p style="color:${car.available ? 'green' : 'red'};font-weight:bold;">${car.available ? 'Available' : 'Not Available'}</p>
        <a href="booking.html?vin=${car.vin}" class="cta rent-btn" ${car.available ? '' : 'aria-disabled="true" tabindex="-1" style="pointer-events:none;opacity:0.5;"'}>Rent</a>
      `;
      list.appendChild(card);
    });
    // Save last clicked car VIN on rent button click
    setTimeout(() => {
      document.querySelectorAll('.rent-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
          const url = new URL(btn.href, window.location.origin);
          const vin = url.searchParams.get('vin');
          if (vin) {
            window.saveLastCarVIN(vin);
          }
        });
      });
    }, 0);
  });
}

// Initial render
renderCarsAJAX();

// --- Real-time search box and suggestions ---
const searchInput = document.getElementById('search');
const suggestionBox = document.getElementById('suggestion-box');

let allCars = [];
let searchKeywords = [];
window.fetchAllCars(cars => {
  allCars = cars;
  // Build unique keyword list from make, model, type, and description
  const keywords = new Set();
  cars.forEach(car => {
    keywords.add(car.make);
    keywords.add(car.model);
    keywords.add(car.type);
    if (car.description) {
      car.description.split(/\s+/).forEach(word => {
        if (word.length > 1) keywords.add(word);
      });
    }
  });
  searchKeywords = Array.from(keywords).filter(Boolean);
});

searchInput.addEventListener('input', function(e) {
  const value = e.target.value.toLowerCase();
  // Show suggestions
  if (value.length > 0) {
    const matches = searchKeywords.filter(k => k.toLowerCase().includes(value));
    suggestionBox.innerHTML = '';
    matches.slice(0, 8).forEach(match => {
      const li = document.createElement('li');
      li.textContent = match;
      li.tabIndex = 0;
      li.style.padding = '0.5rem 1rem';
      li.style.cursor = 'pointer';
      li.addEventListener('mousedown', function(ev) {
        ev.preventDefault();
        searchInput.value = match;
        suggestionBox.style.display = 'none';
        renderCarsAJAX(match.toLowerCase());
      });
      li.addEventListener('keydown', function(ev) {
        if (ev.key === 'Enter') {
          searchInput.value = match;
          suggestionBox.style.display = 'none';
          renderCarsAJAX(match.toLowerCase());
        }
      });
      suggestionBox.appendChild(li);
    });
    suggestionBox.style.display = matches.length ? 'block' : 'none';
  } else {
    suggestionBox.style.display = 'none';
  }
  // Also trigger search as user types
  renderCarsAJAX(value);
});

// Hide suggestions when clicking outside
window.addEventListener('mousedown', function(e) {
  if (!searchInput.contains(e.target) && !suggestionBox.contains(e.target)) {
    suggestionBox.style.display = 'none';
  }
});

// Listen for filter changes
function setupFilterListeners() {
  document.getElementById('type-filter')?.addEventListener('change', function() {
    renderCarsAJAX(searchInput.value.toLowerCase());
  });
  document.getElementById('brand-filter')?.addEventListener('change', function() {
    renderCarsAJAX(searchInput.value.toLowerCase());
  });
}

// On DOMContentLoaded, always render filters and grid
if (document.getElementById('car-filter')) {
  window.fetchAllCars(cars => {
    createFilters(cars);
    renderCarsAJAX();
  });
}

// Initial render
renderCarsAJAX();

// --- On car grid pages, save last clicked car ---
setTimeout(() => {
  document.querySelectorAll('.rent-btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
      const url = new URL(btn.href, window.location.origin);
      const vin = url.searchParams.get('vin');
      if (vin) window.saveLastCarVIN(vin);
    });
  });
}, 0);

// Save last selected car VIN on rent button click (for booking page)
document.addEventListener('click', function(e) {
  if (e.target.classList.contains('rent-btn')) {
    const url = new URL(e.target.href, window.location.origin);
    const vin = url.searchParams.get('vin');
    if (vin) localStorage.setItem('lastCarVIN', vin);
  }
});

// On homepage, use 'home-' prefix for filter and car-list section
if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/' || window.location.pathname === '') {
  document.getElementById('car-list-home').querySelector('h2').textContent = 'Available Cars';
  renderCarsAJAX('', 'home-');
}
// On cars page, show all cars and update section title
if (window.location.pathname.endsWith('cars.html')) {
  document.querySelector('h2').textContent = 'All Cars';
  renderCarsAJAX('', '');
}
