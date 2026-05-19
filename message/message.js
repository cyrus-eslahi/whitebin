(function () {
  const qtyButtons = document.querySelectorAll(".qty-selector__btn[data-qty]");
  const titleEl = document.getElementById("product-title");
  const priceEl = document.getElementById("product-price");

  const options = {
    1: { title: "Clean 1 Trash Can", price: "$20" },
    2: { title: "Clean 2 Trash Cans", price: "$30" },
  };

  function selectQty(qty) {
    const option = options[qty];
    if (!option) return;

    qtyButtons.forEach((btn) => {
      btn.classList.toggle("is-active", btn.dataset.qty === qty);
    });

    titleEl.textContent = option.title;
    priceEl.textContent = option.price;
  }

  qtyButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      selectQty(btn.dataset.qty);
    });
  });

  document.querySelector(".product-card__buy")?.addEventListener("click", () => {
    /* Placeholder — checkout not implemented yet */
  });
})();
