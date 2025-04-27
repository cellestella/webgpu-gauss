import { useEffect, useRef, useState } from "react";

export function FpsMonitor() {
  const [fps, setFps] = useState(0);
  const frameCountRef = useRef(0);
  const animationFrameId = useRef<number | null>(null);
  const intervalId = useRef<number | null>(null);

  useEffect(() => {
    const loop = () => {
      frameCountRef.current++;
      animationFrameId.current = requestAnimationFrame(loop);
    };
    animationFrameId.current = requestAnimationFrame(loop);

    intervalId.current = window.setInterval(() => {
      setFps(frameCountRef.current);
      frameCountRef.current = 0;
    }, 1000);
    return () => {
      if (animationFrameId.current !== null)
        cancelAnimationFrame(animationFrameId.current);
      if (intervalId.current !== null) clearInterval(intervalId.current);
    };
  }, []);

  return <div>当前FPS: {fps}</div>;
}
