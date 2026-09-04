"use client";

import { useCallback, useState } from "react";
import { autoIntelligence } from "@/config/stages";
import { BotIcon } from "./icons";
import { VideoOverlay } from "./VideoOverlay";

export function AutoIntelligenceFab() {
  const [open, setOpen] = useState(false);

  // The assistant takes over the screen, so nothing else should still be
  // talking underneath it. This button is a sibling of StageView, not a child,
  // so there is no shared state to reach for — and pausing a video is an
  // imperative DOM call either way. At click time the overlay has not mounted
  // yet, so every <video> on the page belongs to something else.
  const openAssistant = useCallback(() => {
    document.querySelectorAll("video").forEach((video) => video.pause());
    setOpen(true);
  }, []);

  return (
    <>
      <button
        className="ai-fab"
        onClick={openAssistant}
        aria-label={autoIntelligence.title}
        title={autoIntelligence.title}
      >
        <BotIcon />
      </button>

      {open && (
        <VideoOverlay
          title={autoIntelligence.title}
          videoSrc={autoIntelligence.videoSrc}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
