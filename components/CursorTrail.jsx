"use client";

import { useEffect, useRef } from "react";

export default function ColorfulCursorTrail() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    const particles = [];
    const maxParticles = 30;
    let hue = 200;

    const handleMouseMove = (e) => {
      hue = (hue + 3) % 360;
      particles.push({
        x: e.clientX,
        y: e.clientY,
        size: Math.random() * 5 + 5,
        color: `hsla(${hue}, 100%, 65%, 1)`,
        life: 1,
      });
      if (particles.length > maxParticles) particles.shift();
    };

    window.addEventListener("mousemove", handleMouseMove);

    let animationId;
    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(p.size * p.life, 0), 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life;
        ctx.shadowBlur = 20;
        ctx.shadowColor = p.color;
        ctx.fill();

        p.life -= 0.035;
        if (p.life <= 0) particles.splice(i, 1);
      }
      ctx.globalAlpha = 1;
      animationId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        pointerEvents: "none",
        zIndex: 9999,
      }}
    />
  );
}