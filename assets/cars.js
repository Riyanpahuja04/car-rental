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
function createFilters(cars) {
  const carTypes = Array.from(new Set(cars.map(car => car.type))).filter(Boolean);
  const carBrands = Array.from(new Set(cars.map(car => car.make))).filter(Boolean);
  const filterDiv = document.getElementById('car-filter');
  if (!filterDiv) return;
  // Clear previous filters
  filterDiv.innerHTML = '';
  // Type filter
  const typeLabel = document.createElement('label');
  typeLabel.textContent = 'Type:';
  typeLabel.setAttribute('for', 'type-filter');
  typeLabel.style.marginRight = '0.5rem';
  const typeSelect = document.createElement('select');
  typeSelect.id = 'type-filter';
  typeSelect.innerHTML = '<option value="">All</option>' + carTypes.map(t => `<option value="${t}">${t}</option>`).join('');
  typeSelect.style.marginRight = '1rem';
  // Brand filter
  const brandLabel = document.createElement('label');
  brandLabel.textContent = 'Brand:';
  brandLabel.setAttribute('for', 'brand-filter');
  brandLabel.style.marginRight = '0.5rem';
  const brandSelect = document.createElement('select');
  brandSelect.id = 'brand-filter';
  brandSelect.innerHTML = '<option value="">All</option>' + carBrands.map(b => `<option value="${b}">${b}</option>`).join('');
  // Add to filterDiv
  filterDiv.appendChild(typeLabel);
  filterDiv.appendChild(typeSelect);
  filterDiv.appendChild(brandLabel);
  filterDiv.appendChild(brandSelect);
}

function getFilterValues() {
  const type = document.getElementById('type-filter')?.value || '';
  const brand = document.getElementById('brand-filter')?.value || '';
  return { type, brand };
}

// --- Use AJAX to fetch car data and update UI dynamically ---
function renderCarsAJAX(filter = '') {
  window.fetchAllCars(function(cars) {
    createFilters(cars);
    const { type, brand } = getFilterValues();
    const list = document.getElementById('car-list');
    if (!list) return;
    list.innerHTML = '';
    const filtered = cars.filter(car => {
      const matchesType = !type || car.type === type;
      const matchesBrand = !brand || car.make === brand;
      const matchesKeyword =
        car.make.toLowerCase().includes(filter) ||
        car.model.toLowerCase().includes(filter) ||
        car.type.toLowerCase().includes(filter) ||
        (car.description && car.description.toLowerCase().includes(filter));
      return matchesType && matchesBrand && matchesKeyword;
    });
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
        <p>Type: ${car.type}</p>
        <p>Year: ${car.year}</p>
        <p>Mileage: ${car.mileage.toLocaleString()} km</p>
        <p>Fuel: ${car.fuel}</p>
        <p>Price per day: $${car.price}</p>
        <p>${car.description || ''}</p>
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

// Add real-time keyword suggestions and improved search
const searchInput = document.getElementById('search');

// Collect all possible keywords from car data
let allCars = [];
window.fetchAllCars(cars => {
  allCars = cars;
  // Initialize search keywords
  initSearchKeywords(cars);
});

function initSearchKeywords(cars) {
  // Create keyword set
  const keywords = new Set();
  cars.forEach(car => {
    keywords.add(car.make);
    keywords.add(car.model);
    keywords.add(car.type);
    if (car.description) {
      car.description.split(' ').forEach(word => {
        keywords.add(word);
      });
    }
  });
  // Sort keywords for better relevance
  const sortedKeywords = Array.from(keywords).sort((a, b) => b.length - a.length);
  window.searchKeywords = sortedKeywords;
}

// Create suggestion box
let suggestionBox = document.getElementById('suggestion-box');
if (!suggestionBox) {
  suggestionBox = document.createElement('ul');
  suggestionBox.id = 'suggestion-box';
  suggestionBox.style.position = 'absolute';
  suggestionBox.style.background = '#fff';
  suggestionBox.style.border = '1px solid #ccc';
  suggestionBox.style.zIndex = '10';
  suggestionBox.style.listStyle = 'none';
  suggestionBox.style.padding = '0';
  suggestionBox.style.margin = '0';
  suggestionBox.style.width = '100%';
  suggestionBox.style.maxHeight = '180px';
  suggestionBox.style.overflowY = 'auto';
  suggestionBox.style.display = 'none';
  searchInput.parentNode.appendChild(suggestionBox);
}

searchInput.addEventListener('input', function(e) {
  const value = e.target.value.toLowerCase();
  // Show suggestions
  if (value.length > 0) {
    const matches = window.searchKeywords.filter(k => k.toLowerCase().includes(value));
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

// On DOMContentLoaded, create filters and set up listeners
if (document.getElementById('car-filter')) {
  createFilters([]);
  setupFilterListeners();
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
