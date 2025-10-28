let cart = JSON.parse(localStorage.getItem('cart')) || [];
updateCart();

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

document.querySelectorAll('.button:not(.feedback-btn)').forEach((btn) => {
  btn.addEventListener('click', (e) => {
    const tourInfo = e.target.closest('.tour-info');
    const name = tourInfo.querySelector('h3').textContent;
    const desc = tourInfo.querySelector('p').textContent;
    const tour = { name, desc };
    cart.push(tour);
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
      <button onclick="removeItem(${index})">Remove</button>
    `;
    cartItemsList.appendChild(li);
  });
  cartCount.textContent = cart.length;

  localStorage.setItem('cart', JSON.stringify(cart));
}

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
