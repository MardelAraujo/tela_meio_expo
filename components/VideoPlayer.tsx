"use client";

import { useEffect, useRef, useState } from "react";
import { PlayIcon } from "./icons";

export function VideoPlayer({ src, className, autoPlay = false, onPlayingChange }: { src: string; className: string; autoPlay?: boolean; onPlayingChange?: (playing: boolean) => void }) {
  // Autoplay is muted on purpose: it runs during the guided tour on a totem
  // with no audio. Native controls stay available so a presenter can unmute a
  // clip on the spot.
  const [playing, setPlayingState] = useState(autoPlay);
  const [error, setError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const setPlaying = (next: boolean) => {
    setPlayingState(next);
    onPlayingChange?.(next);
  };

  // React applies `muted` as a property once the element is live, so the
  // browser evaluates the autoplay attribute against a still-unmuted video
  // and blocks it. Mute first, then ask to play.
  useEffect(() => {
    const video = videoRef.current;
    if (!autoPlay || !video) return;
    video.muted = true;
    video.play().catch(() => {});
  }, [autoPlay, src]);

  return (
    <div className="stage-panel-video-wrap">
      <video
        key={src}
        ref={videoRef}
        src={src}
        autoPlay={autoPlay}
        muted={autoPlay}
        loop={autoPlay}
        playsInline
        controls={playing}
        className={className}
        onEnded={() => setPlaying(false)}
        onError={() => setError(true)}
      />
      {error ? (
        <p className="video-error" role="alert">Não foi possível carregar o vídeo.</p>
      ) : (
        !playing &&
        !autoPlay && (
          <button
            className="video-play-button"
            aria-label="Reproduzir vídeo"
            onClick={() => {
              setPlaying(true);
              // play() rejects with AbortError if the element leaves the
              // document before playback starts — which is exactly what the
              // back button in StagePanel does. Nothing to recover from: the
              // player is already gone.
              videoRef.current?.play().catch(() => {});
            }}
          >
            <PlayIcon size={18} />
          </button>
        )
      )}
    </div>
  );
}
