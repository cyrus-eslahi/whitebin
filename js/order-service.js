/**
 * Order ID generation and Supabase persistence.
 * Uses Supabase when configured in js/config.js; otherwise localStorage fallback.
 */
(function () {
  const STORAGE_KEY = "whitebin_order_counter";
  const SESSION_ORDER_KEY = "whitebin_checkout_order_id";

  function readLocalCounter() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (_) {
      /* ignore */
    }
    return { letter: "A", number: 0 };
  }

  function writeLocalCounter(counter) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(counter));
  }

  function formatOrderId(letter, number) {
    return `${letter}${number}`;
  }

  function incrementCounter(counter) {
    let { letter, number } = counter;
    number += 1;
    if (number > 99) {
      number = 1;
      const nextCode = letter.charCodeAt(0) + 1;
      if (nextCode > "Z".charCodeAt(0)) {
        throw new Error("Order ID sequence exhausted");
      }
      letter = String.fromCharCode(nextCode);
    }
    return { letter, number };
  }

  function getNextOrderIdLocal() {
    const counter = incrementCounter(readLocalCounter());
    writeLocalCounter(counter);
    return formatOrderId(counter.letter, counter.number);
  }

  async function getSupabaseClient() {
    if (!window.isSupabaseConfigured()) return null;
    if (!window.supabase) {
      throw new Error("Supabase client not loaded");
    }
    const { supabaseUrl, supabaseAnonKey } = window.WHITEBIN_CONFIG;
    return window.supabase.createClient(supabaseUrl, supabaseAnonKey);
  }

  async function getNextOrderIdFromSupabase() {
    const client = await getSupabaseClient();
    const { data, error } = await client.rpc("get_next_order_id");
    if (error) throw error;
    return data;
  }

  async function reserveOrderId() {
    const existing = sessionStorage.getItem(SESSION_ORDER_KEY);
    if (existing) return existing;

    let orderId;
    if (window.isSupabaseConfigured()) {
      orderId = await getNextOrderIdFromSupabase();
    } else {
      orderId = getNextOrderIdLocal();
    }

    sessionStorage.setItem(SESSION_ORDER_KEY, orderId);
    return orderId;
  }

  async function saveOrder(order) {
    if (window.isSupabaseConfigured()) {
      const client = await getSupabaseClient();
      const { error } = await client.from("orders").insert({
        order_id: order.orderId,
        address: order.address,
        phone: order.phone,
        quantity: order.quantity,
        unit_price: order.unitPrice,
        total_price: order.totalPrice,
        payment_method: order.paymentMethod,
        status: "pending",
      });
      if (error) throw error;
      return { saved: true, provider: "supabase" };
    }

    const queue = JSON.parse(localStorage.getItem("whitebin_orders_queue") || "[]");
    queue.push({ ...order, createdAt: new Date().toISOString() });
    localStorage.setItem("whitebin_orders_queue", JSON.stringify(queue));
    return { saved: true, provider: "local" };
  }

  function clearCheckoutSession() {
    sessionStorage.removeItem(SESSION_ORDER_KEY);
  }

  window.WhiteBinOrders = {
    reserveOrderId,
    saveOrder,
    clearCheckoutSession,
    SESSION_ORDER_KEY,
  };
})();
