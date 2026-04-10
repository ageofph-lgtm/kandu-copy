import React, { useState, useRef, useEffect } from "react";

const SPLASH_VIDEO = "https://base44.app/api/apps/69c166ad19149fb0c07883cb/files/mp/public/69c166ad19149fb0c07883cb/723a560e9_splash_fast.mp4";
const SPLASH_SHOWN_KEY = "kandu_splash_v1";

export default function SplashScreen({ onDone }) {
  const videoRef = useRef(null);
  const [fading, setFading] = useState(false);

  // Only show once per session
  const alreadySeen = sessionStorage.getItem(SPLASH_SHOWN_KEY);

  useEffect(() => {
    if (alreadySeen) { onDone(); return; }

    const video = videoRef.current;
    if (!video) return;

    // Auto-play muted (required by browsers), then fade out when ended
    video.play().catch(() => {
      // If autoplay blocked, skip splash
      finish();
    });

    const handleEnd = () => finish();
    video.addEventListener("ended", handleEnd);
    return () => video.removeEventListener("ended", handleEnd);
  }, []);

  const finish = () => {
    sessionStorage.setItem(SPLASH_SHOWN_KEY, "1");
    setFading(true);
    setTimeout(() => onDone(), 500); // wait for fade-out CSS
  };

  if (alreadySeen) return null;

  return (
    <div
      onClick={finish}
      style={{
        position: "fixed",
        inset: 0,
        background: "#111016",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "opacity 0.5s ease",
        opacity: fading ? 0 : 1,
        cursor: "pointer",
      }}
    >
      <video
        ref={videoRef}
        src={SPLASH_VIDEO}
        muted
        playsInline
        preload="auto"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
      />
      {/* Skip hint */}
      <div style={{
        position: "absolute",
        bottom: 32,
        right: 24,
        color: "rgba(255,255,255,0.35)",
        fontSize: 11,
        fontWeight: 500,
        letterSpacing: 1,
        textTransform: "uppercase",
      }}>
        Toque para saltar
      </div>
    </div>
  );
}
