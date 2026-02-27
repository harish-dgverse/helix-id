"use client";

import { useEffect, useState } from "react";

/* ─── Types ─────────────────────────────────────── */
interface Book {
  id: string;
  title: string;
  author: string;
  price: number;
  stock: number;
}

interface Order {
  order_id: number;
  book_title: string;
  quantity: number;
  total_price: number;
  status: "Order Placed" | "Processing" | "Shipped" | "Delivered" | "Cancelled";
  created_at: string;
}

interface User {
  privateKeyString: string;
  publicKeyString: string;
  did: string;
}

/* ─── Helpers ─────────────────────────────────────── */
function stockBadge(stock: number) {
  if (stock === 0)
    return (
      <span className="badge badge-out">Out of Stock</span>
    );
  if (stock <= 3)
    return (
      <span className="badge badge-low">Low — {stock} left</span>
    );
  return <span className="badge badge-ok">{stock} in stock</span>;
}

function statusDot(status: Order["status"]) {
  const map: Record<string, string> = {
    "Order Placed": "#4ade80",
    Processing: "#f4a72a",
    Shipped: "#4c9cf8",
    Delivered: "#818cf8",
    Cancelled: "#f87171",
  };
  return (
    <span className="status-dot" style={{ background: map[status] ?? "#888" }} />
  );
}

