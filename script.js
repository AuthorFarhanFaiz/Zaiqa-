// Sticky header shrink on scroll
var siteHeader = document.querySelector('.site-header');
window.addEventListener('scroll', function () {
  if (window.scrollY > 40) siteHeader.classList.add('scrolled');
  else siteHeader.classList.remove('scrolled');
}, { passive: true });

// Scroll-reveal animations
if ('IntersectionObserver' in window) {
  var revealObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });
  document.querySelectorAll('[data-reveal]').forEach(function (el) { revealObserver.observe(el); });
} else {
  document.querySelectorAll('[data-reveal]').forEach(function (el) { el.classList.add('in-view'); });
}

// Gallery/menu images populate after load — re-scan for any missed reveal targets
setTimeout(function () {
  document.querySelectorAll('[data-reveal]:not(.in-view)').forEach(function (el) {
    var rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight) el.classList.add('in-view');
  });
}, 300);

document.getElementById('year').textContent = new Date().getFullYear();

// Mobile nav toggle
var navToggle = document.getElementById('navToggle');
var mainNav = document.getElementById('mainNav');
navToggle.addEventListener('click', function () {
  mainNav.classList.toggle('open');
});
mainNav.querySelectorAll('a').forEach(function (a) {
  a.addEventListener('click', function () { mainNav.classList.remove('open'); });
});

// Gallery images (real branch photography)
var galleryImages = [
  { src: 'images/hero-entrance.webp', alt: 'Bahawalpur — front entrance', cls: 'tall' },
  { src: 'images/bahawalpur-1.jpg', alt: 'Bahawalpur — reception' },
  { src: 'images/bahawalpur-3.jpg', alt: 'Bahawalpur — dining corridor' },
  { src: 'images/outdoor-dining.webp', alt: 'Outdoor family dining' },
  { src: 'images/mirpur-exterior.jpg', alt: 'Mirpur Mathelo — exterior', cls: 'tall' },
  { src: 'images/mirpur-interior.jpg', alt: 'Mirpur Mathelo — dining hall' },
  { src: 'images/buffet-spread.jpg', alt: 'Buffet spread' },
  { src: 'images/qaswa-exterior-night.jpg', alt: 'Qaswa Cafe — night view' }
];

var galleryGrid = document.getElementById('galleryGrid');
galleryImages.forEach(function (img) {
  var el = document.createElement('img');
  el.src = img.src;
  el.alt = img.alt;
  el.loading = 'lazy';
  if (img.cls) el.className = img.cls;
  el.addEventListener('click', function () { openLightbox(img.src, img.alt); });
  galleryGrid.appendChild(el);
});

// Menu scans, grouped by branch
var menuSets = [
  { branch: 'Bahawalpur', prefix: 'menu/bwp-', pages: [101,102,103,104,105,106,107,108,109,110,111] },
  { branch: 'Sadiqabad', prefix: 'menu/sdk-', pages: [201,202,203,204,205,206,207,208] },
  { branch: 'Daharki', prefix: 'menu/dhk-', pages: [301,302,303,304,305,306,307,308] },
  { branch: 'Mirpur Mathelo', prefix: 'menu/mpm-', pages: [401,402,403,404,405,406,407,408] },
  { branch: 'Qaswa Cafe', prefix: 'menu/qaswa-', pages: [501,502,503,504,505,506,507,508,509,510] }
];

var menuScans = document.getElementById('menuScans');
menuSets.forEach(function (set) {
  set.pages.forEach(function (n) {
    var src = set.prefix + n + '.jpg';
    var el = document.createElement('img');
    el.src = src;
    el.alt = set.branch + ' menu page';
    el.loading = 'lazy';
    el.title = set.branch;
    el.addEventListener('click', function () { openLightbox(src, set.branch + ' menu'); });
    menuScans.appendChild(el);
  });
});

// Lightbox
var lightbox = document.getElementById('lightbox');
var lightboxImg = document.getElementById('lightboxImg');
var lightboxClose = document.getElementById('lightboxClose');

function openLightbox(src, alt) {
  lightboxImg.src = src;
  lightboxImg.alt = alt || '';
  lightbox.classList.add('open');
}
function closeLightbox() {
  lightbox.classList.remove('open');
  lightboxImg.src = '';
}
lightboxClose.addEventListener('click', closeLightbox);
lightbox.addEventListener('click', function (e) { if (e.target === lightbox) closeLightbox(); });
/* =========================================================
   WHATSAPP — floating button + per-branch numbers for
   order handoff (very common, zero-cost pattern in Pakistan —
   no paid WhatsApp Business API needed).
========================================================= */
var BRANCH_WHATSAPP = {
  'Bahawalpur': '923000968408',
  'Sadiqabad': '923008674949',
  'Daharki': '923028674949',
  'Mirpur Mathelo': '923058674949',
  'Qaswa Cafe': '923251110103'
};
var DEFAULT_WHATSAPP = '923008674949'; // Sadiqabad — main highway branch

