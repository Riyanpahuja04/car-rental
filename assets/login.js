document.getElementById('show-register').addEventListener('click', function(e) {
  e.preventDefault();
  document.getElementById('register-form').style.display = 'block';
});

// --- AJAX-based Login/Register ---
document.getElementById('login-form').addEventListener('submit', function(e) {
  e.preventDefault();
  const email = this.email.value;
  const password = this.password.value;
  fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  })
    .then(res => res.json())
    .then(result => {
      if (result.success) {
        localStorage.setItem('userLoggedIn', 'true');
        document.getElementById('login-success').style.display = 'block';
        this.reset();
        setTimeout(() => {
          window.location.href = 'booking.html';
        }, 1000);
      } else {
        alert('Invalid email or password.');
      }
    });
});

document.getElementById('register-form').addEventListener('submit', function(e) {
  e.preventDefault();
  const formData = {
    email: this.email.value,
    password: this.password.value,
    name: this.name.value,
    license: this.license.value,
    phone: this.phone.value
  };
  fetch('/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData)
  })
    .then(res => res.json())
    .then(user => {
      if (user.error) {
        alert(user.error);
        return;
      }
      localStorage.setItem('userLoggedIn', 'true');
      document.getElementById('register-success').style.display = 'block';
      this.reset();
      setTimeout(() => {
        window.location.href = 'booking.html';
      }, 1000);
    });
});