/* ─── Component ─────────────────────────────────────── */
export default function Dashboard() {
  const [books, setBooks] = useState<Book[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [modalBook, setModalBook] = useState<Book | null>(null);
  const [orderQty, setOrderQty] = useState(1);
  const [placing, setPlacing] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  /* Fetch all data */
  const fetchAll = async () => {
    const [bRes, oRes, uRes] = await Promise.all([
      fetch("/api/books"),
      fetch("/api/orders"),
      fetch("/api/user"),
    ]);
    const [b, o, u] = await Promise.all([bRes.json(), oRes.json(), uRes.json()]);
    setBooks(b);
    setOrders(o);
    setUser(u);
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  /* Auto-dismiss toast */
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  /* Place Order */
  const placeOrder = async () => {
    if (!modalBook) return;
    setPlacing(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ book_title: modalBook.title, quantity: orderQty }),
      });
      const data = await res.json();
      if (!res.ok) {
        setToast({ msg: data.error ?? "Failed to place order", ok: false });
      } else {
        setToast({ msg: `Order #${data.order_id} placed successfully!`, ok: true });
        await fetchAll(); // refresh books + orders
      }
    } catch {
      setToast({ msg: "Network error. Please try again.", ok: false });
    } finally {
      setPlacing(false);
      setModalBook(null);
    }
  };

  /* ─── Render ─────────────────────────────────────── */
  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

        body {
          font-family: 'Inter', system-ui, sans-serif;
          background: #0f1117;
          color: #e2e8f0;
          min-height: 100vh;
        }

        /* ── Layout ── */
        .shell {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: linear-gradient(135deg, #0f1117 0%, #16213e 50%, #0f1117 100%);
        }

        /* ── Header ── */
        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 2rem;
          height: 64px;
          background: rgba(255,255,255,0.03);
          border-bottom: 1px solid rgba(255,255,255,0.08);
          backdrop-filter: blur(10px);
          position: sticky;
          top: 0;
          z-index: 50;
        }
        .header-brand {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          font-weight: 700;
          font-size: 1.25rem;
          letter-spacing: -0.02em;
          background: linear-gradient(90deg, #818cf8, #c084fc);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .header-brand svg { flex-shrink: 0; }
        .header-right {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 0.78rem;
          color: #94a3b8;
        }
        .did-chip {
          background: rgba(129,140,248,0.12);
          border: 1px solid rgba(129,140,248,0.3);
          padding: 0.25rem 0.75rem;
          border-radius: 999px;
          font-family: monospace;
          font-size: 0.72rem;
          color: #a5b4fc;
          max-width: 340px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .avatar {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: linear-gradient(135deg, #818cf8, #c084fc);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.85rem;
          color: #fff;
          flex-shrink: 0;
        }

        /* ── Body ── */
        .dashboard {
          display: grid;
          grid-template-columns: 1fr 380px;
          gap: 1.5rem;
          padding: 1.5rem 2rem;
          flex: 1;
        }
        @media (max-width: 900px) {
          .dashboard { grid-template-columns: 1fr; }
        }

        /* ── Card ── */
        .card {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 1rem;
          overflow: hidden;
        }
        .card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem 1.25rem;
          border-bottom: 1px solid rgba(255,255,255,0.07);
        }
        .card-title {
          font-weight: 600;
          font-size: 0.95rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #e2e8f0;
        }
        .count-chip {
          background: rgba(129,140,248,0.18);
          color: #a5b4fc;
          font-size: 0.72rem;
          font-weight: 600;
          padding: 0.15rem 0.6rem;
          border-radius: 999px;
        }

        /* ── Books Table ── */
        .books-table {
          width: 100%;
          border-collapse: collapse;
        }
        .books-table th {
          text-align: left;
          font-size: 0.72rem;
          font-weight: 600;
          letter-spacing: 0.07em;
          text-transform: uppercase;
          color: #64748b;
          padding: 0.75rem 1.25rem;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .books-table td {
          padding: 0.95rem 1.25rem;
          vertical-align: middle;
          border-bottom: 1px solid rgba(255,255,255,0.04);
          font-size: 0.875rem;
        }
        .books-table tr:last-child td { border-bottom: none; }
        .books-table tr:hover td {
          background: rgba(255,255,255,0.03);
        }
        .book-title-cell strong {
          display: block;
          color: #e2e8f0;
          font-weight: 500;
        }
        .book-title-cell span {
          font-size: 0.78rem;
          color: #64748b;
        }
        .price { color: #4ade80; font-weight: 600; font-size: 0.9rem; }

        /* ── Badges ── */
        .badge {
          display: inline-flex;
          align-items: center;
          padding: 0.2rem 0.65rem;
          border-radius: 999px;
          font-size: 0.73rem;
          font-weight: 600;
          white-space: nowrap;
        }
        .badge-ok   { background: rgba(74,222,128,0.13); color: #4ade80; border: 1px solid rgba(74,222,128,0.25); }
        .badge-low  { background: rgba(251,191,36,0.13); color: #fbbf24; border: 1px solid rgba(251,191,36,0.25); }
        .badge-out  { background: rgba(248,113,113,0.13); color: #f87171; border: 1px solid rgba(248,113,113,0.25); }

        /* ── Order Button ── */
        .btn-order {
          padding: 0.35rem 0.9rem;
          border: 1px solid rgba(129,140,248,0.5);
          background: rgba(129,140,248,0.1);
          color: #a5b4fc;
          border-radius: 0.5rem;
          font-size: 0.8rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s;
          white-space: nowrap;
        }
        .btn-order:hover {
          background: rgba(129,140,248,0.25);
          border-color: rgba(129,140,248,0.8);
          color: #c7d2fe;
        }
        .btn-order:disabled {
          opacity: 0.35;
          cursor: not-allowed;
        }

        /* ── Orders Panel ── */
        .orders-list { overflow-y: auto; max-height: calc(100vh - 200px); }
        .order-item {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
          padding: 1rem 1.25rem;
          border-bottom: 1px solid rgba(255,255,255,0.04);
          transition: background 0.15s;
        }
        .order-item:last-child { border-bottom: none; }
        .order-item:hover { background: rgba(255,255,255,0.03); }
        .order-row1 {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.5rem;
        }
        .order-book { font-weight: 500; font-size: 0.875rem; color: #e2e8f0; }
        .order-id { font-size: 0.72rem; color: #475569; }
        .order-row2 {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 0.78rem;
          color: #64748b;
        }
        .order-status {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.78rem;
          font-weight: 500;
        }
        .status-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          display: inline-block;
          box-shadow: 0 0 6px currentColor;
        }
        .order-price { color: #4ade80; font-weight: 600; font-size: 0.85rem; }
        .order-date { color: #475569; font-size: 0.72rem; }

        /* ── Modal ── */
        .modal-backdrop {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.65);
          backdrop-filter: blur(6px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
          padding: 1rem;
        }
        .modal {
          background: #1e2230;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 1.25rem;
          width: 100%;
          max-width: 420px;
          padding: 2rem;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          box-shadow: 0 25px 60px rgba(0,0,0,0.6);
          animation: popIn 0.18s ease;
        }
        @keyframes popIn {
          from { transform: scale(0.94); opacity: 0; }
          to   { transform: scale(1);    opacity: 1; }
        }
        .modal-title { font-weight: 700; font-size: 1.15rem; color: #e2e8f0; }
        .modal-book-info { background: rgba(255,255,255,0.04); border-radius: 0.75rem; padding: 1rem; }
        .modal-book-info h3 { font-weight: 600; font-size: 1rem; color: #e2e8f0; margin-bottom: 0.25rem; }
        .modal-book-info p { font-size: 0.82rem; color: #64748b; }
        .modal-row { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
        .modal-label { font-size: 0.85rem; color: #94a3b8; font-weight: 500; }
        .qty-control {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .qty-btn {
          width: 30px; height: 30px;
          border-radius: 0.4rem;
          border: 1px solid rgba(255,255,255,0.12);
          background: rgba(255,255,255,0.06);
          color: #e2e8f0;
          font-size: 1rem;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.15s;
        }
        .qty-btn:hover { background: rgba(129,140,248,0.2); border-color: rgba(129,140,248,0.5); }
        .qty-btn:disabled { opacity: 0.35; cursor: not-allowed; }
        .qty-val { font-weight: 600; font-size: 1rem; min-width: 24px; text-align: center; }
        .total-line { font-size: 0.9rem; color: #94a3b8; }
        .total-line strong { color: #4ade80; font-size: 1.1rem; }
        .modal-actions { display: flex; gap: 0.75rem; }
        .btn-cancel {
          flex: 1;
          padding: 0.7rem;
          border-radius: 0.75rem;
          border: 1px solid rgba(255,255,255,0.1);
          background: transparent;
          color: #94a3b8;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s;
          font-size: 0.875rem;
        }
        .btn-cancel:hover { background: rgba(255,255,255,0.05); }
        .btn-confirm {
          flex: 2;
          padding: 0.7rem;
          border-radius: 0.75rem;
          border: none;
          background: linear-gradient(135deg, #818cf8, #c084fc);
          color: #fff;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
          font-size: 0.875rem;
        }
        .btn-confirm:hover { opacity: 0.9; transform: translateY(-1px); }
        .btn-confirm:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

        /* ── Toast ── */
        .toast {
          position: fixed;
          bottom: 1.5rem;
          left: 50%;
          transform: translateX(-50%);
          padding: 0.75rem 1.5rem;
          border-radius: 0.75rem;
          font-size: 0.875rem;
          font-weight: 500;
          z-index: 200;
          animation: slideUp 0.25s ease;
          white-space: nowrap;
          box-shadow: 0 8px 32px rgba(0,0,0,0.4);
        }
        @keyframes slideUp {
          from { transform: translateX(-50%) translateY(20px); opacity: 0; }
          to   { transform: translateX(-50%) translateY(0);    opacity: 1; }
        }
        .toast-ok  { background: rgba(74,222,128,0.15); border: 1px solid rgba(74,222,128,0.4); color: #4ade80; }
        .toast-err { background: rgba(248,113,113,0.15); border: 1px solid rgba(248,113,113,0.4); color: #f87171; }

        /* ── Empty / Loading ── */
        .empty {
          padding: 3rem 1.25rem;
          text-align: center;
          color: #475569;
          font-size: 0.875rem;
        }
        .skeleton {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 200px;
          color: #475569;
          font-size: 0.875rem;
          gap: 0.5rem;
        }

        /* ── Scrollbar ── */
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 999px; }
      `}</style>

      <div className="shell">
        {/* ── Header ── */}
        <header className="header">
          <div className="header-brand">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="url(#g)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <defs>
                <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#818cf8" />
                  <stop offset="100%" stopColor="#c084fc" />
                </linearGradient>
              </defs>
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
            Helix Bookstore
          </div>
          <div className="header-right">
            {user && (
              <>
                <span className="did-chip" title={user.did}>{user.did}</span>
                <div className="avatar" title="Logged in">H</div>
              </>
            )}
          </div>
        </header>

        {/* ── Dashboard Grid ── */}
        <main className="dashboard">
          {/* ── Books Panel ── */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                </svg>
                All Books
                <span className="count-chip">{books.length}</span>
              </div>
            </div>

            {loading ? (
              <div className="skeleton">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                </svg>
                Loading…
              </div>
            ) : books.length === 0 ? (
              <div className="empty">No books found.</div>
            ) : (
              <table className="books-table">
                <thead>
                  <tr>
                    <th>Book</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {books.map((book) => (
                    <tr key={book.id}>
                      <td className="book-title-cell">
                        <strong>{book.title}</strong>
                        <span>{book.author}</span>
                      </td>
                      <td>
                        <span className="price">${book.price.toFixed(2)}</span>
                      </td>
                      <td>{stockBadge(book.stock)}</td>
                      <td>
                        <button
                          className="btn-order"
                          disabled={book.stock === 0}
                          onClick={() => { setModalBook(book); setOrderQty(1); }}
                        >
                          Order
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* ── Orders Panel ── */}
          <div className="card" style={{ display: "flex", flexDirection: "column" }}>
            <div className="card-header">
              <div className="card-title">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#c084fc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                </svg>
                Orders
                <span className="count-chip">{orders.length}</span>
              </div>
            </div>

            <div className="orders-list">
              {loading ? (
                <div className="skeleton">Loading…</div>
              ) : orders.length === 0 ? (
                <div className="empty">No orders yet.</div>
              ) : (
                [...orders].reverse().map((order) => (
                  <div className="order-item" key={order.order_id}>
                    <div className="order-row1">
                      <span className="order-book">{order.book_title}</span>
                      <span className="order-id">#{order.order_id}</span>
                    </div>
                    <div className="order-row2">
                      <div className="order-status">
                        {statusDot(order.status)}
                        {order.status}
                      </div>
                      <span className="order-price">${order.total_price.toFixed(2)}</span>
                    </div>
                    <div className="order-row2" style={{ marginTop: "0.1rem" }}>
                      <span className="order-date">
                        Qty: <span className="text-white">{order.quantity}</span>
                      </span>
                      <span className="order-date">
                        {new Date(order.created_at).toLocaleDateString("en-US", {
                          month: "short", day: "numeric", year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </main>
      </div>

      {/* ── Place Order Modal ── */}
      {modalBook && (
        <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) setModalBook(null); }}>
          <div className="modal">
            <div className="modal-title">Place Order</div>

            <div className="modal-book-info">
              <h3>{modalBook.title}</h3>
              <p>{modalBook.author} · ${modalBook.price.toFixed(2)} each</p>
            </div>

            <div className="modal-row">
              <span className="modal-label">Quantity</span>
              <div className="qty-control">
                <button
                  className="qty-btn"
                  disabled={orderQty <= 1}
                  onClick={() => setOrderQty((q) => Math.max(1, q - 1))}
                >−</button>
                <span className="qty-val">{orderQty}</span>
                <button
                  className="qty-btn"
                  disabled={orderQty >= modalBook.stock}
                  onClick={() => setOrderQty((q) => Math.min(modalBook.stock, q + 1))}
                >+</button>
              </div>
            </div>

            <div className="total-line">
              Total: <strong>${(modalBook.price * orderQty).toFixed(2)}</strong>
            </div>

            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setModalBook(null)}>Cancel</button>
              <button className="btn-confirm" disabled={placing} onClick={placeOrder}>
                {placing ? "Placing…" : "Confirm Order"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast ── */}
      {toast && (
        <div className={`toast ${toast.ok ? "toast-ok" : "toast-err"}`}>
          {toast.msg}
        </div>
      )}
    </>
  );
}