document.getElementById('waFloat').href = 'https://wa.me/' + DEFAULT_WHATSAPP +
  '?text=' + encodeURIComponent('Hi Zaiqa Restaurant, I have a question.');

/* =========================================================
   PAYMENT — 50% advance note toggling
========================================================= */
document.getElementById('paymentMethod').addEventListener('change', function () {
  var isAdvance = this.value !== 'cod';
  document.getElementById('advanceNote').style.display = isAdvance ? 'block' : 'none';
  document.getElementById('txnRefWrap').style.display = isAdvance ? 'flex' : 'none';
});

/* =========================================================
   LOCATION — manual address + optional GPS cross-check.
   Browser geolocation can be wildly inaccurate (network/IP-based
   fallback instead of real GPS — common on desktops, VPNs, or
   when "precise location" permission isn't granted). We can't
   fix the device's own accuracy from website code, but we CAN
   detect a mismatch and ask the customer to confirm instead of
   silently trusting bad coordinates.
========================================================= */
var geoLat = null, geoLng = null;
document.getElementById('useLocationBtn').addEventListener('click', function () {
  var msg = document.getElementById('locationMsg');
  msg.textContent = 'Getting your location…'; msg.className = 'form-msg';
  if (!navigator.geolocation) { msg.textContent = 'Your browser does not support location detection — please type your address.'; msg.className = 'form-msg error'; return; }

  navigator.geolocation.getCurrentPosition(function (pos) {
    geoLat = pos.coords.latitude; geoLng = pos.coords.longitude;
    document.getElementById('latField').value = geoLat;
    document.getElementById('lngField').value = geoLng;
    var accuracy = Math.round(pos.coords.accuracy);

    fetch('https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=' + geoLat + '&lon=' + geoLng)
      .then(function (r) { return r.json(); })
      .then(function (data) {
        var detected = data.display_name || '';
        var addressField = document.getElementById('addressField');
        var typed = addressField.value.trim();

        var knownAreas = ['bahawalpur', 'sadiqabad', 'daharki', 'mirpur mathelo', 'ghotki', 'rahim yar khan', 'sukkur'];
        var typedLower = typed.toLowerCase();
        var detectedLower = detected.toLowerCase();
        var typedArea = knownAreas.find(function (a) { return typedLower.indexOf(a) !== -1; });
        var detectedArea = knownAreas.find(function (a) { return detectedLower.indexOf(a) !== -1; });

        if (typed && typedArea && detectedArea && typedArea !== detectedArea) {
          // Mismatch — ask once, don't silently override.
          var useDetected = confirm(
            'Heads up: the address you typed mentions "' + typedArea + '", but your device\'s current ' +
            'location looks like "' + detectedArea + '" (accuracy ~' + accuracy + 'm).\n\n' +
            'Press OK to use the detected location instead, or Cancel to keep what you typed.'
          );
          if (useDetected) { addressField.value = detected; }
          msg.textContent = 'Location checked — mismatch resolved.'; msg.className = 'form-msg warn';
        } else if (!typed) {
          addressField.value = detected;
          msg.textContent = 'Detected address filled in (accuracy ~' + accuracy + 'm). Please check it\'s correct before submitting.';
          msg.className = 'form-msg success';
        } else {
          msg.textContent = 'Location matches what you typed (accuracy ~' + accuracy + 'm).';
          msg.className = 'form-msg success';
        }

        if (accuracy > 2000) {
          msg.textContent += ' Note: accuracy is low (' + Math.round(accuracy/1000) + 'km) — please double check the address manually, GPS can be unreliable indoors or on desktop.';
          msg.className = 'form-msg warn';
        }
      })
      .catch(function () {
        msg.textContent = 'Got your coordinates but could not look up the address name. Please make sure your typed address is correct.';
        msg.className = 'form-msg warn';
      });
  }, function (err) {
    msg.textContent = 'Could not get your location (' + err.message + '). Please type your address manually — that always works.';
    msg.className = 'form-msg error';
  }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 });
});

document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeLightbox(); });

/* =========================================================
   CART  (persisted in this browser via localStorage — real
   browser storage is fine here, this is a live website, not
   a Claude artifact.)
========================================================= */
var CART_KEY = 'zaiqa_cart_v1';
function getCart() { try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; } catch (e) { return []; } }
function saveCart(cart) { localStorage.setItem(CART_KEY, JSON.stringify(cart)); renderCart(); }
function addToCart(name) {
  var cart = getCart();
  var existing = cart.find(function (i) { return i.name === name; });
  if (existing) existing.qty += 1; else cart.push({ name: name, qty: 1 });
  saveCart(cart);
  openCart();
}
function updateQty(name, delta) {
  var cart = getCart();
  var item = cart.find(function (i) { return i.name === name; });
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) cart = cart.filter(function (i) { return i.name !== name; });
  saveCart(cart);
}
function removeFromCart(name) {
  saveCart(getCart().filter(function (i) { return i.name !== name; }));
}

