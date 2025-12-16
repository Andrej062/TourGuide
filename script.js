// === ADMIN ACCESS (temporarily) ===

let isAdmin = false;

document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.shiftKey && e.key === 'A') {
    const code = prompt("Enter admin code:");
    if (code === "tourguide") {
      isAdmin = true;
      alert("Admin mode enabled");
      if (currentTourKey) renderComments(currentTourKey);
    } else {
      alert("Wrong code");
    }
  }
});

let cart = JSON.parse(localStorage.getItem('cart')) || [];

const TOUR_DETAILS = {
  trollskogen: {
    title: "Trip to “Trollskogen” at Fløyen",
    img: "pics/ulriken.jpg",
    text: `
      Join us on a trip to Mount Fløyen,
      one of Bergen’s most famous attractions.
      At the top, you’ll find a mysterious troll forest
      — the perfect spot for taking photos.

      Discover the magical Troll Forest on Mount Fløyen.
      The tour includes a scenic ride to the top, historical stories,
      beautiful viewpoints, and guided exploration of local folklore.
      Perfect for families and photography lovers!
      
      Here, you’ll also get to learn about
      Norwegian folklore, including tales
      of trolls and other traditional myths.

    `
  },
  cinnamunBun: {
    title: "Cinnamun Bun Tour",
    img: "pics/fløyen.jpg",
    text: `
      Scandinavia is famous for its delicious sweet buns — and here in Bergen, 
      we take great pride in ours! Join our bun tour, where we visit several 
      authentic cafés to taste real Norwegian buns. Warm, fresh, and traditional, 
      packed with butter and sugar — just the way they should be.

      Visit several cozy local cafés, learn about traditional baking,
      and experience Bergen’s sweet culture firsthand.

    `
  },
  shopTour: {
    title: "Shop Tour – Fretex, Episode, Vintage Kid, UFF, Apollo, Slit`an Vintage (and more!)",
    img: "pics/nordnesparken.jpg",
    text: `
      Get ready for the ultimate shopping adventure in Bergen, 
      The best of the best! Join us on a walk through the city’s trendiest streets, 
      where we visit some of the best vintage and second-hand stores — from Fretex,
      Vintage Kid and Episode, to Apollo Bella Donna, MAGNUSSENS BRUKT OG ANTIKVITETSHANDEL and more!!

      Discover unique treasures, retro fashion, and one-of-a-kind finds while exploring the colorful streets of Bergen.
      Between the shops, we’ll stop by cozy corners and scenic spots perfect for photos — 
      making this tour a great mix of style, sustainability, and sightseeing.
      Perfect for fashion lovers, thrifters, and anyone who wants to experience Bergen in a fun and creative way!

    `
  },
  brownCheese: {
    title: "Brown Cheese Tour",
    img: "pics/sentrum.jpg",
    text: `
      Taste the world-famous brown cheese right in the heart of Bergen!
      We’ll take you on a short walk through charming streets and narrow alleys,
      where you’ll get to try brown cheese ice cream, brown cheese chocolate, and of course, 
      brown cheese buns! On this tour, you’ll discover some of Bergen’s hidden gems, 
      with plenty of opportunities for great photos, while enjoying delicious desserts 
      made from the iconic Norwegian brown cheese.
    `
  },
  streetArt: {
    title: "Bryggen & Fish Market Tour",
    img: "pics/bryggen.jpg",
    text: `
      Join us on a colorful and inspiring guided tour through the streets of Bergen, 
      where we explore the city's unique street art! Experience how international and local artists have transformed walls, 
      alleys and buildings into living works of art - all with exciting stories and hidden messages. 

      The guide will take you to famous works and hidden gems, and give you insight into both the art and culture that 
      characterize Bergen's urban landscape. Perfect for art lovers, photographers and curious souls!
    `
  },
  instagramTour: {
    title: "Bergen Aquarium Tour",
    img: "pics/bergen.jpg",
    text: `
      Experience the best Instagram spots with us! 
      Join us on a tour of the most popular and hidden Instagram spots in Bergen city. 
      We go to the most charming and unique places in Bergen.
    `
  }
};

