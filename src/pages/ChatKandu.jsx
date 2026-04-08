import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Send, Info, Briefcase } from "lucide-react";

const INITIAL_MESSAGES = [
  { id: 1, from: "them", text: "Olá! Vi o teu perfil, tens disponibilidade para começar na próxima semana?" },
  { id: 2, from: "me", text: "Bom dia! Sim, tenho disponibilidade a partir de segunda." },
  { id: 3, from: "them", text: "Perfeito, podemos combinar os detalhes?" },
];

export default function ChatKandu() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    const text = input.trim();
    if (!text) return;
    setMessages(prev => [...prev, { id: Date.now(), from: "me", text }]);
    setInput("");
  };

  const handleKey = (e) => {
    if (e.key === "Enter") sendMessage();
  };

  return (
    <div style={{ height: "100vh", background: "#1A1A1A", display: "flex", flexDirection: "column", position: "relative" }}>

      {/* Top bar */}
      <div style={{ background: "#1A1A1A", padding: "50px 16px 12px", display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
        <button onClick={() => navigate(-1)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, flexShrink: 0 }}>
          <ChevronLeft size={26} color="#FF6600" />
        </button>
        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: "50%", background: "#FF6600",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 700, color: "#fff", fontSize: 16, flexShrink: 0,
          }}>
            J
          </div>
          <div>
            <p style={{ color: "#fff", fontWeight: 700, fontSize: 14, margin: 0 }}>João M. (Empregador)</p>
            <p style={{ color: "#22C55E", fontSize: 11, margin: "2px 0 0" }}>● online</p>
          </div>
        </div>
        <Info size={22} color="#FF6600" />
      </div>

      {/* Banner */}
      <div style={{
        background: "#FF6600", padding: "8px 16px",
        display: "flex", alignItems: "center", gap: 8, flexShrink: 0,
        position: "relative", overflow: "hidden",
      }}>
        <svg style={{ position: "absolute", right: 0, top: 0, opacity: 0.1 }} width="80" height="40" viewBox="0 0 80 40">
          <polygon points="20,0 40,10 40,30 20,40 0,30 0,10" fill="white" />
          <polygon points="60,0 80,10 80,30 60,40 40,30 40,10" fill="white" />
        </svg>
        <Briefcase size={14} color="#fff" />
        <p style={{ color: "#fff", fontSize: 13, margin: 0, position: "relative" }}>
          Chat ligado a: <strong>Remodelação Cozinha</strong> · Ativo
        </p>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 12, paddingBottom: 90 }}>
        {messages.map(msg => (
          <div key={msg.id} style={{ display: "flex", justifyContent: msg.from === "me" ? "flex-end" : "flex-start" }}>
            <div style={{
              background: msg.from === "me" ? "#FF6600" : "#2A2A2A",
              borderRadius: msg.from === "me" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
              padding: "10px 14px",
              maxWidth: "75%",
              fontSize: 14,
              color: "#FFFFFF",
              lineHeight: 1.5,
            }}>
              {msg.text}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        padding: "12px 16px 28px", background: "#1A1A1A",
        display: "flex", gap: 10, alignItems: "center",
      }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Escreve uma mensagem..."
          style={{
            flex: 1, background: "#2A2A2A", borderRadius: 50,
            padding: "12px 16px", border: "none", outline: "none",
            color: "#FFFFFF", fontSize: 14,
          }}
        />
        <button
          onClick={sendMessage}
          style={{
            width: 44, height: 44, borderRadius: "50%",
            background: "#FF6600", border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}
        >
          <Send size={18} color="#fff" />
        </button>
      </div>
    </div>
  );
}