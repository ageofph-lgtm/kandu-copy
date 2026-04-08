import React, { useState, useEffect } from "react";
import { Job } from "@/entities/Job";
import { User } from "@/entities/User";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

const CATEGORIES = ["Elétrica", "Canalização", "Pintura", "Mão de Obra", "Carpintaria"];

const LOCATION_COORDS = {
  "Lisboa - Centro": { lat: 38.713, lon: -9.139 },
  "Lisboa - Arroios": { lat: 38.73, lon: -9.135 },
  "Lisboa - Estrela": { lat: 38.712, lon: -9.16 },
  "Porto - Centro": { lat: 41.15, lon: -8.61 },
};

export default function NewJob() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    price_type: "hourly",
    price: "",
    location: "Lisboa - Centro",
    description: "",
    start_date: "",
    end_date: ""
  });

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await User.me();
        if (userData.user_type !== 'employer' && userData.user_type !== 'admin') {
          navigate(createPageUrl("Home"));
          return;
        }
        setUser(userData);
      } catch {
        navigate(createPageUrl("Home"));
      }
    };
    loadUser();
  }, [navigate]);

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.category || !formData.price) {
      alert("Por favor, preencha todos os campos obrigatórios");
      return;
    }

    setIsSubmitting(true);
    try {
      const coords = LOCATION_COORDS[formData.location];
      await Job.create({
        title: formData.title,
        category: formData.category,
        price_type: formData.price_type,
        price: parseFloat(formData.price),
        location: formData.location,
        description: formData.description,
        start_date: formData.start_date,
        end_date: formData.end_date,
        employer_id: user.id,
        latitude: coords.lat + (Math.random() - 0.5) * 0.005,
        longitude: coords.lon + (Math.random() - 0.5) * 0.005,
        views: 0,
        status: "open"
      });
      navigate(createPageUrl("MyJobs"));
    } catch (error) {
      console.error("Error:", error);
      alert("Erro ao publicar obra");
    }
    setIsSubmitting(false);
  };

  if (!user) {
    return (
      <div style={{ background: '#1A1A1A', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#FF6600', fontSize: 40, fontWeight: 'bold' }}>φ</div>
      </div>
    );
  }

  return (
    <div style={{
      background: '#1A1A1A',
      minHeight: '100vh',
      paddingBottom: 100,
      overflowY: 'auto'
    }}>
      {/* Top bar */}
      <div style={{
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'sticky',
        top: 0,
        background: '#1A1A1A',
        borderBottom: '1px solid #2A2A2A',
        zIndex: 10
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            background: 'none',
            border: 'none',
            color: '#FF6600',
            fontSize: 24,
            cursor: 'pointer',
            position: 'absolute',
            left: 20
          }}
        >
          ←
        </button>
        <h1 style={{
          fontWeight: 700,
          fontSize: 18,
          color: '#FFF',
          margin: 0
        }}>
          Nova Obra
        </h1>
      </div>

      {/* Sections */}
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        {/* Section 1: Title */}
        <div style={{
          borderBottom: '3px solid #FF6600',
          padding: '16px 20px'
        }}>
          <label style={{
            color: '#AAA',
            fontSize: 13,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: 1,
            display: 'block',
            marginBottom: 12
          }}>
            Título da Obra
          </label>
          <input
            type="text"
            placeholder="Nova remodelação..."
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            style={{
              background: '#2A2A2A',
              border: '2px solid #FF6600',
              borderRadius: 12,
              padding: 14,
              color: '#FFF',
              width: '100%',
              boxSizing: 'border-box',
              fontSize: 14,
              outline: 'none',
              fontFamily: 'inherit'
            }}
          />
        </div>

        {/* Section 2: Category */}
        <div style={{
          borderBottom: '3px solid #FF6600',
          padding: '16px 20px'
        }}>
          <label style={{
            color: '#AAA',
            fontSize: 13,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: 1,
            display: 'block',
            marginBottom: 12
          }}>
            Categoria
          </label>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8
          }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setFormData({ ...formData, category: cat })}
                style={{
                  background: formData.category === cat ? '#FF6600' : '#2A2A2A',
                  color: formData.category === cat ? '#FFF' : '#AAA',
                  borderRadius: 20,
                  padding: '8px 16px',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: formData.category === cat ? 700 : 400,
                  fontSize: 14,
                  transition: 'all 0.2s'
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Section 3: Price Type */}
        <div style={{
          borderBottom: '3px solid #FF6600',
          padding: '16px 20px'
        }}>
          <label style={{
            color: '#AAA',
            fontSize: 13,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: 1,
            display: 'block',
            marginBottom: 12
          }}>
            Tipo de Preço
          </label>

          {/* Price input + buttons */}
          <div style={{
            display: 'flex',
            gap: 8,
            marginBottom: 12
          }}>
            <input
              type="number"
              placeholder="25 €/hora"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              style={{
                flex: 1,
                background: '#2A2A2A',
                border: '2px solid #FF6600',
                borderRadius: 10,
                padding: 12,
                color: '#FFF',
                fontSize: 14,
                outline: 'none',
                fontFamily: 'inherit'
              }}
            />
          </div>

          {/* Price type buttons */}
          <div style={{
            display: 'flex',
            gap: 8,
            marginBottom: 16
          }}>
            {['fixed', 'hourly', 'negotiable'].map(type => {
              const labels = { fixed: 'Projeto', hourly: 'Hourly', negotiable: 'Negociável' };
              return (
                <button
                  key={type}
                  onClick={() => setFormData({ ...formData, price_type: type })}
                  style={{
                    background: formData.price_type === type ? '#FF6600' : '#2A2A2A',
                    color: formData.price_type === type ? '#FFF' : '#AAA',
                    border: 'none',
                    borderRadius: 20,
                    padding: '8px 16px',
                    cursor: 'pointer',
                    fontWeight: formData.price_type === type ? 700 : 400,
                    fontSize: 13,
                    transition: 'all 0.2s'
                  }}
                >
                  {labels[type]}
                </button>
              );
            })}
          </div>

          {/* Info box */}
          <div style={{
            background: '#FF660011',
            border: '1px solid #FF660044',
            borderRadius: 10,
            padding: 12,
            display: 'flex',
            gap: 8
          }}>
            <span style={{ fontSize: 16, flexShrink: 0 }}>ℹ️</span>
            <p style={{
              color: '#AAA',
              fontSize: 12,
              fontStyle: 'italic',
              margin: 0
            }}>
              O preço base considera apenas o trabalho principal, não inclui materiais ou ferramentas
            </p>
          </div>
        </div>

        {/* Section 4: Location */}
        <div style={{
          borderBottom: '3px solid #FF6600',
          padding: '16px 20px'
        }}>
          <label style={{
            color: '#AAA',
            fontSize: 13,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: 1,
            display: 'block',
            marginBottom: 12
          }}>
            Localização
          </label>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12
          }}>
            <span style={{ fontSize: 20, color: '#FF6600' }}>📍</span>
            <select
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              style={{
                flex: 1,
                background: '#2A2A2A',
                border: '2px solid #FF6600',
                borderRadius: 10,
                padding: 12,
                color: '#FFF',
                fontSize: 14,
                outline: 'none'
              }}
            >
              {Object.keys(LOCATION_COORDS).map(loc => (
                <option key={loc} value={loc} style={{ background: '#2A2A2A', color: '#FFF' }}>
                  {loc}
                </option>
              ))}
            </select>
            <div style={{
              width: 44,
              height: 24,
              background: '#FF6600',
              borderRadius: 12,
              cursor: 'pointer'
            }} />
          </div>
        </div>

        {/* Section 5: Photos */}
        <div style={{
          borderBottom: '3px solid #FF6600',
          padding: '16px 20px'
        }}>
          <label style={{
            color: '#AAA',
            fontSize: 13,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: 1,
            display: 'block',
            marginBottom: 12
          }}>
            Fotos de Local
          </label>
          <div style={{
            display: 'flex',
            gap: 12
          }}>
            {[1, 2, 3].map(slot => (
              <div
                key={slot}
                style={{
                  flex: 1,
                  height: 80,
                  background: '#2A2A2A',
                  border: '2px dashed #FF660066',
                  borderRadius: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <span style={{ fontSize: 24, color: '#666' }}>📷</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Submit button */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: '#1A1A1A',
        padding: '16px 20px',
        borderTop: '1px solid #2A2A2A'
      }}>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || !formData.title.trim() || !formData.category || !formData.price}
          style={{
            background: isSubmitting || !formData.title.trim() || !formData.category || !formData.price ? 'rgba(255, 102, 0, 0.4)' : '#FF6600',
            border: 'none',
            borderRadius: 14,
            padding: 16,
            fontWeight: 700,
            color: '#FFF',
            width: '100%',
            fontSize: 16,
            cursor: isSubmitting || !formData.title.trim() || !formData.category || !formData.price ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s'
          }}
        >
          {isSubmitting ? 'A publicar...' : 'Publicar Obra'}
        </button>
      </div>
    </div>
  );
}