// ===== TOUR MODAL =====
const tourModal = document.getElementById("tour-modal");
const closeTour = document.getElementById("close-tour");
const modalTitle = document.getElementById("tour-modal-title");
const modalImage = document.getElementById("tour-modal-image");
const modalText = document.getElementById("tour-modal-text");
const modalOrder = document.getElementById("tour-modal-order");

if (tourModal && closeTour && modalTitle && modalImage && modalText && modalOrder) {
  document.querySelectorAll(".gallery-item").forEach(item => {
    item.addEventListener("click", (e) => {
      if (e.target.closest(".button") || e.target.closest(".feedback-btn")) return;

      const infoBlock = item.querySelector(".tour-info");
      const tourId = infoBlock?.querySelector(".feedback-btn")?.dataset.tour;

      if (!tourId || !TOUR_DETAILS[tourId]) return;

      const t = TOUR_DETAILS[tourId];
      modalTitle.textContent = t.title;
      modalImage.src = t.img;
      modalText.textContent = t.text.trim();
      modalOrder.onclick = () => addToCart(t.title, t.text.trim());

      tourModal.style.display = "flex";
    });
  });

  closeTour.addEventListener("click", () => {
    tourModal.style.display = "none";
  });

  window.addEventListener("click", (e) => {
    if (e.target === tourModal) tourModal.style.display = "none";
  });
}

//  ===== CART MODAL =====

const cartIcon = document.getElementById('cart-icon');
const cartCount = document.getElementById('cart-count');
const cartModal = document.getElementById('cart-modal');
const closeCart = document.getElementById('close-cart');
const cartItemsList = document.getElementById('cart-items');
const checkoutBtn = document.getElementById('checkout-btn');

if (cartIcon) {
  cartIcon.addEventListener('click', () => {
    cartModal.style.display = 'block';
  });
}

if (closeCart) {
  closeCart.addEventListener('click', () => {
    cartModal.style.display = 'none';
  });
}

window.addEventListener('click', (e) => {
  if (e.target === cartModal) cartModal.style.display = 'none';
});

document.querySelectorAll('.gallery .gallery-item .tour-info .button:not(.feedback-btn)')
  .forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const tourInfo = e.target.closest('.tour-info');
      if (!tourInfo) return;
      const name = tourInfo.querySelector('h3')?.textContent?.trim() || 'Tour';
      const desc = tourInfo.querySelector('p')?.textContent?.trim() || '';
      cart.push({ name, desc });
      updateCart();
      alert(`"${name}" added to your cart!`);
    });
  });

function updateCart() {
  cartItemsList.innerHTML = '';
  cart.forEach((item, index) => {
    const li = document.createElement('li');
    li.innerHTML = `
      ${item.name}
      <button class="button remove-btn" onclick="removeItem(${index})">Remove</button>
    `;
    cartItemsList.appendChild(li);
  });
  cartCount.textContent = cart.length;

  localStorage.setItem('cart', JSON.stringify(cart));
}

function addToCart(name, desc = "") {
  cart.push({ name, desc });
  updateCart();
  alert(`"${name}" added to your cart!`);
}

updateCart();

function removeItem(index) {
  cart.splice(index, 1);
  updateCart();
}

if (checkoutBtn) {
  checkoutBtn.addEventListener('click', () => {
    if (cart.length === 0) {
      alert('Your cart is empty!');
      return;
    }
    localStorage.setItem('cart', JSON.stringify(cart));
    window.location.href = 'cart.html';
  });
}

// === Modal Openning ===

const contactBtn = document.getElementById('contact-link');
const contactBtnFooter = document.getElementById('ContactFooter');
const contactModal = document.getElementById('contact-modal');
const closeContact = document.getElementById('close-contact');

  function openContactModal(e) {
    e.preventDefault();
    contactModal.style.display = 'flex';
  }

  if (contactBtn) contactBtn.addEventListener('click', openContactModal);
  if (contactBtnFooter) contactBtnFooter.addEventListener('click', openContactModal);

  if (closeContact) {
    closeContact.addEventListener('click', () => {
      contactModal.style.display = 'none';
    });
  }

  window.addEventListener('click', (e) => {
    if (e.target === contactModal) contactModal.style.display = 'none';
  });

  const applyBtn = document.getElementById('apply-btn');
  const applyModal = document.getElementById('apply-modal');
  const closeApply = document.getElementById('close-apply');

  if (applyBtn && applyModal && closeApply) {
    applyBtn.addEventListener('click', (e) => {
      e.preventDefault();
      applyModal.style.display = 'flex';
    });

    closeApply.addEventListener('click', () => {
      applyModal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
      if (e.target === applyModal) applyModal.style.display = 'none';
    });
  }

