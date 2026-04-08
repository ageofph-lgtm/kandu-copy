import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { Job } from "@/entities/Job";
import { Rating } from "@/entities/Rating";
import { useNavigate, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function Profile() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [profileUser, setProfileUser] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);

  const urlParams = new URLSearchParams(location.search);
  const viewUserId = urlParams.get('userId');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Get current user
        const currentUser = await User.me();
        setUser(currentUser);

        // Get profile user (either from URL param or current user)
        const targetUserId = viewUserId || currentUser.id;
        const users = await User.filter({ id: targetUserId });
        const targetUser = users[0];
        setProfileUser(targetUser);

        // Get user's jobs
        const userJobs = await Job.filter({ employer_id: targetUserId });
        setJobs(userJobs);

        // Get ratings for this user
        const userRatings = await Rating.filter({ rated_id: targetUserId });
        setRatings(userRatings);
      } catch (error) {
        console.error("Error loading profile:", error);
      }
      setLoading(false);
    };

    loadData();
  }, [viewUserId]);

  if (loading) {
    return (
      <div style={{ background: '#1A1A1A', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#FF6600', fontSize: 40, fontWeight: 'bold' }}>φ</div>
      </div>
    );
  }

  if (!profileUser) {
    return <div>Utilizador não encontrado</div>;
  }

  const completedJobs = jobs.filter(j => j.status === 'completed').length;
  const avgRating = ratings.length > 0
    ? (ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length).toFixed(1)
    : '—';
  const xpLevel = Math.floor((profileUser.xp || 0) / 500);
  const levelName = xpLevel > 10 ? 'Mestre' : xpLevel > 5 ? 'Experiente' : 'Iniciante';

  return (
    <div style={{
      background: '#1A1A1A',
      minHeight: '100vh',
      padding: '50px 20px 80px',
      overflowY: 'auto'
    }}>
      {/* Top bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20
      }}>
        <div style={{
          fontSize: 32,
          fontWeight: 'bold',
          color: '#FF6600'
        }}>
          φ
        </div>
        <button
          onClick={() => navigate(createPageUrl("Profile"))}
          style={{
            background: 'none',
            border: 'none',
            color: '#FFF',
            fontSize: 24,
            cursor: 'pointer'
          }}
        >
          ⚙️
        </button>
      </div>

      {/* Hexagonal Avatar */}
      <div style={{
        margin: '20px auto 12px',
        width: 100,
        height: 100,
        clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
        overflow: 'hidden',
        border: '4px solid #FF6600',
        display: 'block'
      }}>
        <img
          src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${profileUser.id}`}
          alt={profileUser.full_name}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }}
        />
      </div>

      {/* Name */}
      <h1 style={{
        fontWeight: 800,
        fontSize: 20,
        color: '#FFF',
        textAlign: 'center',
        margin: '12px 0 4px'
      }}>
        {profileUser.full_name}
      </h1>

      {/* Role */}
      <p style={{
        color: '#AAA',
        textAlign: 'center',
        marginBottom: 10,
        fontSize: 14
      }}>
        {profileUser.user_type === 'worker' ? 'Profissional' : 'Empregador'} · {profileUser.skills?.[0] || 'Especialista'}
      </p>

      {/* Badges */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: 8,
        marginBottom: 16
      }}>
        <div style={{
          background: '#FF660022',
          color: '#FF6600',
          border: '1px solid #FF660044',
          borderRadius: 20,
          padding: '5px 14px',
          fontSize: 13,
          fontWeight: 600
        }}>
          ✓ Verificado
        </div>
        <div style={{
          background: '#FFAA0022',
          color: '#FFAA00',
          border: '1px solid #FFAA0044',
          borderRadius: 20,
          padding: '5px 14px',
          fontSize: 13,
          fontWeight: 600
        }}>
          ⭐ Ultra Verificado
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        gap: 10,
        margin: '16px 0',
        marginBottom: 20
      }}>
        <div style={{
          background: '#2A2A2A',
          borderRadius: 14,
          padding: '14px 8px',
          textAlign: 'center'
        }}>
          <div style={{
            fontWeight: 800,
            fontSize: 18,
            color: '#FF6600',
            marginBottom: 4
          }}>
            {completedJobs}
          </div>
          <div style={{
            color: '#AAA',
            fontSize: 11
          }}>
            Trabalhos
          </div>
        </div>

        <div style={{
          background: '#2A2A2A',
          borderRadius: 14,
          padding: '14px 8px',
          textAlign: 'center'
        }}>
          <div style={{
            fontWeight: 800,
            fontSize: 18,
            color: '#FF6600',
            marginBottom: 4
          }}>
            {avgRating} ★
          </div>
          <div style={{
            color: '#AAA',
            fontSize: 11
          }}>
            Avaliação
          </div>
        </div>

        <div style={{
          background: '#2A2A2A',
          borderRadius: 14,
          padding: '14px 8px',
          textAlign: 'center'
        }}>
          <div style={{
            fontWeight: 800,
            fontSize: 18,
            color: '#22C55E',
            marginBottom: 4
          }}>
            98%
          </div>
          <div style={{
            color: '#AAA',
            fontSize: 11
          }}>
            Presença
          </div>
        </div>
      </div>

      {/* XP Card */}
      <div style={{
        background: '#2A2A2A',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12
      }}>
        {/* XP Progress line with hexagons */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 12,
          position: 'relative',
          height: 40
        }}>
          {/* Hexagon nodes */}
          {[0, 1, 2, 3, 4].map(i => (
            <div
              key={i}
              style={{
                width: 16,
                height: 16,
                borderRadius: '50%',
                background: i < 4 ? '#FF6600' : 'transparent',
                border: i >= 4 ? '2px solid #555' : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
                position: 'relative',
                zIndex: 2
              }}
            />
          ))}
          {/* Progress line behind */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: 0,
              right: 0,
              height: 3,
              background: '#FF6600',
              transform: 'translateY(-50%)',
              zIndex: 1
            }}
          />
        </div>

        {/* XP Info row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12
        }}>
          <div>
            <div style={{
              fontWeight: 800,
              fontSize: 20,
              color: '#FF6600'
            }}>
              {profileUser.xp || 0} XP
            </div>
          </div>
          <div style={{
            color: '#AAA',
            fontSize: 13,
            marginLeft: 'auto'
          }}>
            Nível: {levelName}
          </div>
        </div>
      </div>

      {/* No-show Badge */}
      <div style={{
        display: 'block',
        width: 'fit-content',
        margin: '0 auto 12px',
        background: '#22C55E22',
        border: '1px solid #22C55E44',
        borderRadius: 20,
        padding: '6px 16px'
      }}>
        <span style={{
          color: '#22C55E',
          fontWeight: 600,
          fontSize: 13
        }}>
          ● No-show: 0.02%
        </span>
      </div>

      {/* Skills/Specialties Card */}
      <div style={{
        background: '#2A2A2A',
        borderRadius: 16,
        padding: 16
      }}>
        <h2 style={{
          fontWeight: 'bold',
          fontSize: 15,
          color: '#FFF',
          margin: '0 0 10px 0'
        }}>
          Especialidades
        </h2>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8
        }}>
          {(profileUser.skills || ['Elétrica', 'Solar', 'Automação']).map((skill, idx) => (
            <div
              key={idx}
              style={{
                background: '#FF6600',
                borderRadius: 20,
                padding: '6px 14px',
                color: '#FFF',
                fontSize: 13,
                fontWeight: 600
              }}
            >
              {skill}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}