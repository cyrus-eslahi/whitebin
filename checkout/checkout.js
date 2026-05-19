(function () {
  const PHONE_RAW = "3464421888";
  const PHONE_DISPLAY = "346-442-1888";
  const PRICES = { 1: 20, 2: 30 };

  const params = new URLSearchParams(window.location.search);
  const qty = params.get("qty") === "2" ? 2 : 1;
  const totalPrice = PRICES[qty];

  const addressDisplay = document.getElementById("address-display");
  const phoneDisplay = document.getElementById("phone-display");
  const addressError = document.getElementById("address-error");
  const paymentError = document.getElementById("payment-error");
  const orderIdEl = document.getElementById("order-id");
  const checkoutPriceEl = document.getElementById("checkout-price");
  const qtyDisplay = document.getElementById("qty-display");

  const addressModal = document.getElementById("address-modal");
  const successModal = document.getElementById("success-modal");
  const addressForm = document.getElementById("address-form");
  const addressInput = document.getElementById("address-input");
  const phoneInput = document.getElementById("phone-input");

  let savedAddress = "";
  let savedPhone = "";

  checkoutPriceEl.textContent = `$${totalPrice}`;
  qtyDisplay.textContent = String(qty);

  function loadAddressFromStorage() {
    try {
      savedAddress = sessionStorage.getItem("whitebin_checkout_address") || "";
      savedPhone = sessionStorage.getItem("whitebin_checkout_phone") || "";
    } catch (_) {
      savedAddress = "";
      savedPhone = "";
    }
    renderAddress();
  }

  function saveAddressToStorage() {
    sessionStorage.setItem("whitebin_checkout_address", savedAddress);
    sessionStorage.setItem("whitebin_checkout_phone", savedPhone);
  }

  function renderAddress() {
    if (savedAddress.trim() && savedPhone.trim()) {
      addressDisplay.textContent = savedAddress.trim();
      addressDisplay.classList.add("is-filled");
      phoneDisplay.textContent = `Phone: ${savedPhone.trim()}`;
      phoneDisplay.classList.remove("checkout-address__phone--hidden");
    } else {
      addressDisplay.textContent = "No address added yet.";
      addressDisplay.classList.remove("is-filled");
      phoneDisplay.classList.add("checkout-address__phone--hidden");
    }
  }

  function hasValidAddress() {
    return Boolean(savedAddress.trim() && savedPhone.trim());
  }

  function openAddressModal() {
    addressInput.value = savedAddress;
    phoneInput.value = savedPhone;
    addressModal.classList.remove("modal-overlay--hidden");
    document.body.style.overflow = "hidden";
    addressInput.focus();
  }

  function closeAddressModal() {
    addressModal.classList.add("modal-overlay--hidden");
    document.body.style.overflow = "";
  }

  function openSuccessModal() {
    successModal.classList.remove("modal-overlay--hidden");
    document.body.style.overflow = "hidden";
  }

  function closeSuccessModal() {
    successModal.classList.add("modal-overlay--hidden");
    document.body.style.overflow = "";
  }

  function getSelectedPayment() {
    const selected = document.querySelector('input[name="payment"]:checked');
    return selected ? selected.value : "";
  }

  async function initOrderId() {
    try {
      orderIdEl.textContent = "…";
      const orderId = await window.WhiteBinOrders.reserveOrderId();
      orderIdEl.textContent = orderId;
    } catch (err) {
      console.error(err);
      orderIdEl.textContent = "—";
    }
  }

  document.getElementById("edit-address-btn").addEventListener("click", openAddressModal);
  document.getElementById("close-address-modal").addEventListener("click", closeAddressModal);

  addressModal.addEventListener("click", (e) => {
    if (e.target === addressModal) closeAddressModal();
  });

  addressForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const address = addressInput.value.trim();
    const phone = phoneInput.value.trim();

    if (!address || !phone) {
      return;
    }

    savedAddress = address;
    savedPhone = phone;
    saveAddressToStorage();
    renderAddress();
    addressError.classList.add("checkout-field-error--hidden");
    closeAddressModal();
  });

  document.getElementById("complete-order-btn").addEventListener("click", async () => {
    let valid = true;

    if (!hasValidAddress()) {
      addressError.classList.remove("checkout-field-error--hidden");
      openAddressModal();
      valid = false;
    } else {
      addressError.classList.add("checkout-field-error--hidden");
    }

    const paymentMethod = getSelectedPayment();
    if (!paymentMethod) {
      paymentError.classList.remove("checkout-field-error--hidden");
      valid = false;
    } else {
      paymentError.classList.add("checkout-field-error--hidden");
    }

    if (!valid) return;

    const btn = document.getElementById("complete-order-btn");
    btn.disabled = true;
    btn.textContent = "Processing…";

    try {
      const orderId = orderIdEl.textContent;
      if (!orderId || orderId === "…" || orderId === "—") {
        throw new Error("Order ID not ready");
      }

      await window.WhiteBinOrders.saveOrder({
        orderId,
        address: savedAddress.trim(),
        phone: savedPhone.trim(),
        quantity: qty,
        unitPrice: qty === 1 ? 20 : 15,
        totalPrice,
        paymentMethod,
      });

      openSuccessModal();
    } catch (err) {
      console.error(err);
      alert("Something went wrong saving your order. Please try again.");
    } finally {
      btn.disabled = false;
      btn.textContent = "Complete Order";
    }
  });

  document.getElementById("copy-phone-btn").addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(PHONE_DISPLAY);
    } catch (_) {
      await navigator.clipboard.writeText(PHONE_RAW);
    }
    const feedback = document.getElementById("copy-feedback");
    feedback.classList.remove("success-modal__copied--hidden");
    setTimeout(() => feedback.classList.add("success-modal__copied--hidden"), 2000);
  });

  document.getElementById("close-success-modal").addEventListener("click", () => {
    window.WhiteBinOrders.clearCheckoutSession();
    sessionStorage.removeItem("whitebin_checkout_address");
    sessionStorage.removeItem("whitebin_checkout_phone");
    closeSuccessModal();
    window.location.href = "../";
  });

  document.querySelector(".success-modal__home").addEventListener("click", () => {
    window.WhiteBinOrders.clearCheckoutSession();
    sessionStorage.removeItem("whitebin_checkout_address");
    sessionStorage.removeItem("whitebin_checkout_phone");
  });

  loadAddressFromStorage();
  initOrderId();

  if (!params.get("qty")) {
    window.location.replace(`?qty=1`);
  }
})();
