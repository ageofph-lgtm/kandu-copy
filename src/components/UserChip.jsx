import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

/**
 * UserChip — Avatar + nome clicável que navega para o perfil público.
 * Funciona para qualquer user_type. Usar em toda a app.
 */
export default function UserChip({ user, size = "sm", showType = false, style = {} }) {
  const navigate = useNavigate();
  if (!user) return null;

  const sizes = {
    xs: { avatar: 28, font: 12, nameFont: 13 },
    sm: { avatar: 36, font: 14, nameFont: 14 },
    md: { avatar: 48, font: 18, nameFont: 15 },
    lg: { avatar: 64, font: 24, nameFont: 17 },
  };
  const s = sizes[size] || sizes.sm;
  const typeColor = user.user_type === "employer" ? "#3B82F6" : user.user_type === "admin" ? "#8B5CF6" : "#F4621F";
  const typeLabel = user.user_type === "employer" ? "Empregador" : user.user_type === "admin" ? "Admin" : "Profissional";
  const initials = (user.full_name || user.email || "?").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div
      onClick={() => navigate(`${createPageUrl("Profile")}?userId=${user.id}`)}
      style={{
        display: "flex", alignItems: "center", gap: 10,
        cursor: "pointer", borderRadius: 10, padding: "6px 10px",
        transition: "background 0.15s",
        ...style
      }}
      onMouseEnter={e => e.currentTarget.style.background = "rgba(244,98,31,0.08)"}
      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
      title={`Ver perfil de ${user.full_name || user.email}`}
    >
      <div style={{
        width: s.avatar, height: s.avatar, borderRadius: "50%",
        background: typeColor, border: `2px solid ${typeColor}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: s.font, fontWeight: 800, color: "#fff",
        overflow: "hidden", flexShrink: 0
      }}>
        {user.avatar_url
          ? <img src={user.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : initials}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: s.nameFont, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {user.full_name || user.email}
          {user.verified && <span style={{ marginLeft: 4, color: "#22c55e", fontSize: 11 }}>✓</span>}
        </div>
        {showType && (
          <div style={{ fontSize: 11, color: typeColor, fontWeight: 600, marginTop: 1 }}>{typeLabel}</div>
        )}
        {user.rating && (
          <div style={{ fontSize: 11, color: "#888", marginTop: 1 }}>⭐ {Number(user.rating).toFixed(1)} · {user.city || "Portugal"}</div>
        )}
      </div>
      <span style={{ fontSize: 11, color: "#F4621F", fontWeight: 600, flexShrink: 0 }}>→</span>
    </div>
  );
}
