import { useState, useEffect, useCallback } from "react";
import { Plus, X, Trash2, ChevronLeft, ChevronRight, ArrowUpRight, ArrowDownRight, Wallet } from "lucide-react";

const FONT_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=Zilla+Slab:wght@500;700&family=IBM+Plex+Mono:wght@400;500;600&family=Inter:wght@400;500;600&display=swap');`;

const PALETTE = ["#8B6F47", "#5C7A5C", "#7A5C74", "#5C6B7A", "#A6743F", "#6B7A52", "#8A4F45"];

const DEFAULT_CATEGORIES = [
  { id: "c1", name: "Groceries", budget: 450, color: PALETTE[1] },
  { id: "c2", name: "Rent", budget: 1400, color: PALETTE[3] },
  { id: "c3", name: "Transport", budget: 150, color: PALETTE[0] },
  { id: "c4", name: "Dining Out", budget: 200, color: PALETTE[6] },
  { id: "c5", name: "Fun Money", budget: 120, color: PALETTE[2] },
  { id: "c6", name: "Utilities", budget: 180, color: PALETTE[4] },
];

const monthKey = (d) => d.slice(0, 7);
const todayStr = () => new Date().toISOString().slice(0, 10);
const fmt = (n) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const monthLabel = (key) => {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
};
const shiftMonth = (key, delta) => {
  const [y, m] = key.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

export default function BudgetEnvelopes() {
  const [loading, setLoading] = useState(true);
  const [saveError, setSaveError] = useState(false);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [transactions, setTransactions] = useState([]);
  const [month, setMonth] = useState(monthKey(todayStr()));
  const [showAdd, setShowAdd] = useState(false);
  const [showNewCat, setShowNewCat] = useState(false);
  const [activeEnvelope, setActiveEnvelope] = useState(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("budget-data");
      if (raw) {
        const parsed = JSON.parse(raw);
        setCategories(parsed.categories?.length ? parsed.categories : DEFAULT_CATEGORIES);
        setTransactions(parsed.transactions || []);
      } else {
        localStorage.setItem(
          "budget-data",
          JSON.stringify({ categories: DEFAULT_CATEGORIES, transactions: [] })
        );
      }
    } catch (e) {
      // storage unavailable (e.g. private browsing) — defaults stand for this session
    } finally {
      setLoading(false);
    }
  }, []);

  const persist = useCallback((cats, txns) => {
    try {
      localStorage.setItem("budget-data", JSON.stringify({ categories: cats, transactions: txns }));
      setSaveError(false);
    } catch (e) {
      setSaveError(true);
    }
  }, []);

  const monthTxns = transactions.filter((t) => monthKey(t.date) === month);
  const income = monthTxns.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expenses = monthTxns.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const spentByCategory = (catId) =>
    monthTxns.filter((t) => t.type === "expense" && t.categoryId === catId).reduce((s, t) => s + t.amount, 0);

  function addTransaction(txn) {
    const next = [{ ...txn, id: crypto.randomUUID(), date: txn.date || todayStr() }, ...transactions];
    setTransactions(next);
    persist(categories, next);
    setShowAdd(false);
  }

  function deleteTransaction(id) {
    const next = transactions.filter((t) => t.id !== id);
    setTransactions(next);
    persist(categories, next);
  }

  function addCategory(cat) {
    const next = [...categories, { ...cat, id: crypto.randomUUID() }];
    setCategories(next);
    persist(next, transactions);
    setShowNewCat(false);
  }

  function deleteCategory(id) {
    const next = categories.filter((c) => c.id !== id);
    setCategories(next);
    persist(next, transactions);
    setActiveEnvelope(null);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#1B2A22" }}>
        <style>{FONT_IMPORT}</style>
        <p style={{ fontFamily: "Inter, sans-serif", color: "#F2EBDA" }}>Opening the ledger…</p>
      </div>
    );
  }

  const remaining = income - expenses;

  return (
    <div className="min-h-screen pb-24" style={{ background: "#1B2A22", fontFamily: "Inter, sans-serif" }}>
      <style>{FONT_IMPORT}</style>

      {/* Header / ledger tape */}
      <div className="px-5 pt-6 pb-4" style={{ background: "#16211B" }}>
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <div className="flex items-center gap-2" style={{ color: "#B8923F" }}>
            <Wallet size={20} strokeWidth={2} />
            <span style={{ fontFamily: "'Zilla Slab', serif", fontWeight: 700, fontSize: 18, letterSpacing: 0.3 }}>
              Envelope Budget
            </span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-4 mt-4 max-w-2xl mx-auto">
          <button
            onClick={() => setMonth((m) => shiftMonth(m, -1))}
            className="p-1.5 rounded-full transition-opacity hover:opacity-70"
            style={{ color: "#D9CFB8" }}
            aria-label="Previous month"
          >
            <ChevronLeft size={20} />
          </button>
          <span
            style={{ fontFamily: "'Zilla Slab', serif", fontWeight: 700, fontSize: 22, color: "#F2EBDA", minWidth: 190, textAlign: "center" }}
          >
            {monthLabel(month)}
          </span>
          <button
            onClick={() => setMonth((m) => shiftMonth(m, 1))}
            className="p-1.5 rounded-full transition-opacity hover:opacity-70"
            style={{ color: "#D9CFB8" }}
            aria-label="Next month"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3 max-w-2xl mx-auto mt-5">
          <StatChip label="Income" value={fmt(income)} icon={<ArrowUpRight size={14} />} tone="#5C7A5C" />
          <StatChip label="Spent" value={fmt(expenses)} icon={<ArrowDownRight size={14} />} tone="#8A4F45" />
          <StatChip label="Left" value={fmt(remaining)} tone={remaining < 0 ? "#8A4F45" : "#B8923F"} />
        </div>
      </div>

      {/* Envelope grid */}
      <div className="max-w-2xl mx-auto px-5 mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 style={{ fontFamily: "'Zilla Slab', serif", fontWeight: 700, color: "#F2EBDA", fontSize: 15, letterSpacing: 0.5, textTransform: "uppercase" }}>
            Envelopes
          </h2>
          <button
            onClick={() => setShowNewCat(true)}
            className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full"
            style={{ color: "#B8923F", border: "1px solid #3A4A3E" }}
          >
            <Plus size={13} /> New envelope
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {categories.map((cat) => {
            const spent = spentByCategory(cat.id);
            const pct = cat.budget > 0 ? Math.min(spent / cat.budget, 1) : 0;
            const over = spent > cat.budget;
            return (
              <Envelope
                key={cat.id}
                cat={cat}
                spent={spent}
                pct={pct}
                over={over}
                onClick={() => setActiveEnvelope(cat)}
              />
            );
          })}
        </div>
      </div>

      {/* Recent transactions */}
      <div className="max-w-2xl mx-auto px-5 mt-8">
        <h2 style={{ fontFamily: "'Zilla Slab', serif", fontWeight: 700, color: "#F2EBDA", fontSize: 15, letterSpacing: 0.5, textTransform: "uppercase" }}>
          This month's entries
        </h2>
        <div className="mt-3 rounded-xl overflow-hidden" style={{ background: "#20301F" }}>
          {monthTxns.length === 0 && (
            <p className="text-sm px-4 py-6 text-center" style={{ color: "#8FA090" }}>
              No entries yet — tap the + below to log one.
            </p>
          )}
          {monthTxns.map((t, i) => {
            const cat = categories.find((c) => c.id === t.categoryId);
            return (
              <div
                key={t.id}
                className="flex items-center justify-between px-4 py-3 group"
                style={{ borderTop: i === 0 ? "none" : "1px solid #2B3D2A" }}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ background: t.type === "income" ? "#5C7A5C" : cat?.color || "#8A4F45" }}
                  />
                  <div>
                    <p style={{ color: "#F2EBDA", fontSize: 14, fontWeight: 500 }}>
                      {t.type === "income" ? "Income" : cat?.name || "Uncategorized"}
                    </p>
                    <p style={{ color: "#8FA090", fontSize: 12 }}>
                      {t.note ? `${t.note} · ` : ""}
                      {new Date(t.date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    style={{
                      fontFamily: "'IBM Plex Mono', monospace",
                      color: t.type === "income" ? "#7FA47F" : "#F2EBDA",
                      fontSize: 14,
                    }}
                  >
                    {t.type === "income" ? "+" : "−"}
                    {fmt(t.amount)}
                  </span>
                  <button
                    onClick={() => deleteTransaction(t.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ color: "#8A4F45" }}
                    aria-label="Delete entry"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        {saveError && (
          <p className="text-xs mt-2" style={{ color: "#C97A6D" }}>
            Couldn't save just now — your entry is showing but may not persist.
          </p>
        )}
      </div>

      {/* Floating add button */}
      <button
        onClick={() => setShowAdd(true)}
        className="fixed bottom-6 right-6 rounded-full flex items-center justify-center shadow-lg"
        style={{ width: 56, height: 56, background: "#B8923F", color: "#1B2A22" }}
        aria-label="Add entry"
      >
        <Plus size={26} strokeWidth={2.5} />
      </button>

      {showAdd && (
        <AddTransactionModal
          categories={categories}
          onClose={() => setShowAdd(false)}
          onSubmit={addTransaction}
        />
      )}
      {showNewCat && (
        <NewCategoryModal onClose={() => setShowNewCat(false)} onSubmit={addCategory} />
      )}
      {activeEnvelope && (
        <EnvelopeDetailModal
          cat={activeEnvelope}
          spent={spentByCategory(activeEnvelope.id)}
          onClose={() => setActiveEnvelope(null)}
          onDelete={() => deleteCategory(activeEnvelope.id)}
        />
      )}
    </div>
  );
}

function StatChip({ label, value, icon, tone }) {
  return (
    <div className="rounded-lg px-3 py-2.5 text-center" style={{ background: "#20301F" }}>
      <div className="flex items-center justify-center gap-1" style={{ color: tone }}>
        {icon}
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 15, fontWeight: 600 }}>{value}</span>
      </div>
      <p className="text-[10px] mt-0.5 uppercase tracking-wide" style={{ color: "#8FA090" }}>
        {label}
      </p>
    </div>
  );
}

function Envelope({ cat, spent, pct, over, onClick }) {
  const sealPct = Math.round(pct * 100);
  return (
    <button
      onClick={onClick}
      className="relative rounded-b-xl text-left overflow-hidden transition-transform active:scale-[0.98]"
      style={{ background: "#F2EBDA", height: 168, paddingTop: 54 }}
    >
      {/* flap */}
      <div
        className="absolute top-0 left-0 w-full"
        style={{
          height: 58,
          background: cat.color,
          clipPath: "polygon(0 0, 100% 0, 50% 100%)",
        }}
      />
      {/* seal */}
      <div
        className="absolute rounded-full flex items-center justify-center"
        style={{
          top: 30,
          left: "50%",
          transform: "translateX(-50%)",
          width: 34,
          height: 34,
          background: "#F2EBDA",
          border: `2px solid ${over ? "#8A4F45" : cat.color}`,
        }}
      >
        <span
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 10,
            fontWeight: 600,
            color: over ? "#8A4F45" : "#20201C",
          }}
        >
          {sealPct}%
        </span>
      </div>

      <div className="px-3 pt-2 flex flex-col h-full">
        <p
          className="text-center uppercase"
          style={{ fontFamily: "'Zilla Slab', serif", fontWeight: 700, fontSize: 13, letterSpacing: 0.6, color: "#20201C" }}
        >
          {cat.name}
        </p>
        <div className="flex-1 flex flex-col justify-end">
          <p className="text-center" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "#5A5648" }}>
            {fmt(spent)} of {fmt(cat.budget)}
          </p>
          <div className="mx-3 mt-2 mb-3 h-2 rounded-full overflow-hidden" style={{ background: "#DCD2B8" }}>
            <div
              className="h-full rounded-full"
              style={{ width: `${Math.min(pct * 100, 100)}%`, background: over ? "#8A4F45" : cat.color }}
            />
          </div>
        </div>
      </div>
    </button>
  );
}