const menuToggle = document.getElementById('menu-toggle');
const navLeft = document.querySelector('.nav-left');
const navRight = document.querySelector('.nav-right');

if (menuToggle) {
  menuToggle.addEventListener('click', () => {
    menuToggle.classList.toggle('active');
    navLeft.classList.toggle('show');
    navRight.classList.toggle('show');
  });
}

// ==== TOUR SEARCH SCROLL + HIGHLIGHT ====

const searchInput = document.getElementById("destination-search");

function normalizeSearch(s) {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

if (searchInput) {
  searchInput.addEventListener("keydown", (e) => {
    if (e.key !== "Enter") return;
    e.preventDefault();

    const q = normalizeSearch(searchInput.value.trim());
    if (!q) return;

    const items = document.querySelectorAll(".gallery-item");
    let match = null;

    items.forEach(item => {
      const title = normalizeSearch(
        item.querySelector("h3")?.textContent || ""
      );
      if (!match && title.includes(q)) match = item;
    });

    if (!match) {
      alert("No results found");
      return;
    }

    match.scrollIntoView({ behavior: "smooth", inline: "center" });
    match.classList.add("highlight");
    setTimeout(() => match.classList.remove("highlight"), 1500);
  });
}

  // ==== FEEDBACK (rating & comments) ====
const feedbackModal = document.getElementById('feedback-modal');
const closeFeedback  = document.getElementById('close-feedback');
const feedbackTitle  = document.getElementById('feedback-title');
const starPicker     = document.getElementById('star-picker');
const feedbackForm   = document.getElementById('feedback-form');
const fbName         = document.getElementById('fb-name');
const fbText         = document.getElementById('fb-text');
const commentsList   = document.getElementById('comments-list');

let currentTourKey = null;
let currentStars = 0;

if (feedbackModal && closeFeedback && feedbackTitle && starPicker && feedbackForm && fbText && commentsList) {
  starPicker.dataset.selected = '0';

  function drawStars() {
    starPicker.innerHTML = '';
    for (let i = 1; i <= 5; i++) {
      const s = document.createElement('span');
      s.className = 'star';
      s.dataset.value = String(i);
      s.textContent = '☆';
      s.style.cursor = 'pointer';
      starPicker.appendChild(s);
    }
    syncStars(0);
  }

  function syncStars(hover = 0) {
    const active = hover || currentStars;
    starPicker.querySelectorAll('.star').forEach(el => {
      const v = Number(el.dataset.value);
      el.textContent = v <= active ? '★' : '☆';
    });
  }

  starPicker.addEventListener('mousemove', (e) => {
    const s = e.target.closest('.star');
    syncStars(s ? Number(s.dataset.value) : 0);
  });

  starPicker.addEventListener('mouseleave', () => {
    syncStars(0);
  });

  starPicker.addEventListener('click', (e) => {
    const s = e.target.closest('.star');
    if (!s) return;
    currentStars = Number(s.dataset.value);
    starPicker.dataset.selected = String(currentStars);
    syncStars(0);
  });

  starPicker.addEventListener('touchstart', (e) => {
    const s = e.target.closest('.star');
    if (!s) return;
    e.preventDefault();
    currentStars = Number(s.dataset.value);
    starPicker.dataset.selected = String(currentStars);
    syncStars(0);
  }, { passive: false });

  async function apiGetReviews(tour) {
    const res = await fetch(`https://tourguide-4wz1.onrender.com/api/reviews/${tour}`);
    return res.json();
  }

  async function apiPostReview(tour_key, user_name, comment, stars) {
    const res = await fetch('https://tourguide-4wz1.onrender.com/api/reviews', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ tour_key, user_name, comment, stars })
    });
    return res.json();
  }

  function escapeHtml(str) {
    return (str || '').replace(/[&<>"]/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[s]));
  }

  async function renderComments(tour) {
    commentsList.innerHTML = 'Loading reviews.';
    try {
      const rows = await apiGetReviews(tour);
      commentsList.innerHTML = '';
      if (!rows.length) {
        const li = document.createElement('li');
        li.textContent = 'No comments yet — be the first!';
        commentsList.appendChild(li);
        return;
      }
      for (const c of rows) {
        const li = document.createElement('li');
        const who = (c.user_name && c.user_name.trim()) ? c.user_name.trim() : 'Anonymous';
        li.innerHTML = `
            <strong>${who}</strong> — ${'★'.repeat(c.stars)}${'☆'.repeat(5 - c.stars)}
            ${isAdmin ? `<button class="delete-review" data-id="${c.id}" style="margin-left:8px;font-size:12px;cursor:pointer;">Delete</button>` : ""}
            <br>${escapeHtml(c.comment)}
        `;
        li.style.marginBottom = '8px';
        commentsList.appendChild(li);
      }
    } catch (e) {
      commentsList.innerHTML = 'Failed to load reviews.';
      console.error(e);
    }
  }

  async function apiDeleteReview(id) {
  const res = await fetch(`https://tourguide-4wz1.onrender.com/api/reviews/${id}`, {
    method: 'DELETE'
  });
  return res.json();
}

  async function updateSummary(tour) {
    try {
      const rows = await apiGetReviews(tour);
      const cntEl = document.querySelector(`.count[data-tour="${tour}"]`);
      const avgEl = document.querySelector(`.avg[data-tour="${tour}"]`);
      if (cntEl) cntEl.textContent = rows.length;
      if (avgEl) {
        if (!rows.length) { avgEl.textContent = '–'; return; }
        const avg = rows.reduce((s, r) => s + (r.stars ?? 5), 0) / rows.length;
        avgEl.textContent = avg.toFixed(1);
      }
    } catch (e) {
      console.error(e);
    }
  }

  document.querySelectorAll('.feedback-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const tour  = btn.dataset.tour;
      const title = btn.dataset.tourTitle || 'Rate & Comment';
      currentTourKey = tour;
      feedbackTitle.textContent = title;

      fbName.value = '';
      fbText.value = '';
      currentStars = 0;
      starPicker.dataset.selected = '0';
      syncStars(0);

      renderComments(tour);
      feedbackModal.style.display = 'flex';
    });
  });

  closeFeedback.addEventListener('click', () => feedbackModal.style.display = 'none');
  window.addEventListener('click', (e) => {
    if (e.target === feedbackModal) feedbackModal.style.display = 'none';
  });

  commentsList.addEventListener('click', async (e) => {
  const btn = e.target.closest('.delete-review');
  if (!btn) return;

  const id = btn.dataset.id;
  if (!id) return;

  if (!confirm("Delete this review?")) return;

  try {
    await apiDeleteReview(id);
    await renderComments(currentTourKey);
    await updateSummary(currentTourKey);
  } catch (err) {
    alert("Failed to delete review.");
    console.error(err);
  }
});

feedbackForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const selected = Number(starPicker.dataset.selected || currentStars || 0);
  if (!selected) {
    alert('Please select a star rating!');
    return;
  }
  if (!currentTourKey) return;

  const text = fbText.value.trim();
  const name = fbName.value.trim();
  if (!text) return;

  try {
    await apiPostReview(currentTourKey, name, text, Math.max(1, Math.min(5, selected)));
    fbText.value = '';
    currentStars = 0;
    starPicker.dataset.selected = '0';
    syncStars(0);
    await renderComments(currentTourKey);
    await updateSummary(currentTourKey);
    alert('Thanks for your feedback!');
  } catch (err) {
    alert('Failed to submit review.');
    console.error(err);
  }
});

drawStars();

(async function initRatings() {
  for (const t of ['trollskogen','cinnamunBun','shopTour','brownCheese','streetArt','instagramTour']) {
    await updateSummary(t);
  }
  const p = new URLSearchParams(location.search);
  const t = p.get('review');
  if (t) {
    const btn = document.querySelector(`.feedback-btn[data-tour="${t}"]`);
    if (btn) btn.click();
  }
})();
}