function renderCart() {
  var cart = getCart();
  var count = cart.reduce(function (sum, i) { return sum + i.qty; }, 0);
  document.getElementById('cartCount').textContent = count;
  var wrap = document.getElementById('cartItems');
  wrap.innerHTML = '';
  if (cart.length === 0) {
    wrap.innerHTML = '<p class="cart-empty">Your cart is empty. Tap "+ Add" on any dish above.</p>';
    return;
  }
  cart.forEach(function (item) {
    var line = document.createElement('div');
    line.className = 'cart-line';
    line.innerHTML =
      '<span class="cart-line-name">' + escapeHtmlClient(item.name) + '</span>' +
      '<div class="cart-qty">' +
      '<button data-action="dec">−</button><span>' + item.qty + '</span><button data-action="inc">+</button>' +
      '</div><button class="cart-remove">Remove</button>';
    line.querySelector('[data-action="dec"]').addEventListener('click', function () { updateQty(item.name, -1); });
    line.querySelector('[data-action="inc"]').addEventListener('click', function () { updateQty(item.name, 1); });
    line.querySelector('.cart-remove').addEventListener('click', function () { removeFromCart(item.name); });
    wrap.appendChild(line);
  });
}
function escapeHtmlClient(s) {
  var d = document.createElement('div'); d.textContent = s; return d.innerHTML;
}

document.querySelectorAll('.add-btn').forEach(function (btn) {
  btn.addEventListener('click', function () { addToCart(btn.dataset.dish); });
});
document.getElementById('addOtherBtn').addEventListener('click', function () { addToCart('Other item — see notes'); });

var cartDrawer = document.getElementById('cartDrawer');
var drawerScrim = document.getElementById('drawerScrim');
function openCart() { cartDrawer.classList.add('open'); drawerScrim.classList.add('open'); }
function closeCart() { cartDrawer.classList.remove('open'); drawerScrim.classList.remove('open'); }
document.getElementById('cartToggle').addEventListener('click', openCart);
document.getElementById('cartClose').addEventListener('click', closeCart);
drawerScrim.addEventListener('click', closeCart);

renderCart();

/* =========================================================
   AUTH  (Login / Signup) — talks to /api/login, /api/signup,
   /api/me, /api/logout (Cloudflare Pages Functions).
========================================================= */
var authModal = document.getElementById('authModal');
var accountLink = document.getElementById('accountLink');
var currentUser = null;

function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }
document.querySelectorAll('[data-close]').forEach(function (btn) {
  btn.addEventListener('click', function () { closeModal(btn.dataset.close); });
});
document.querySelectorAll('.modal').forEach(function (m) {
  m.addEventListener('click', function (e) { if (e.target === m) m.classList.remove('open'); });
});

accountLink.addEventListener('click', function (e) {
  e.preventDefault();
  if (currentUser) { window.location.href = '#'; showAccountMenu(); }
  else openModal('authModal');
});

function showAccountMenu() {
  if (confirm('Logged in as ' + currentUser.name + '. Log out?')) {
    fetch('/api/logout', { method: 'POST', credentials: 'include' }).then(function () {
      currentUser = null;
      accountLink.textContent = 'Login';
    });
  }
}

document.querySelectorAll('.auth-tab').forEach(function (tab) {
  tab.addEventListener('click', function () {
    document.querySelectorAll('.auth-tab').forEach(function (t) { t.classList.remove('active'); });
    document.querySelectorAll('.auth-form').forEach(function (f) { f.classList.remove('active'); });
    tab.classList.add('active');
    document.getElementById(tab.dataset.tab + 'Form').classList.add('active');
  });
});

function checkSession() {
  fetch('/api/me', { credentials: 'include' })
    .then(function (r) { return r.json(); })
    .then(function (data) {
      if (data.loggedIn) { currentUser = data; accountLink.textContent = data.name.split(' ')[0]; }
    })
    .catch(function () {});
}
checkSession();

document.getElementById('loginForm').addEventListener('submit', function (e) {
  e.preventDefault();
  var msg = document.getElementById('loginMsg');
  msg.textContent = ''; msg.className = 'form-msg';
  var fd = new FormData(e.target);
  fetch('/api/login', {
    method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: fd.get('email'), password: fd.get('password'), website: fd.get('website') })
  }).then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
    .then(function (res) {
      if (!res.ok) { msg.textContent = res.d.error || 'Login failed.'; msg.className = 'form-msg error'; return; }
      currentUser = { name: res.d.name };
      accountLink.textContent = res.d.name.split(' ')[0];
      msg.textContent = 'Welcome back!'; msg.className = 'form-msg success';
      setTimeout(function () { closeModal('authModal'); }, 600);
    }).catch(function () { msg.textContent = 'Network error. Please try again.'; msg.className = 'form-msg error'; });
});

