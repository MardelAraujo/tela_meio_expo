"use client";

import { useEffect } from "react";
import { Stage, stageLabel } from "@/config/stages";
import { VideoPlayer } from "./VideoPlayer";

/* The stage clip, full screen over a darkened yard — the same takeover the
   guided presentation makes, reached deliberately instead of on a timer.
   The panel used to play it inline while the map shrank to a strip; at totem
   viewing distance a clip boxed inside half a split screen is unreadable, and
   the presentation had already answered that. So the film gets the screen and
   the description follows it in a box underneath, where a visitor can read
   what they just watched without the panel competing for the same pixels. */
export function StageVideoOverlay({
  stage,
  onClose,
  onPrev,
  onNext,
}: {
  stage: Stage;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft") onPrev();
      if (event.key === "ArrowRight") onNext();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, onPrev, onNext]);

  return (
    <div className="stage-cinema" role="dialog" aria-modal="true" aria-label={stage.title}>
      <div className="stage-cinema-bar">
        <span className="stage-cinema-name">{stageLabel(stage)}</span>
        {/* Bare glyphs, no plates: the film is the subject and these are the
            only controls on top of it. */}
        <span className="stage-cinema-nav">
          <button type="button" onClick={onPrev} aria-label="Etapa anterior">
            <span aria-hidden="true">‹</span>
          </button>
          <button type="button" onClick={onNext} aria-label="Próxima etapa">
            <span aria-hidden="true">›</span>
          </button>
          <button type="button" className="stage-cinema-close" onClick={onClose} aria-label="Fechar vídeo">
            <span aria-hidden="true">×</span>
          </button>
        </span>
      </div>

      {/* key on the stage so switching with the arrows swaps the source and
          restarts playback instead of seeking a fresh file at the old time. */}
      <VideoPlayer key={stage.id} src={stage.videoSrc} className="stage-cinema-video" autoPlay />

      <div className="stage-cinema-note">
        <span className="stage-panel-kicker">
          {stage.layer ? "Em toda a operação" : "Etapa da operação"}
        </span>
        <p>{stage.description}</p>
      </div>
    </div>
  );
}
