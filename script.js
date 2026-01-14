(() => {
  "use strict";

  const API_BASE = location.hostname.includes("localhost")
    ? "http://localhost:3000"
    : "https://tourguide-4wz1.onrender.com";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  let isAdmin = false;

  const TOUR_DETAILS = {
    trollskogen: {
      title: 'Trip to “Trollskogen” at Fløyen',
      img: "pics/ulriken.jpg",
      text:
        "Join us on a trip to Mount Fløyen, one of Bergen’s most famous attractions. At the top, you’ll find a mysterious troll forest — the perfect spot for taking photos. Here, you’ll also get to learn about Norwegian folklore, including tales of trolls and other traditional myths.",
    },
    cinnamunBun: {
      title: "Cinnamun Bun Tour",
      img: "pics/fløyen.jpg",
      text:
        "Scandinavia is famous for its delicious sweet buns — and here in Bergen, we take great pride in ours! Join our bun tour, where we visit several authentic cafés to taste real Norwegian buns. Warm, fresh, and traditional, packed with butter and sugar — just the way they should be.",
    },
    shopTour: {
      title:
        "Shop Tour – Fretex, Episode, Vintage Kid, UFF, Apollo, Slit`an Vintage (and more!)",
      img: "pics/nordnesparken.jpg",
      text:
        "Get ready for the ultimate shopping adventure in Bergen. Join us on a walk through the city’s trendiest streets, where we visit some of the best vintage and second-hand stores. Discover unique treasures, retro fashion, and one-of-a-kind finds while exploring the colorful streets of Bergen.",
    },
    brownCheese: {
      title: "Brown Cheese Tour",
      img: "pics/sentrum.jpg",
      text:
        "Taste the world-famous brown cheese right in the heart of Bergen! We’ll take you on a short walk through charming streets and narrow alleys, where you’ll get to try brown cheese ice cream, brown cheese chocolate, and of course, brown cheese buns!",
    },
    streetArt: {
      title: "Bryggen & Fish Market Tour",
      img: "pics/bryggen.jpg",
      text:
        "Join us on a colorful and inspiring guided tour through the streets of Bergen, where we explore the city's unique street art! Experience how international and local artists have transformed walls, alleys and buildings into living works of art.",
    },
    instagramTour: {
      title: "Bergen Aquarium Tour",
      img: "pics/bergen.jpg",
      text:
        "Experience the best Instagram spots with us! Join us on a tour of the most popular and hidden Instagram spots in Bergen city. We go to the most charming and unique places in Bergen.",
    },
  };

  function escapeHtml(str) {
    return (str || "").replace(/[&<>"]/g, (s) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[s]));
  }

  function getCart() {
    return JSON.parse(localStorage.getItem("cart") || "[]");
  }

  function setCart(next) {
    localStorage.setItem("cart", JSON.stringify(next));
  }

  function addToCart(name, desc = "") {
    const cart = getCart();
    cart.push({ name, desc });
    setCart(cart);
    updateCartUI();
    alert(`"${name}" added to your cart!`);
  }

  function removeFromCart(index) {
    const cart = getCart();
    cart.splice(index, 1);
    setCart(cart);
    updateCartUI();
  }

  function updateCartUI() {
    const cart = getCart();

    const cartCount = $("#cart-count");
    if (cartCount) cartCount.textContent = String(cart.length);

    const cartItemsList = $("#cart-items");
    if (cartItemsList) {
      cartItemsList.innerHTML = "";
      cart.forEach((item, idx) => {
        const li = document.createElement("li");
        li.innerHTML = `${escapeHtml(item.name)} <button class="button remove-btn" data-remove="${idx}">Remove</button>`;
        cartItemsList.appendChild(li);
      });
    }

    const cartList = $("#cart-list");
    if (cartList) {
      cartList.innerHTML = "";
      if (!cart.length) {
        const li = document.createElement("li");
        li.textContent = "Your cart is empty.";
        cartList.appendChild(li);
      } else {
        cart.forEach((item, idx) => {
          const li = document.createElement("li");
          li.innerHTML = `<span>${escapeHtml(item.name)}</span><button class="button" data-remove="${idx}" style="padding:6px 12px; font-size:14px;">Remove</button>`;
          cartList.appendChild(li);
        });
      }
    }
  }

  function openTourModal(t) {
    const tourModal = $("#tour-modal");
    if (!tourModal || !t) return;

    const titleEl = $("#tour-modal-title");
    const imgEl = $("#tour-modal-image");
    const textEl = $("#tour-modal-text");
    const orderBtn = $("#tour-modal-order");
    const closeBtn = $("#close-tour");

    if (titleEl) titleEl.textContent = t.title || "";
    if (imgEl) imgEl.src = t.img || "";
    if (textEl) textEl.textContent = t.text || "";

    if (orderBtn) {
      orderBtn.onclick = () => {
        addToCart(t.title || "Tour", t.text || "");
        tourModal.style.display = "none";
      };
    }

    if (closeBtn) closeBtn.onclick = () => (tourModal.style.display = "none");

    tourModal.style.display = "flex";
  }

function fixImgPath(p) {
  if (!p) return "";
  const s = String(p).trim();
  if (/^https?:\/\//i.test(s)) return s;

  const clean = s.replace(/^\/+/, "");
  if (location.hostname.includes("github.io")) return `/TourGuide/${clean}`;
  return `/${clean}`;
}

async function loadTours() {
  const container = $(".gallery-container") || $(".gallery");
  if (!container) return;

  try {
    const res = await fetch(`${API_BASE}/api/tours`);
    if (!res.ok) return;

    const tours = await res.json();
    if (!Array.isArray(tours) || !tours.length) return;

    container.innerHTML = "";

    tours.forEach((t) => {
      const item = document.createElement("div");
      item.className = "gallery-item";
      item.innerHTML = `
        <img src="${escapeHtml(fixImgPath(t.img || ""))}" alt="${escapeHtml(t.title || "")}">
        <div class="tour-info">
          <h3>${escapeHtml(t.title || "")}</h3>
          <p>${escapeHtml(String(t.text || "").substring(0, 100))}...</p>
          <button class="button order-btn"
            data-title="${escapeHtml(t.title || "")}"
            data-desc="${escapeHtml(t.text || "")}">
            Order
          </button>
          <div class="rating-summary">
            <small>Rating: <span class="avg" data-tour="${escapeHtml(t.key || "")}">–</span> ★ (<span class="count" data-tour="${escapeHtml(t.key || "")}">0</span>)</small>
          </div>
          <button class="button feedback-btn" data-tour="${escapeHtml(t.key || "")}" data-tour-title="${escapeHtml(t.title || "")}">Rate & comments</button>
          ${
            isAdmin
              ? `<button class="button delete-tour-btn" style="background:red; margin-top:5px;" data-key="${escapeHtml(t.key || "")}">Delete Tour</button>`
              : ""
          }
        </div>
      `;

      item.addEventListener("click", (e) => {
        if (e.target.closest(".button")) return;
        openTourModal({ title: t.title, img: fixImgPath(t.img || ""), text: t.text });
      });

      container.appendChild(item);
    });

    if (typeof initRatings === "function") await initRatings();
  } catch (err) {
    console.error("Failed to load tours:", err);
  }
}

  const feedback = {
    modal: null,
    close: null,
    title: null,
    starPicker: null,
    form: null,
    nameInput: null,
    textInput: null,
    commentsList: null,
    currentTourKey: null,
    currentStars: 0,
    ready: false,
  };

  function syncStars(hover = 0) {
    if (!feedback.starPicker) return;
    const active = hover || feedback.currentStars;
    $$(".star", feedback.starPicker).forEach((el) => {
      const v = Number(el.dataset.value);
      el.textContent = v <= active ? "★" : "☆";
    });
  }

  function drawStars() {
    if (!feedback.starPicker) return;
    feedback.starPicker.innerHTML = "";
    for (let i = 1; i <= 5; i++) {
      const s = document.createElement("span");
      s.className = "star";
      s.dataset.value = String(i);
      s.textContent = "☆";
      s.style.cursor = "pointer";
      feedback.starPicker.appendChild(s);
    }
    syncStars(0);
  }

  async function apiGetReviews(tour) {
    const res = await fetch(`${API_BASE}/api/reviews/${encodeURIComponent(tour)}`);
    if (!res.ok) throw new Error("Failed to fetch reviews");
    return res.json();
  }

  async function apiPostReview(tour_key, user_name, comment, stars) {
    const res = await fetch(`${API_BASE}/api/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tour_key, user_name, comment, stars }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error || "Failed to post review");
    return data;
  }

  async function apiDeleteReview(id) {
    const res = await fetch(`${API_BASE}/api/reviews/${encodeURIComponent(id)}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error || "Failed to delete review");
    return data;
  }

  async function renderComments(tour) {
    if (!feedback.commentsList) return;
    feedback.commentsList.innerHTML = "Loading reviews.";
    try {
      const rows = await apiGetReviews(tour);
      feedback.commentsList.innerHTML = "";
      if (!rows.length) {
        const li = document.createElement("li");
        li.textContent = "No comments yet — be the first!";
        feedback.commentsList.appendChild(li);
        return;
      }
      for (const c of rows) {
        const li = document.createElement("li");
        const who = (c.user_name && String(c.user_name).trim()) ? String(c.user_name).trim() : "Anonymous";
        const stars = Math.max(0, Math.min(5, Number(c.stars || 0)));
        li.innerHTML = `
          <strong>${escapeHtml(who)}</strong> — ${"★".repeat(stars)}${"☆".repeat(5 - stars)}
          ${isAdmin && c.id != null ? `<button class="delete-review" data-id="${String(c.id)}" style="margin-left:8px;font-size:12px;cursor:pointer;">Delete</button>` : ""}
          <br>${escapeHtml(c.comment)}
        `;
        li.style.marginBottom = "8px";
        feedback.commentsList.appendChild(li);
      }
    } catch (e) {
      feedback.commentsList.innerHTML = "Failed to load reviews.";
      console.error(e);
    }
  }

  async function updateSummary(tour) {
    try {
      const rows = await apiGetReviews(tour);
      const cntEl = $(`.count[data-tour="${CSS.escape(tour)}"]`);
      const avgEl = $(`.avg[data-tour="${CSS.escape(tour)}"]`);
      if (cntEl) cntEl.textContent = String(rows.length);
      if (avgEl) {
        if (!rows.length) {
          avgEl.textContent = "–";
          return;
        }
        const avg = rows.reduce((s, r) => s + (Number(r.stars) || 0), 0) / rows.length;
        avgEl.textContent = avg.toFixed(1);
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function initRatings() {
    const keys = ["trollskogen", "cinnamunBun", "shopTour", "brownCheese", "streetArt", "instagramTour"];
    for (const t of keys) await updateSummary(t);

    const p = new URLSearchParams(location.search);
    const t = p.get("review");
    if (t) {
      const btn = $(`.feedback-btn[data-tour="${CSS.escape(t)}"]`);
      if (btn) btn.click();
    }
  }

  function openFeedbackModal(tour, title) {
    if (!feedback.ready) return;
    feedback.currentTourKey = tour;
    if (feedback.title) feedback.title.textContent = title || "Rate & Comment";
    if (feedback.nameInput) feedback.nameInput.value = "";
    if (feedback.textInput) feedback.textInput.value = "";
    feedback.currentStars = 0;
    if (feedback.starPicker) feedback.starPicker.dataset.selected = "0";
    syncStars(0);
    renderComments(tour);
    if (feedback.modal) feedback.modal.style.display = "flex";
  }

  function initFeedback() {
    feedback.modal = $("#feedback-modal");
    feedback.close = $("#close-feedback");
    feedback.title = $("#feedback-title");
    feedback.starPicker = $("#star-picker");
    feedback.form = $("#feedback-form");
    feedback.nameInput = $("#fb-name");
    feedback.textInput = $("#fb-text");
    feedback.commentsList = $("#comments-list");

    if (
      !feedback.modal ||
      !feedback.close ||
      !feedback.title ||
      !feedback.starPicker ||
      !feedback.form ||
      !feedback.textInput ||
      !feedback.commentsList
    ) {
      feedback.ready = false;
      return;
    }

    feedback.ready = true;
    feedback.starPicker.dataset.selected = "0";

    feedback.starPicker.addEventListener("mousemove", (e) => {
      const s = e.target.closest(".star");
      syncStars(s ? Number(s.dataset.value) : 0);
    });

    feedback.starPicker.addEventListener("mouseleave", () => {
      syncStars(0);
    });

    feedback.starPicker.addEventListener("click", (e) => {
      const s = e.target.closest(".star");
      if (!s) return;
      feedback.currentStars = Number(s.dataset.value);
      feedback.starPicker.dataset.selected = String(feedback.currentStars);
      syncStars(0);
    });

    feedback.starPicker.addEventListener(
      "touchstart",
      (e) => {
        const s = e.target.closest(".star");
        if (!s) return;
        e.preventDefault();
        feedback.currentStars = Number(s.dataset.value);
        feedback.starPicker.dataset.selected = String(feedback.currentStars);
        syncStars(0);
      },
      { passive: false }
    );

    feedback.close.addEventListener("click", () => {
      feedback.modal.style.display = "none";
    });

    window.addEventListener("click", (e) => {
      if (e.target === feedback.modal) feedback.modal.style.display = "none";
    });

    feedback.commentsList.addEventListener("click", async (e) => {
      const btn = e.target.closest(".delete-review");
      if (!btn) return;
      const id = btn.dataset.id;
      if (!id) return;
      if (!confirm("Delete this review?")) return;

      try {
        await apiDeleteReview(id);
        if (feedback.currentTourKey) {
          await renderComments(feedback.currentTourKey);
          await updateSummary(feedback.currentTourKey);
        }
      } catch (err) {
        alert("Failed to delete review.");
        console.error(err);
      }
    });

    feedback.form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const selected = Number(feedback.starPicker.dataset.selected || feedback.currentStars || 0);
      if (!selected) {
        alert("Please select a star rating!");
        return;
      }
      if (!feedback.currentTourKey) return;

      const text = (feedback.textInput.value || "").trim();
      const name = (feedback.nameInput?.value || "").trim();
      if (!text) return;

      try {
        await apiPostReview(feedback.currentTourKey, name, text, Math.max(1, Math.min(5, selected)));
        feedback.textInput.value = "";
        feedback.currentStars = 0;
        feedback.starPicker.dataset.selected = "0";
        syncStars(0);
        await renderComments(feedback.currentTourKey);
        await updateSummary(feedback.currentTourKey);
        alert("Thanks for your feedback!");
      } catch (err) {
        alert("Failed to submit review.");
        console.error(err);
      }
    });

    drawStars();
    initRatings();
  }

  function initAdminAccess() {
    document.addEventListener("keydown", async (e) => {
      if (!(e.ctrlKey && e.shiftKey && e.key === "A")) return;

      const code = prompt("Enter admin code:");
      if (code === "tourguide") {
        isAdmin = true;
        const adminPanel = $("#admin-panel");
        if (adminPanel) adminPanel.style.display = "block";
        await loadTours();
        alert("Admin mode enabled");
        if (feedback.currentTourKey) renderComments(feedback.currentTourKey);
      } else if (code !== null) {
        alert("Wrong code");
      }
    });
  }

  function initForms() {
    const addTourForm = $("#add-tour-form");
    if (addTourForm) {
      addTourForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const payload = {
          key: ($("#new-tour-key")?.value || "").trim(),
          title: ($("#new-tour-title")?.value || "").trim(),
          img: ($("#new-tour-img")?.value || "").trim(),
          text: ($("#new-tour-text")?.value || "").trim(),
        };

        try {
          const res = await fetch(`${API_BASE}/api/tours`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

          if (res.ok) {
            addTourForm.reset();
            await loadTours();
          } else {
            alert("Error adding tour. Key might be duplicate.");
          }
        } catch (err) {
          console.error(err);
          alert("Error adding tour.");
        }
      });
    }

    const confirmBtn = $("#confirm-btn");
    if (confirmBtn) {
      confirmBtn.addEventListener("click", async () => {
        const currentCart = getCart();
        if (!currentCart.length) {
          alert("Your cart is empty.");
          return;
        }

        const firstName = ($("#customer-name")?.value || "").trim();
        const lastName = ($("#customer-surname")?.value || "").trim();
        const customerPhone = ($("#customer-phone")?.value || "").trim();
        const customerEmail = ($("#customer-email")?.value || "").trim();

        if (!customerEmail || !firstName) {
          alert("Please enter at least your First Name and Email.");
          return;
        }

        const btn = confirmBtn;
        btn.disabled = true;
        const oldText = btn.textContent;
        btn.textContent = "Placing order...";

        const payload = {
          customerName: `${firstName} ${lastName}`.trim() || "Guest",
          customerEmail,
          customerPhone,
          items: currentCart,
        };

        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 70000);

          const res = await fetch(`${API_BASE}/api/orders`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
            signal: controller.signal,
          });

          clearTimeout(timeout);

          const data = await res.json().catch(() => ({}));

          if (!res.ok || !data.ok) throw new Error(data.error || "Server error");

          if (data.mailWarning) {
            alert(`Order #${data.orderId} saved, but email failed to send. Our team will contact you manually.`);
          } else {
            alert(`Order #${data.orderId} placed successfully! Check your email.`);
          }

          localStorage.removeItem("cart");
          updateCartUI();
          window.location.href = "index.html";
        } catch (e) {
          console.error("Order error:", e);
          if (e?.name === "AbortError") {
            alert("Request timed out. Please check your internet connection.");
          } else {
            alert("Could not place order. The server might be waking up. Please try again in 10 seconds.");
          }
        } finally {
          btn.disabled = false;
          btn.textContent = oldText;
        }
      });
    }
  }

  function initCartModal() {
    const cartIcon = $("#cart-icon");
    const cartModal = $("#cart-modal");
    const closeCart = $("#close-cart");
    const checkoutBtn = $("#checkout-btn");

    if (cartIcon && cartModal) {
      cartIcon.addEventListener("click", () => {
        updateCartUI();
        cartModal.style.display = "block";
      });
    }

    if (closeCart && cartModal) {
      closeCart.addEventListener("click", () => {
        cartModal.style.display = "none";
      });
    }

    window.addEventListener("click", (e) => {
      if (cartModal && e.target === cartModal) cartModal.style.display = "none";
    });

    if (checkoutBtn) {
      checkoutBtn.addEventListener("click", () => {
        window.location.href = "cart.html";
      });
    }
  }

  function initContactApplyModals() {
    const contactModal = $("#contact-modal");
    const closeContact = $("#close-contact");
    const contactBtn = $("#contact-link");
    const contactBtnFooter = $("#ContactFooter");

    function openContactModal(e) {
      if (e) e.preventDefault();
      if (contactModal) contactModal.style.display = "flex";
    }

    if (contactBtn) contactBtn.addEventListener("click", openContactModal);
    if (contactBtnFooter) contactBtnFooter.addEventListener("click", openContactModal);

    if (closeContact && contactModal) {
      closeContact.addEventListener("click", () => {
        contactModal.style.display = "none";
      });
    }

    window.addEventListener("click", (e) => {
      if (contactModal && e.target === contactModal) contactModal.style.display = "none";
    });

    const applyBtn = $("#apply-btn");
    const applyModal = $("#apply-modal");
    const closeApply = $("#close-apply");

    if (applyBtn && applyModal) {
      applyBtn.addEventListener("click", (e) => {
        e.preventDefault();
        applyModal.style.display = "flex";
      });
    }

    if (closeApply && applyModal) {
      closeApply.addEventListener("click", () => {
        applyModal.style.display = "none";
      });
    }

    window.addEventListener("click", (e) => {
      if (applyModal && e.target === applyModal) applyModal.style.display = "none";
    });
  }

  function initMenu() {
    const menuToggle = $("#menu-toggle");
    const navLeft = $(".nav-left");
    const navRight = $(".nav-right");

    if (menuToggle) {
      menuToggle.addEventListener("click", () => {
        menuToggle.classList.toggle("active");
        if (navLeft) navLeft.classList.toggle("show");
        if (navRight) navRight.classList.toggle("show");
      });
    }
  }

  function normalizeSearch(s) {
    return (s || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "");
  }

  function initSearch() {
    const searchInput = $("#destination-search");
    if (!searchInput) return;

    searchInput.addEventListener("keydown", (e) => {
      if (e.key !== "Enter") return;
      e.preventDefault();

      const q = normalizeSearch(searchInput.value.trim());
      if (!q) return;

      const items = $$(".gallery-item");
      let match = null;

      for (const item of items) {
        const title = normalizeSearch(item.querySelector("h3")?.textContent || "");
        if (title.includes(q)) {
          match = item;
          break;
        }
      }

      if (!match) {
        alert("No results found");
        return;
      }

      match.scrollIntoView({ behavior: "smooth", inline: "center" });
      match.classList.add("highlight");
      setTimeout(() => match.classList.remove("highlight"), 1500);
    });
  }

  async function handleDeleteTour(key) {
    if (!key) return;
    if (!confirm("Delete this tour?")) return;

    try {
      await fetch(`${API_BASE}/api/tours/${encodeURIComponent(key)}`, { method: "DELETE" });
      await loadTours();
    } catch (e) {
      console.error(e);
      alert("Failed to delete tour.");
    }
  }

  function initGlobalClicks() {
    document.addEventListener("click", async (e) => {
      const rm = e.target.closest("[data-remove]");
      if (rm) {
        const idx = Number(rm.dataset.remove);
        if (Number.isFinite(idx)) removeFromCart(idx);
        return;
      }

      const delTourBtn = e.target.closest(".delete-tour-btn");
      if (delTourBtn) {
        await handleDeleteTour(delTourBtn.dataset.key);
        return;
      }

      const feedbackBtn = e.target.closest(".feedback-btn");
      if (feedbackBtn) {
        e.preventDefault();
        openFeedbackModal(feedbackBtn.dataset.tour, feedbackBtn.dataset.tourTitle || "Rate & Comment");
        return;
      }

      const tourModalOrder = e.target.closest("#tour-modal-order");
      if (tourModalOrder) return;

      const orderBtn = e.target.closest(".order-btn");
      if (orderBtn) {
        const name = (orderBtn.dataset.title || "").trim() || orderBtn.closest(".gallery-item")?.querySelector("h3")?.textContent || "Tour";
        const desc = (orderBtn.dataset.desc || "").trim();
        addToCart(name, desc);
        return;
      }

      const rawOrderButton =
        e.target.matches("button.button") &&
        !e.target.closest("#cart-modal") &&
        !e.target.closest("#feedback-modal") &&
        !e.target.closest("#apply-modal") &&
        !e.target.closest("#contact-modal") &&
        !e.target.closest("#tour-modal") &&
        e.target.textContent.trim().toLowerCase() === "order" &&
        e.target.closest(".gallery-item");

      if (rawOrderButton) {
        const card = e.target.closest(".gallery-item");
        const name = card?.querySelector("h3")?.textContent?.trim() || "Tour";
        const key = card?.querySelector(".feedback-btn")?.dataset?.tour;
        const desc = (key && TOUR_DETAILS[key]?.text) ? TOUR_DETAILS[key].text : "";
        addToCart(name, desc);
        return;
      }

      const cardClick = e.target.closest(".gallery-item");
      if (cardClick && !e.target.closest(".button")) {
        const key = cardClick.querySelector(".feedback-btn")?.dataset?.tour;
        if (key && TOUR_DETAILS[key]) openTourModal(TOUR_DETAILS[key]);
      }
    });
  }

  document.addEventListener("DOMContentLoaded", async () => {
    updateCartUI();
    initAdminAccess();
    initForms();
    initCartModal();
    initContactApplyModals();
    initMenu();
    initSearch();
    initFeedback();
    initGlobalClicks();
    if (!location.hostname.includes("github.io")) {
    await loadTours();
}

  });
})();
