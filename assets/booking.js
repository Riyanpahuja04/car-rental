// --- AJAX-based Booking Page (Refactored) ---
// Utility: Get VIN from query param or localStorage
function getVIN() {
  const urlParams = new URLSearchParams(window.location.search);
  let vin = urlParams.get('vin');
  if (!vin) vin = localStorage.getItem('lastCarVIN');
  return vin;
}
function setVIN(vin) {
  localStorage.setItem('lastCarVIN', vin);
}
function isUserLoggedIn() {
  return !!localStorage.getItem('userLoggedIn');
}
function saveReservationForm(data) {
  sessionStorage.setItem('reservationForm', JSON.stringify(data));
}
function loadReservationForm() {
  try {
    return JSON.parse(sessionStorage.getItem('reservationForm')) || {};
  } catch {
    return {};
  }
}
function clearReservationForm() {
  sessionStorage.removeItem('reservationForm');
}
function renderBookingPage() {
  const main = document.querySelector('main');
  main.innerHTML = '';
  if (!isUserLoggedIn()) {
    main.innerHTML = '<div class="reminder" style="text-align:center;margin:2rem auto;font-size:1.2rem;">You must be <a href="login.html" style="color:#003366;text-decoration:underline;">logged in</a> to make a reservation.</div>';
    return;
  }
  const vin = getVIN();
  if (!vin) {
    main.innerHTML = '<div class="reminder" style="text-align:center;margin:2rem auto;font-size:1.2rem;">Please choose a car from the car list before making a reservation.</div>';
    return;
  }
  fetch(`/api/cars/${vin}`)
    .then(res => res.ok ? res.json() : null)
    .then(car => {
      if (!car) {
        main.innerHTML = '<div class="reminder" style="text-align:center;margin:2rem auto;font-size:1.2rem;">Car not found. Please choose another car.</div>';
        return;
      }
      // Car details
      const carInfoDiv = document.createElement('div');
      carInfoDiv.id = 'car-info';
      carInfoDiv.style = 'max-width: 420px; margin: 2rem auto 1.5rem auto; background: #fff; border-radius: 12px; box-shadow: 0 2px 16px rgba(0,0,0,0.08); padding: 2rem 2rem 1.5rem 2rem;';
      carInfoDiv.innerHTML = `
        <h2 style="margin-bottom:1rem;text-align:center;color:#003366;">Car Details</h2>
        <img src="${car.image}" alt="${car.make} ${car.model}" style="max-width:340px;width:100%;border-radius:10px;display:block;margin:0 auto 1rem auto;box-shadow:0 2px 8px rgba(0,0,0,0.07);" />
        <ul style="list-style:none;padding:0;margin:0 0 0.5rem 0;font-size:1.05rem;line-height:1.7;">
          <li><strong>Make:</strong> ${car.make}</li>
          <li><strong>Model:</strong> ${car.model}</li>
          <li><strong>Type:</strong> ${car.type}</li>
          <li><strong>Year:</strong> ${car.year}</li>
          <li><strong>Mileage:</strong> ${car.mileage.toLocaleString()} km</li>
          <li><strong>Fuel:</strong> ${car.fuel}</li>
          <li><strong>Price per day:</strong> <span style="color:#007b3a;font-weight:bold;">$${car.price}</span></li>
          <li><strong>Description:</strong> ${car.description}</li>
          <li><strong>Availability:</strong> <span style="color:${car.available ? '#007b3a' : '#c00'};font-weight:bold;">${car.available ? 'Available' : 'Not Available'}</span></li>
        </ul>
      `;
      main.appendChild(carInfoDiv);
      if (!car.available) {
        main.innerHTML += '<div class="reminder" style="text-align:center;margin:2rem auto;font-size:1.2rem;color:red;">Sorry, this car is no longer available. Please choose another car.</div>';
        return;
      }
      // Reservation form
      const formDiv = document.createElement('form');
      formDiv.id = 'booking-form';
      formDiv.autocomplete = 'off';
      formDiv.style = 'max-width: 420px; margin: 0 auto 2.5rem auto; background: #f8fafc; border-radius: 12px; box-shadow: 0 2px 16px rgba(0,0,0,0.07); padding: 2rem 2rem 1.5rem 2rem; display: flex; flex-direction: column; gap: 1.1rem;';
      formDiv.innerHTML = `
        <h2 style="margin-bottom:0.5rem;text-align:center;color:#003366;">Reservation Form</h2>
        <div class="form-group"><label>Name<input type="text" name="name" required></label><span class="feedback"></span></div>
        <div class="form-group"><label>Phone<input type="tel" name="phone" required pattern="^\\d{8,15}$"></label><span class="feedback"></span></div>
        <div class="form-group"><label>Email<input type="email" name="email" required></label><span class="feedback"></span></div>
        <div class="form-group"><label>Driver's License<input type="text" name="license" required></label><span class="feedback"></span></div>
        <div class="form-group"><label>Start Date<input type="date" name="start" required min="${new Date().toISOString().split('T')[0]}"></label><span class="feedback"></span></div>
        <div class="form-group"><label>Rental Period (days)<input type="number" name="days" min="1" max="60" required></label><span class="feedback"></span></div>
        <div class="form-group total-price" style="display:none;text-align:center;font-size:1.1rem;font-weight:bold;color:#007b3a;"></div>
        <div style="display:flex;gap:1rem;justify-content:center;margin-top:0.5rem;">
          <button type="submit" class="cta" id="submit-btn" disabled style="background:#003366;color:#fff;font-weight:bold;padding:0.7rem 2.2rem;border-radius:6px;font-size:1.1rem;">Submit</button>
          <button type="button" class="cta" id="cancel-btn" style="background:#eee;color:#222;font-weight:bold;padding:0.7rem 2.2rem;border-radius:6px;font-size:1.1rem;">Cancel</button>
        </div>
      `;
      // Style form fields
      setTimeout(() => {
        formDiv.querySelectorAll('input').forEach(input => {
          input.style = 'width:100%;margin-top:0.3rem;padding:0.5rem 0.7rem;border-radius:5px;border:1px solid #b5c2d6;font-size:1rem;background:#fff;';
        });
        formDiv.querySelectorAll('label').forEach(label => {
          label.style = 'display:flex;flex-direction:column;font-weight:500;color:#003366;gap:0.1rem;';
        });
        formDiv.querySelectorAll('.form-group').forEach(g => {
          g.style = 'margin-bottom:0.2rem;';
        });
        formDiv.querySelectorAll('.feedback').forEach(fb => {
          fb.style = 'color:#c00;font-size:0.95rem;margin-top:0.1rem;min-height:1.1em;';
        });
      }, 0);
      main.appendChild(formDiv);
      // Prefill form if data exists
      const prev = loadReservationForm();
      Array.from(formDiv.elements).forEach(el => {
        if (el.name && prev[el.name]) el.value = prev[el.name];
      });
      // Validation
      const feedbacks = formDiv.querySelectorAll('.feedback');
      const totalPriceDiv = formDiv.querySelector('.total-price');
      function validate() {
        let valid = true;
        let data = {};
        Array.from(formDiv.elements).forEach((el, i) => {
          if (!el.name) return;
          let msg = '';
          if (el.required && !el.value) {
            valid = false;
            msg = 'Required';
          }
          if (el.name === 'phone' && el.value && !/^\d{8,15}$/.test(el.value)) {
            valid = false;
            msg = 'Invalid phone';
          }
          if (el.name === 'email' && el.value && !/^[^@]+@[^@]+\.[^@]+$/.test(el.value)) {
            valid = false;
            msg = 'Invalid email';
          }
          if (el.name === 'days' && el.value && (el.value < 1 || el.value > 60)) {
            valid = false;
            msg = '1-60 days';
          }
          feedbacks[i].textContent = msg;
          data[el.name] = el.value;
        });
        // Show total price
        if (data.days && !isNaN(data.days)) {
          totalPriceDiv.style.display = 'block';
          totalPriceDiv.textContent = `Total Price: $${car.price * Number(data.days)}`;
        } else {
          totalPriceDiv.style.display = 'none';
        }
        saveReservationForm(data);
        formDiv.querySelector('#submit-btn').disabled = !valid;
        return valid;
      }
      formDiv.addEventListener('input', validate);
      validate();
      // Cancel button
      formDiv.querySelector('#cancel-btn').addEventListener('click', function() {
        clearReservationForm();
        window.location.href = 'index.html';
      });
      // Submit booking
      formDiv.addEventListener('submit', function(e) {
        e.preventDefault();
        if (!validate()) return;
        const formData = {};
        Array.from(formDiv.elements).forEach(el => {
          if (el.name) formData[el.name] = el.value;
        });
        formData.vin = car.vin;
        formData.user = formData.email;
        fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        })
          .then(res => res.json())
          .then(order => {
            if (order.error) {
              alert(order.error);
              return;
            }
            clearReservationForm();
            main.innerHTML = `<div class="confirmation" style="text-align:center;margin:2rem auto;">
              <h2>Order Placed!</h2>
              <p>Your order is pending. Please <a href="#" id="confirm-link">click here to confirm your order</a>.</p>
              <p>Order ID: ${order.orderId}</p>
            </div>`;
            document.getElementById('confirm-link').addEventListener('click', function(e) {
              e.preventDefault();
              fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...order, status: 'confirmed' })
              })
                .then(res => res.json())
                .then(updated => {
                  main.innerHTML = `<div class="confirmation" style="text-align:center;margin:2rem auto;">
                    <h2>Order Confirmed!</h2>
                    <p>Your booking is confirmed. Thank you!</p>
                    <a href="index.html" class="cta">Back to Home</a>
                  </div>`;
                });
            });
          });
      });
    });
}
document.addEventListener('DOMContentLoaded', renderBookingPage);
window.addEventListener('beforeunload', function() {
  const form = document.getElementById('booking-form');
  if (form) {
    let data = {};
    Array.from(form.elements).forEach(el => {
      if (el.name) data[el.name] = el.value;
    });
    saveReservationForm(data);
  }
});
