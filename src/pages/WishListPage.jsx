import { useState } from "react";

const COLORS = {
  primary: "#7C3AED", primaryDark: "#5B21B6", accent: "#F59E0B",
  bg: "#F5F5F7", card: "#FFFFFF", text: "#1F2937", textLight: "#6B7280",
  border: "#E5E7EB", success: "#10B981",
};

const INITIAL_WISHES = [
  { id: 1, name: "📚 Atomic Habits", desc: "James Clear · Cualquier edición" },
  { id: 2, name: "🕯️ Velas aromáticas", desc: "Lavanda o vainilla, cualquier marca" },
  { id: 3, name: "☕ Cafetera italiana", desc: "Moka 3–6 tazas" },
];

export default function WishListPage({ onBack }) {
  const [wishes, setWishes] = useState(INITIAL_WISHES);
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [editId, setEditId] = useState(null);

  const handleAdd = () => {
    if (!newName.trim()) return;
    if (editId) {
      setWishes(w => w.map(x => x.id === editId ? { ...x, name: newName, desc: newDesc } : x));
      setEditId(null);
    } else {
      setWishes(w => [...w, { id: Date.now(), name: newName, desc: newDesc }]);
    }
    setNewName(""); setNewDesc(""); setShowForm(false);
  };

  const handleEdit = (wish) => {
    setEditId(wish.id); setNewName(wish.name); setNewDesc(wish.desc); setShowForm(true);
  };

  const handleDelete = (id) => setWishes(w => w.filter(x => x.id !== id));

  return (
    <div style={{ background: COLORS.bg, minHeight: "100vh", paddingBottom: 80 }}>
      {/* Header */}
      <div style={{
        background: "#fff", borderBottom: "1px solid " + COLORS.border,
        padding: "12px 16px", display: "flex", alignItems: "center",
        gap: 10, position: "sticky", top: 0, zIndex: 10,
      }}>
        <button onClick={onBack} style={{ background: "none", border: "none", fontSize: 20, color: COLORS.primary, fontWeight: 800, cursor: "pointer", padding: "2px 8px 2px 0" }}>‹</button>
        <span style={{ fontSize: 16, fontWeight: 800, color: COLORS.text, flex: 1 }}>Lista de deseos</span>
        <button onClick={() => { setShowForm(true); setEditId(null); setNewName(""); setNewDesc(""); }} style={{
          background: COLORS.primary, color: "#fff", border: "none",
          borderRadius: 20, padding: "6px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer",
        }}>+ Agregar</button>
      </div>

      {/* Info banner */}
      <div style={{ background: "#F5F0FF", padding: "10px 16px", borderBottom: "1px solid #EDE9FF" }}>
        <p style={{ fontSize: 12, color: "#5B21B6", fontWeight: 600, lineHeight: 1.5, margin: 0 }}>
          Tus amigos pueden regalarte algo directamente — nuevo o de segunda mano 🎁
        </p>
      </div>

      {/* Form */}
      {showForm && (
        <div style={{ background: "#fff", margin: "10px 12px", borderRadius: 14, border: "1.5px solid " + COLORS.primary, padding: "14px" }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: COLORS.text, marginBottom: 10 }}>
            {editId ? "Editar deseo" : "Nuevo deseo"}
          </p>
          <input
            value={newName} onChange={e => setNewName(e.target.value)}
            placeholder="Ej: 📚 Libro que me gusta..."
            style={{ width: "100%", padding: "10px 12px", border: "1.5px solid " + COLORS.border, borderRadius: 10, fontSize: 13, marginBottom: 8, outline: "none" }}
          />
          <input
            value={newDesc} onChange={e => setNewDesc(e.target.value)}
            placeholder="Descripción opcional..."
            style={{ width: "100%", padding: "10px 12px", border: "1.5px solid " + COLORS.border, borderRadius: 10, fontSize: 13, marginBottom: 10, outline: "none" }}
          />
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setShowForm(false)} style={{ flex: 1, padding: "10px", background: "#F3F4F6", color: COLORS.textLight, border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Cancelar</button>
            <button onClick={handleAdd} style={{ flex: 2, padding: "10px", background: COLORS.primary, color: "#fff", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              {editId ? "Guardar cambios" : "Agregar deseo"}
            </button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {wishes.length === 0 && !showForm && (
        <div style={{ textAlign: "center", padding: "60px 20px", color: COLORS.textLight }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🎁</div>
          <p style={{ fontWeight: 700, fontSize: 16, color: COLORS.text, marginBottom: 6 }}>Tu lista está vacía</p>
          <p style={{ fontSize: 14 }}>Agregá cosas que te gustaría recibir</p>
        </div>
      )}

      {/* Wish cards */}
      {wishes.map(wish => (
        <div key={wish.id} style={{
          background: "#fff", margin: "8px 12px", borderRadius: 14,
          border: "1px solid " + COLORS.border, padding: "13px 14px",
        }}>
          <p style={{ fontSize: 14, fontWeight: 800, color: COLORS.text, marginBottom: 3 }}>{wish.name}</p>
          {wish.desc && <p style={{ fontSize: 12, color: COLORS.textLight, marginBottom: 10 }}>{wish.desc}</p>}
          <button style={{
            width: "100%", padding: "10px", marginBottom: 8,
            background: "linear-gradient(135deg, #10B981, #059669)",
            color: "#fff", border: "none", borderRadius: 10,
            fontSize: 13, fontWeight: 700, cursor: "pointer",
          }}>🎁 Quiero regalarte esto</button>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={() => handleEdit(wish)} style={{ flex: 1, padding: "7px", background: "#F5F0FF", color: COLORS.primary, border: "none", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>✏️ Editar</button>
            <button onClick={() => handleDelete(wish.id)} style={{ flex: 1, padding: "7px", background: "#FEF2F2", color: "#EF4444", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>🗑️ Eliminar</button>
          </div>
        </div>
      ))}

      {wishes.length > 0 && !showForm && (
        <div style={{ padding: "8px 12px 16px" }}>
          <button onClick={() => { setShowForm(true); setEditId(null); setNewName(""); setNewDesc(""); }} style={{
            width: "100%", padding: "13px", background: COLORS.primary,
            color: "#fff", border: "none", borderRadius: 12,
            fontSize: 14, fontWeight: 700, cursor: "pointer",
          }}>+ Agregar otro deseo</button>
        </div>
      )}
    </div>
  );
}