document.getElementById('signupForm').addEventListener('submit', function (e) {
  e.preventDefault();
  var msg = document.getElementById('signupMsg');
  msg.textContent = ''; msg.className = 'form-msg';
  var fd = new FormData(e.target);
  fetch('/api/signup', {
    method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: fd.get('name'), email: fd.get('email'), phone: fd.get('phone'),
      password: fd.get('password'), website: fd.get('website')
    })
  }).then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
    .then(function (res) {
      if (!res.ok) { msg.textContent = res.d.error || 'Signup failed.'; msg.className = 'form-msg error'; return; }
      msg.textContent = 'Account created! You can log in now.'; msg.className = 'form-msg success';
      setTimeout(function () {
        document.querySelector('.auth-tab[data-tab="login"]').click();
      }, 800);
    }).catch(function () { msg.textContent = 'Network error. Please try again.'; msg.className = 'form-msg error'; });
});

/* =========================================================
   CHECKOUT — /api/orders
========================================================= */
var checkoutModal = document.getElementById('checkoutModal');
document.getElementById('checkoutBtn').addEventListener('click', function () {
  if (getCart().length === 0) { alert('Your cart is empty — add a dish first.'); return; }
  closeCart();
  openModal('checkoutModal');
});

document.getElementById('checkoutForm').addEventListener('submit', function (e) {
  e.preventDefault();
  var msg = document.getElementById('checkoutMsg');
  msg.textContent = ''; msg.className = 'form-msg';
  var fd = new FormData(e.target);
  var branch = fd.get('branch');
  var lat = fd.get('lat'), lng = fd.get('lng');
  var payload = {
    branch: branch, name: fd.get('name'), phone: fd.get('phone'),
    address: fd.get('address'), notes: fd.get('notes'),
    payment_method: fd.get('payment_method'), transaction_ref: fd.get('transaction_ref'),
    advance_percent: fd.get('payment_method') === 'cod' ? 0 : 50,
    lat: lat ? Number(lat) : null, lng: lng ? Number(lng) : null,
    website: fd.get('website'), items: getCart()
  };
  var submitBtn = e.target.querySelector('button[type=submit]');
  submitBtn.disabled = true; submitBtn.textContent = 'Placing order…';

  fetch('/api/orders', {
    method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }).then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
    .then(function (res) {
      submitBtn.disabled = false; submitBtn.textContent = 'Place Order';
      if (!res.ok) { msg.textContent = res.d.error || 'Could not place order.'; msg.className = 'form-msg error'; return; }

      var itemsText = payload.items.map(function (i) { return i.qty + 'x ' + i.name; }).join(', ');
      var waNumber = BRANCH_WHATSAPP[branch] || DEFAULT_WHATSAPP;
      var waText = 'New order ' + res.d.orderId + ' — ' + payload.name + ' (' + payload.phone + ')\n' +
        'Items: ' + itemsText + '\nAddress: ' + payload.address +
        (payload.notes ? '\nNotes: ' + payload.notes : '') +
        '\nPayment: ' + payload.payment_method + (payload.advance_percent ? ' (50% advance)' : '');
      var waLink = 'https://wa.me/' + waNumber + '?text=' + encodeURIComponent(waText);

      e.target.style.display = 'none';
      var box = document.getElementById('orderSuccessBox');
      box.style.display = 'block';
      box.innerHTML =
        '<div class="order-success"><h4>Order placed ✓</h4>' +
        '<p>Reference: <strong>' + res.d.orderId + '</strong>. Our staff will call you shortly to confirm the total' +
        (payload.advance_percent ? ' and the 50% advance payment details' : '') + '.</p>' +
        '<a class="btn btn-primary" href="' + waLink + '" target="_blank" rel="noopener">Send order details on WhatsApp too →</a></div>';

      localStorage.removeItem(CART_KEY);
      renderCart();
    }).catch(function () {
      submitBtn.disabled = false; submitBtn.textContent = 'Place Order';
      msg.textContent = 'Network error. Please try again, or tap the WhatsApp button to order directly.';
      msg.className = 'form-msg error';
    });
});

document.querySelectorAll('[data-close="checkoutModal"]').forEach(function (btn) {
  btn.addEventListener('click', function () {
    var form = document.getElementById('checkoutForm');
    form.style.display = 'flex';
    document.getElementById('orderSuccessBox').style.display = 'none';
  });
});
