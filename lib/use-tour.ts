"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Stage, stages } from "@/config/stages";
import { tour } from "@/config/tour";

const stageById = new Map(stages.map((stage) => [stage.id, stage]));

// How long the camera gets to arrive at a stage before its video takes over
// the canvas — the zoom has to read as a deliberate "here's where this
// happens" beat, not a jump cut straight to footage. Capped at half a short
// chapter's own time so a fast beat still gets to show its clip.
const ZOOM_MS = 1500;

/**
 * Presentation mode. Walks config/tour.ts on a wall-clock timer, driving the
 * same `setActiveStage` a visitor's tap would — so the camera flight, the
 * hotspot highlight and the stage panel all come for free.
 *
 * `onSelectStage` must be the raw state setter, not the wrapper that stops the
 * tour on manual selection, or every chapter change would cancel the tour.
 */
export function useTour(onSelectStage: (stage: Stage | null) => void) {
  const [index, setIndex] = useState<number | null>(null);
  const [sub, setSub] = useState(0);
  const [paused, setPaused] = useState(false);
  // Whether the current chapter has finished its camera-only approach and
  // should hand the canvas over to the stage's own video. Kept as state (for
  // render) plus a ref (so the per-frame tick can compare cheaply without
  // depending on a stale closure).
  const [videoVisible, setVideoVisible] = useState(false);
  const videoVisibleRef = useRef(false);
  // Progress is written straight to a CSS variable on the rail: it changes
  // every frame, and re-rendering the whole HUD at 60fps over a live 3D canvas
  // is exactly the kind of jank a trade-show demo can't afford.
  const railRef = useRef<HTMLDivElement>(null);
  const elapsedRef = useRef(0);

  const step = index === null ? null : tour[index];

  const goTo = useCallback((next: number) => {
    setIndex(((next % tour.length) + tour.length) % tour.length);
  }, []);

  const stop = useCallback(() => {
    setIndex(null);
    setPaused(false);
    onSelectStage(null);
  }, [onSelectStage]);

  // Restart the clock whenever the chapter changes, including on manual skip.
  // The video hands back to the camera immediately too, so a skip never
  // leaves the previous stage's footage hanging over the new chapter's
  // establishing shot.
  useEffect(() => {
    elapsedRef.current = 0;
    setSub(0);
    videoVisibleRef.current = false;
    setVideoVisible(false);
  }, [index]);

  // Chapter -> camera + panel. A chapter with no stages is a camera-only beat
  // (overview, portaria); one with two splits its time between them.
  useEffect(() => {
    if (!step) return;
    onSelectStage(step.stageIds.length ? stageById.get(step.stageIds[sub]) ?? null : null);
  }, [step, sub, onSelectStage]);

  useEffect(() => {
    if (index === null || paused) return;
    const total = tour[index].seconds * 1000;
    const hasVideo = tour[index].stageIds.length > 0;
    const parts = Math.max(1, tour[index].stageIds.length);
    const subDuration = total / parts;
    // Cap the zoom-in beat to half the sub-chapter's own time, so a stage
    // that only gets a few seconds still shows its clip rather than spending
    // its whole budget approaching it.
    const zoomDelay = Math.min(ZOOM_MS, subDuration / 2);
    let last = 0;
    let frame = requestAnimationFrame(function tick(now) {
      if (last) elapsedRef.current += now - last;
      last = now;
      const progress = Math.min(1, elapsedRef.current / total);
      railRef.current?.style.setProperty("--tour-progress", String(progress));
      const nextSub = Math.min(parts - 1, Math.floor(progress * parts));
      // Functional form so the no-op case is visibly a no-op: this runs on
      // every animation frame, and PlantMap's memo hangs off it.
      setSub((prev) => (prev === nextSub ? prev : nextSub));
      // Time spent inside the *current* sub-stage, not the whole chapter —
      // each stage in a multi-stage chapter gets its own approach-then-reveal
      // beat rather than only the first one.
      const subElapsed = elapsedRef.current - nextSub * subDuration;
      const showVideo = hasVideo && subElapsed >= zoomDelay;
      if (showVideo !== videoVisibleRef.current) {
        videoVisibleRef.current = showVideo;
        setVideoVisible(showVideo);
      }
      if (progress >= 1) {
        setIndex((current) => (current === null ? null : (current + 1) % tour.length));
        return;
      }
      frame = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(frame);
  }, [index, paused]);

  // Warm the next chapter's clip while the current one plays. The videos run
  // 12-22 MB each; a demo that buffers for the first seconds of every chapter
  // is a demo that doesn't land.
  useEffect(() => {
    if (index === null) return;
    const upcoming = tour[(index + 1) % tour.length].stageIds[0];
    const stage = upcoming && stageById.get(upcoming);
    if (!stage) return;
    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "video";
    link.href = stage.videoSrc;
    document.head.append(link);
    return () => link.remove();
  }, [index]);

  // Presenter shortcuts: the demo is often driven from a laptop at the podium.
  useEffect(() => {
    if (index === null) return;
    function onKeyDown(event: KeyboardEvent) {
      const keys: Record<string, () => void> = {
        " ": () => setPaused((value) => !value),
        ArrowRight: () => goTo(index! + 1),
        ArrowLeft: () => goTo(index! - 1),
        Escape: stop,
      };
      const action = keys[event.key];
      if (!action) return;
      event.preventDefault();
      action();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [index, goTo, stop]);

  const start = useCallback(() => goTo(0), [goTo]);
  const next = useCallback(() => index !== null && goTo(index + 1), [index, goTo]);
  const previous = useCallback(() => index !== null && goTo(index - 1), [index, goTo]);
  const togglePause = useCallback(() => setPaused((value) => !value), []);

  // This object is a prop of the memoized <PlantMap>. Returned as a fresh
  // literal with five fresh arrows, it changed identity on every render — and
  // the rAF loop above renders often — so the memo would never hold.
  return useMemo(
    () => ({
      index,
      step,
      running: index !== null,
      paused,
      // True once the current stage's zoom-in beat has finished and its video
      // should be showing on the canvas in place of the establishing shot.
      videoVisible,
      railRef,
      start,
      stop,
      goTo,
      next,
      previous,
      togglePause,
    }),
    [index, step, paused, videoVisible, railRef, start, stop, goTo, next, previous, togglePause]
  );
}

export type TourController = ReturnType<typeof useTour>;
