"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Stage, stages } from "@/config/stages";
import { Scenario, normalScenario } from "@/config/scenarios";
import { simulate } from "@/lib/scenario-model";
import { useTour } from "@/lib/use-tour";
import { PlantMap } from "./PlantMap";
import { StagePanel } from "./StagePanel";
import { StageVideoOverlay } from "./StageVideoOverlay";

/* How long the yard gets to itself before the film takes the screen. Same
   value as ZOOM_MS in lib/use-tour.ts, and for the same reason: the flight to
   the spot has to read as a deliberate "this is where it happens" beat rather
   than a jump cut into footage. */
const HIGHLIGHT_MS = 1500;

export function StageView() {
  const [activeStage, setActiveStage] = useState<Stage | null>(null);
  // Watching a clip is two steps. `zoomingTo` is the first: the camera closes
  // in on the stage's own spot and the other signs leave the yard. `videoStage`
  // is the second, once that beat has played.
  const [zoomingTo, setZoomingTo] = useState<Stage | null>(null);
  const [videoStage, setVideoStage] = useState<Stage | null>(null);
  // Nothing sets this any more: the toolbar picker was the only entry point.
  const [scenario] = useState<Scenario>(normalScenario);
  const tour = useTour(setActiveStage);
  const result = useMemo(() => simulate(scenario), [scenario]);

  // A tap on a hotspot, a station chip or the ground means someone took the
  // wheel — end the presentation rather than fight its timer for the camera.
  const { running, stop } = tour;
  const selectStage = useCallback(
    (stage: Stage | null) => {
      if (running) stop();
      setActiveStage(stage);
    },
    [running, stop]
  );

  const playStage = useCallback(
    (stage: Stage) => {
      if (running) stop();
      setActiveStage(stage);
      setZoomingTo(stage);
    },
    [running, stop]
  );

  useEffect(() => {
    if (!zoomingTo) return;
    const id = setTimeout(() => {
      setVideoStage(zoomingTo);
      setZoomingTo(null);
    }, HIGHLIGHT_MS);
    return () => clearTimeout(id);
  }, [zoomingTo]);

  // Stepping through stages inside the overlay swaps the clip straight away and
  // lets the yard catch up behind it — replaying the approach beat every time
  // would mean closing and reopening the film to watch the next one.
  const stepVideo = useCallback(
    (delta: number) => {
      if (!videoStage) return;
      const index = stages.indexOf(videoStage);
      const next = stages[(index + delta + stages.length) % stages.length];
      setActiveStage(next);
      setVideoStage(next);
    },
    [videoStage]
  );

  const closeVideo = useCallback(() => setVideoStage(null), []);
  const prevVideo = useCallback(() => stepVideo(-1), [stepVideo]);
  const nextVideo = useCallback(() => stepVideo(1), [stepVideo]);

  return (
    <div className="stage-view" data-tour={running || undefined}>
      <PlantMap
        activeStage={activeStage}
        onSelectStage={selectStage}
        highlight={zoomingTo}
        tour={tour}
        scenario={scenario}
        result={result}
      />
      <StagePanel
        stage={activeStage}
        onSelectStage={selectStage}
        onPlayVideo={playStage}
        tour={tour}
        scenario={scenario}
        result={result}
      />
      {videoStage && (
        <StageVideoOverlay
          stage={videoStage}
          onClose={closeVideo}
          onPrev={prevVideo}
          onNext={nextVideo}
        />
      )}
    </div>
  );
}
