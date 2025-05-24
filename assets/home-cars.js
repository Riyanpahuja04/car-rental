// home-cars.js: Render car grid on homepage and handle reservation icon
// Reuse the same car data as cars.js

// --- AJAX-based Home Car Grid ---
function fetchHomeCars(callback) {
  fetch('/api/cars')
    .then(res => res.json())
    .then(cars => callback(cars))
    .catch(() => callback([]));
}

function renderHomeCarsAJAX(filter = '') {
  fetchHomeCars(function(homeCars) {
    const { type, brand } = getHomeFilterValues();
    const list = document.getElementById('car-list');
    if (!list) return;
    list.innerHTML = '';
    const filtered = homeCars.filter(car => {
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

// Update filter and search logic to always use window.carRentalCars
function createHomeFilters() {
  fetchHomeCars(function(homeCars) {
    const carTypes = Array.from(new Set(homeCars.map(car => car.type))).filter(Boolean);
    const carBrands = Array.from(new Set(homeCars.map(car => car.make))).filter(Boolean);
    const filterDiv = document.createElement('div');
    filterDiv.id = 'car-filter';
    // Type filter
    const typeLabel = document.createElement('label');
    typeLabel.textContent = 'Type:';
    typeLabel.setAttribute('for', 'type-filter-home');
    typeLabel.style.marginRight = '0.5rem';
    const typeSelect = document.createElement('select');
    typeSelect.id = 'type-filter-home';
    typeSelect.innerHTML = '<option value="">All</option>' + carTypes.map(t => `<option value="${t}">${t}</option>`).join('');
    typeSelect.style.marginRight = '1rem';
    // Brand filter
    const brandLabel = document.createElement('label');
    brandLabel.textContent = 'Brand:';
    brandLabel.setAttribute('for', 'brand-filter-home');
    brandLabel.style.marginRight = '0.5rem';
    const brandSelect = document.createElement('select');
    brandSelect.id = 'brand-filter-home';
    brandSelect.innerHTML = '<option value="">All</option>' + carBrands.map(b => `<option value="${b}">${b}</option>`).join('');
    // Add to filterDiv
    filterDiv.appendChild(typeLabel);
    filterDiv.appendChild(typeSelect);
    filterDiv.appendChild(brandLabel);
    filterDiv.appendChild(brandSelect);
    // Insert above car grid
    const gridSection = document.getElementById('car-list-home');
    if (gridSection) gridSection.insertBefore(filterDiv, gridSection.querySelector('h2').nextSibling);
  });
}

function getHomeFilterValues() {
  const type = document.getElementById('type-filter-home')?.value || '';
  const brand = document.getElementById('brand-filter-home')?.value || '';
  return { type, brand };
}

function setupHomeFilterListeners() {
  document.getElementById('type-filter-home')?.addEventListener('change', function() {
    renderHomeCarsAJAX(document.getElementById('search-home')?.value?.toLowerCase() || '');
  });
  document.getElementById('brand-filter-home')?.addEventListener('change', function() {
    renderHomeCarsAJAX(document.getElementById('search-home')?.value?.toLowerCase() || '');
  });
}

function createHomeSearchBox() {
  fetchHomeCars(function(homeCars) {
    const filterDiv = document.getElementById('car-filter');
    if (!filterDiv) return;
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.id = 'search-home';
    searchInput.placeholder = 'Search by make, model, type, or description...';
    searchInput.setAttribute('aria-label', 'Search cars');
    searchInput.style.marginRight = '1rem';
    filterDiv.insertBefore(searchInput, filterDiv.firstChild);
    // Suggestions
    const keywords = Array.from(new Set(homeCars.flatMap(car => [
      car.make,
      car.model,
      car.type,
      car.description || ''
    ]))).filter(Boolean);
    let suggestionBox = document.createElement('ul');
    suggestionBox.id = 'suggestion-box-home';
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
    filterDiv.appendChild(suggestionBox);
    searchInput.addEventListener('input', function(e) {
      const value = e.target.value.toLowerCase();
      if (value.length > 0) {
        const matches = keywords.filter(k => k.toLowerCase().includes(value));
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
            renderHomeCarsAJAX(match.toLowerCase());
          });
          li.addEventListener('keydown', function(ev) {
            if (ev.key === 'Enter') {
              searchInput.value = match;
              suggestionBox.style.display = 'none';
              renderHomeCarsAJAX(match.toLowerCase());
            }
          });
          suggestionBox.appendChild(li);
        });
        suggestionBox.style.display = matches.length ? 'block' : 'none';
      } else {
        suggestionBox.style.display = 'none';
      }
      renderHomeCarsAJAX(value);
    });
    window.addEventListener('mousedown', function(e) {
      if (!searchInput.contains(e.target) && !suggestionBox.contains(e.target)) {
        suggestionBox.style.display = 'none';
      }
    });
  });
}

// Remove DOMContentLoaded check so filters/search/grid always render
createHomeFilters();
setTimeout(createHomeSearchBox, 250); // Wait for filters to render
setTimeout(setupHomeFilterListeners, 500); // Wait for filters to render
renderHomeCarsAJAX();

const reservationIcon = document.getElementById('reservation-icon');
if (reservationIcon) {
  reservationIcon.addEventListener('click', () => {
    window.location.href = 'booking.html';
  });
}

// Save last selected car VIN on rent button click (for booking page)
document.addEventListener('click', function(e) {
  if (e.target.classList.contains('rent-btn')) {
    const url = new URL(e.target.href, window.location.origin);
    const vin = url.searchParams.get('vin');
    if (vin) localStorage.setItem('lastCarVIN', vin);
  }
});