function ModalShell({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" style={{ background: "rgba(15,20,15,0.6)" }}>
      <div className="w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl p-5" style={{ background: "#20301F", maxHeight: "85vh", overflowY: "auto" }}>
        <div className="flex items-center justify-between mb-4">
          <h3 style={{ fontFamily: "'Zilla Slab', serif", fontWeight: 700, fontSize: 18, color: "#F2EBDA" }}>{title}</h3>
          <button onClick={onClose} style={{ color: "#8FA090" }} aria-label="Close">
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function AddTransactionModal({ categories, onClose, onSubmit }) {
  const [type, setType] = useState("expense");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState(categories[0]?.id || "");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(todayStr());

  const inputStyle = {
    background: "#16211B",
    color: "#F2EBDA",
    border: "1px solid #3A4A3E",
    borderRadius: 8,
    padding: "9px 12px",
    fontSize: 14,
    width: "100%",
  };

  function submit() {
    const num = parseFloat(amount);
    if (!num || num <= 0) return;
    onSubmit({ type, amount: num, categoryId: type === "expense" ? categoryId : null, note, date });
  }

  return (
    <ModalShell title="Log an entry" onClose={onClose}>
      <div className="flex gap-2 mb-4">
        {["expense", "income"].map((t) => (
          <button
            key={t}
            onClick={() => setType(t)}
            className="flex-1 py-2 rounded-lg text-sm font-medium capitalize"
            style={{
              background: type === t ? "#B8923F" : "#16211B",
              color: type === t ? "#1B2A22" : "#8FA090",
            }}
          >
            {t}
          </button>
        ))}
      </div>

      <label className="text-xs mb-1 block" style={{ color: "#8FA090" }}>Amount</label>
      <input
        style={{ ...inputStyle, fontFamily: "'IBM Plex Mono', monospace" }}
        type="number"
        inputMode="decimal"
        placeholder="0.00"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="mb-3"
      />

      {type === "expense" && (
        <>
          <label className="text-xs mb-1 block" style={{ color: "#8FA090" }}>Envelope</label>
          <select style={inputStyle} value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="mb-3">
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </>
      )}

      <label className="text-xs mb-1 block" style={{ color: "#8FA090" }}>Date</label>
      <input style={{ ...inputStyle }} type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mb-3" />

      <label className="text-xs mb-1 block" style={{ color: "#8FA090" }}>Note (optional)</label>
      <input
        style={inputStyle}
        type="text"
        placeholder="e.g. Farmers market"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        className="mb-5"
      />

      <button
        onClick={submit}
        className="w-full py-2.5 rounded-lg font-medium"
        style={{ background: "#B8923F", color: "#1B2A22" }}
      >
        Save entry
      </button>
    </ModalShell>
  );
}

function NewCategoryModal({ onClose, onSubmit }) {
  const [name, setName] = useState("");
  const [budget, setBudget] = useState("");
  const [color, setColor] = useState(PALETTE[0]);

  const inputStyle = {
    background: "#16211B",
    color: "#F2EBDA",
    border: "1px solid #3A4A3E",
    borderRadius: 8,
    padding: "9px 12px",
    fontSize: 14,
    width: "100%",
  };

  function submit() {
    const num = parseFloat(budget);
    if (!name.trim() || !num || num <= 0) return;
    onSubmit({ name: name.trim(), budget: num, color });
  }

  return (
    <ModalShell title="New envelope" onClose={onClose}>
      <label className="text-xs mb-1 block" style={{ color: "#8FA090" }}>Name</label>
      <input style={inputStyle} type="text" placeholder="e.g. Pet Care" value={name} onChange={(e) => setName(e.target.value)} className="mb-3" />

      <label className="text-xs mb-1 block" style={{ color: "#8FA090" }}>Monthly budget</label>
      <input
        style={{ ...inputStyle, fontFamily: "'IBM Plex Mono', monospace" }}
        type="number"
        inputMode="decimal"
        placeholder="0.00"
        value={budget}
        onChange={(e) => setBudget(e.target.value)}
        className="mb-3"
      />

      <label className="text-xs mb-2 block" style={{ color: "#8FA090" }}>Color</label>
      <div className="flex gap-2 mb-5">
        {PALETTE.map((c) => (
          <button
            key={c}
            onClick={() => setColor(c)}
            className="w-8 h-8 rounded-full"
            style={{ background: c, border: color === c ? "2px solid #F2EBDA" : "2px solid transparent" }}
            aria-label={`Choose color ${c}`}
          />
        ))}
      </div>

      <button onClick={submit} className="w-full py-2.5 rounded-lg font-medium" style={{ background: "#B8923F", color: "#1B2A22" }}>
        Create envelope
      </button>
    </ModalShell>
  );
}

function EnvelopeDetailModal({ cat, spent, onClose, onDelete }) {
  const remaining = cat.budget - spent;
  return (
    <ModalShell title={cat.name} onClose={onClose}>
      <div className="flex justify-center mb-4">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{ background: cat.color }}
        >
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, fontWeight: 600, color: "#F2EBDA" }}>
            {cat.budget > 0 ? Math.round((spent / cat.budget) * 100) : 0}%
          </span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="rounded-lg px-3 py-2 text-center" style={{ background: "#16211B" }}>
          <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 15, color: "#F2EBDA" }}>{fmt(spent)}</p>
          <p className="text-[10px] uppercase mt-0.5" style={{ color: "#8FA090" }}>Spent</p>
        </div>
        <div className="rounded-lg px-3 py-2 text-center" style={{ background: "#16211B" }}>
          <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 15, color: remaining < 0 ? "#C97A6D" : "#F2EBDA" }}>
            {fmt(remaining)}
          </p>
          <p className="text-[10px] uppercase mt-0.5" style={{ color: "#8FA090" }}>Remaining</p>
        </div>
      </div>
      <button
        onClick={onDelete}
        className="w-full py-2.5 rounded-lg font-medium flex items-center justify-center gap-2"
        style={{ background: "transparent", border: "1px solid #8A4F45", color: "#C97A6D" }}
      >
        <Trash2 size={15} /> Delete envelope
      </button>
    </ModalShell>
  );
}
