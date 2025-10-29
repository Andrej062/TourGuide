let cart = JSON.parse(localStorage.getItem('cart')) || [];

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

//TOUR SEARCH SCROLL + HIGHLIGHT

// --- Simple Search (Enter to scroll + highlight) ---
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