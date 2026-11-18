import { useState, useEffect } from "react";
import { usePushError } from "../api";

function areWeFullscreen() {
  return Boolean(document.fullscreenElement);
}

export function useFullscreen() {
  const pushError = usePushError();
  const [isFullscreen, setIsFullscreen] = useState(areWeFullscreen());

  const toggleFullscreen = document.fullscreenEnabled
    ? () =>
        document.fullscreenElement
          ? document.exitFullscreen()
          : document.documentElement.requestFullscreen().catch(pushError)
    : false;

  useEffect(() => {
    const onChange = () => setIsFullscreen(areWeFullscreen());

    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  return [isFullscreen, toggleFullscreen] as const;
}
