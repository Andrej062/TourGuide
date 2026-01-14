(() => {
  "use strict";

  const API_BASE = location.hostname.includes("localhost")
    ? "http://localhost:3000"
    : "https://tourguide-4wz1.onrender.com";

  let isAdmin = false;
  let cart = JSON.parse(localStorage.getItem("cart")) || [];

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function saveCart() {
    localStorage.setItem("cart", JSON.stringify(cart));
  }

  function updateCart() {
    const cartCount = $("#cart-count");
    const cartItemsList = $("#cart-items");

    if (cartCount) cartCount.textContent = String(cart.length);

    if (cartItemsList) {
      cartItemsList.innerHTML = "";
      cart.forEach((item, index) => {
        const li = document.createElement("li");
        li.innerHTML = `${item.name}<button class="button remove-btn" data-remove="${index}">Remove</button>`;
        cartItemsList.appendChild(li);
      });
    }

    saveCart();
  }

  function addToCart(name, desc = "") {
    cart.push({ name, desc });
    updateCart();
    alert(`"${name}" added to your cart!`);
  }

  function removeItem(index) {
    if (!Number.isFinite(index)) return;
    cart.splice(index, 1);
    updateCart();
  }

  window.removeItem = removeItem;

  function escapeHtml(str) {
    return (str || "").replace(/[&<>"]/g, (s) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[s]));
  }

  function openTourModal(t) {
    const tourModal = $("#tour-modal");
    if (!tourModal || !t) return;

    const titleEl = $("#tour-modal-title");
    const imgEl = $("#tour-modal-image");
    const textEl = $("#tour-modal-text");
    const orderBtn = $("#tour-modal-order");

    if (titleEl) titleEl.textContent = t.title || "";
    if (imgEl) imgEl.src = t.img || "";
    if (textEl) textEl.textContent = t.text || "";

    if (orderBtn) {
      orderBtn.onclick = () => {
        addToCart(t.title || "Tour", t.text || "");
        tourModal.style.display = "none";
      };
    }

    tourModal.style.display = "flex";
  }

  async function loadTours() {
    const container = $(".gallery");
    if (!container) return;

    try {
      const res = await fetch(`${API_BASE}/api/tours`);
      if (!res.ok) throw new Error("Failed to fetch tours");
      const tours = await res.json();

      container.innerHTML = "";

      tours.forEach((t) => {
        const item = document.createElement("div");
        item.className = "gallery-item";
        item.innerHTML = `
          <img src="${t.img}" alt="${escapeHtml(t.title)}">
          <div class="tour-info">
            <h3>${escapeHtml(t.title)}</h3>
            <p>${escapeHtml((t.text || "").substring(0, 100))}...</p>
            <button class="button order-btn" data-title="${escapeHtml(t.title)}">Order</button>
            <button class="button feedback-btn" data-tour="${escapeHtml(t.key)}" data-tour-title="${escapeHtml(t.title)}">Rate & Comment</button>
            ${
              isAdmin
                ? `<button class="button delete-tour-btn" style="background:red; margin-top:5px;" data-key="${escapeHtml(t.key)}">Delete Tour</button>`
                : ""
            }
          </div>
        `;

        item.addEventListener("click", (e) => {
          if (e.target.closest(".button")) return;
          openTourModal(t);
        });

        container.appendChild(item);
      });
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
        const who = (c.user_name && c.user_name.trim()) ? c.user_name.trim() : "Anonymous";
        const stars = Math.max(0, Math.min(5, Number(c.stars || 0)));
        li.innerHTML = `
          <strong>${escapeHtml(who)}</strong> — ${"★".repeat(stars)}${"☆".repeat(5 - stars)}
          ${
            isAdmin && c.id != null
              ? `<button class="delete-review" data-id="${String(c.id)}" style="margin-left:8px;font-size:12px;cursor:pointer;">Delete</button>`
              : ""
          }
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

  function normalizeSearch(s) {
    return (s || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "");
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
        const currentCart = JSON.parse(localStorage.getItem("cart")) || [];
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
          cart = [];
          updateCart();
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

  function initCartUI() {
    const cartIcon = $("#cart-icon");
    const cartModal = $("#cart-modal");
    const closeCart = $("#close-cart");

    if (cartIcon && cartModal) {
      cartIcon.addEventListener("click", () => {
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

    const cartList = $("#cart-list");
    if (cartList) {
      const backBtn = $("#back-btn");

      function renderCartPage() {
        cart = JSON.parse(localStorage.getItem("cart")) || [];
        cartList.innerHTML = "";
        if (!cart.length) {
          const li = document.createElement("li");
          li.textContent = "Your cart is empty.";
          cartList.appendChild(li);
          return;
        }
        cart.forEach((item, index) => {
          const li = document.createElement("li");
          li.innerHTML = `
            <span>${escapeHtml(item.name)}</span>
            <button class="button" data-remove="${index}" style="padding:6px 12px; font-size:14px;">Remove</button>
          `;
          cartList.appendChild(li);
        });
      }

      cartList.addEventListener("click", (e) => {
        const btn = e.target.closest('button[data-remove]');
        if (!btn) return;
        const index = Number(btn.dataset.remove);
        removeItem(index);
        renderCartPage();
      });

      if (backBtn) {
        backBtn.addEventListener("click", () => {
          window.location.href = "index.html";
        });
      }

      renderCartPage();
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

  function initGlobalClicks() {
    document.addEventListener("click", async (e) => {
      const removeBtn = e.target.closest("[data-remove]");
      if (removeBtn && removeBtn.matches(".remove-btn, #cart-items .button, #cart-list .button, button.button")) {
        const idx = Number(removeBtn.dataset.remove);
        if (Number.isFinite(idx)) removeItem(idx);
      }

      const orderBtn = e.target.closest(".order-btn");
      if (orderBtn) {
        const card = orderBtn.closest(".gallery-item");
        const title = orderBtn.dataset.title || card?.querySelector("h3")?.textContent || "Tour";
        addToCart(title, "");
        return;
      }

      const delTourBtn = e.target.closest(".delete-tour-btn");
      if (delTourBtn) {
        const key = delTourBtn.dataset.key;
        await handleDeleteTour(key);
        return;
      }

      const feedbackBtn = e.target.closest(".feedback-btn");
      if (feedbackBtn) {
        e.preventDefault();
        const tour = feedbackBtn.dataset.tour;
        const title = feedbackBtn.dataset.tourTitle || "Rate & Comment";
        openFeedbackModal(tour, title);
        return;
      }
    });
  }

  document.addEventListener("DOMContentLoaded", async () => {
    cart = JSON.parse(localStorage.getItem("cart")) || [];
    updateCart();

    initAdminAccess();
    initForms();
    initCartUI();
    initContactApplyModals();
    initMenu();
    initSearch();
    initFeedback();
    initGlobalClicks();

    await loadTours();
  });
})();
