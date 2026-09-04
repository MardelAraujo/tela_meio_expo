"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { places, placeOf, stageLabel, Stage, MAP_SRC, MAP_W, MAP_H } from "@/config/stages";
import { Scenario } from "@/config/scenarios";
import { ImpactStatus, ScenarioResult } from "@/lib/scenario-model";
import { TourController } from "@/lib/use-tour";
import { GuidedTour } from "./GuidedTour";
import { PlayIcon } from "./icons";
import { YardPin } from "./YardPin";
import { MapErrorBoundary } from "./MapErrorBoundary";
import { TourStage } from "./TourStage";

/* The terminal used to be a real three.js scene: ~40 glTF models, a procedural
   environment rig and an OrbitControls camera, about 30MB of assets before the
   first frame. It is now one 168KB drawing on a transformed layer. The camera
   survives as a translate/scale on that layer — same flights, same framing per
   stage, none of the load. Everything below is that camera. */

/** A framing: a point on the artwork (its own pixels) and a magnification. */
type Look = { x: number; y: number; scale: number };

/** The camera itself: where the layer's top-left sits in the viewport, and the
    scale applied to it. `k` already folds in the fit-to-viewport factor, so it
    is the layer's real CSS scale, not a multiplier over some base. */
type Cam = { x: number; y: number; k: number };

// Long enough to read as a deliberate approach rather than a cut, short enough
// that a visitor tapping through four stations never waits on it. Matches the
// panel's own --stage-transition band.
const FLIGHT_MS = 900;
const FLIGHT_EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

/* A framed point sits below the middle of the pane, not on it: the sign's plate
   rises ~40-80px above its own point, and a point centred vertically puts that
   plate in the exact spot the toolbar occupies. */
const FOCUS_Y = 0.56;

// The overview is the floor — there is nothing outside the drawing worth
// showing, so pinching out past it just leaves grey. The ceiling is a little
// past the closest stage framing (2.9) to leave room for a manual pinch.
const MIN_SCALE = 1;
const MAX_SCALE = 3.4;

/** Movement, in px, that turns a tap into a drag. Below it, letting go of the
    background clears the selection; above it, the gesture was a pan. */
const TAP_SLOP = 8;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** A place is only as healthy as its worst station. */
const SEVERITY: Record<ImpactStatus, number> = { ok: 0, atencao: 1, critico: 2 };

export const PlantMap = React.memo(function PlantMap({
  activeStage,
  onSelectStage,
  highlight,
  tour,
  scenario,
  result,
}: {
  activeStage: Stage | null;
  onSelectStage: (stage: Stage | null) => void;
  /** Set while the map closes in, just before a stage clip opens. */
  highlight: Stage | null;
  tour: TourController;
  scenario: Scenario;
  result: ScenarioResult;
}) {
  const sceneRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  /** Viewport size and the scale at which the whole drawing fits inside it. */
  const fitRef = useRef({ w: 0, h: 0, fit: 0 });
  const camRef = useRef<Cam>({ x: 0, y: 0, k: 0 });
  // The drawing fades in rather than popping onto the paper. `onLoad` alone
  // does not cover it: on a warm cache the image is already decoded by the
  // time React commits, the event has been and gone, and the map stays blank
  // for good — so the mount checks `complete` as well.
  const artRef = useRef<HTMLImageElement>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (artRef.current?.complete) setReady(true);
  }, []);

  /* ---- the camera ------------------------------------------------------ */

  // Writing straight to the layer's style instead of through state is the whole
  // reason a drag stays smooth here: a pan is one transform assignment per
  // pointermove, not a React render of the map and every pin on it. The pins
  // ride along inside the same layer and read --map-inv off it, so they need no
  // render either — see YardPin.
  const apply = useCallback((cam: Cam, animate: boolean) => {
    const layer = layerRef.current;
    if (!layer) return;
    camRef.current = cam;
    layer.style.transition = animate
      ? `transform ${FLIGHT_MS}ms ${FLIGHT_EASE}, --map-inv ${FLIGHT_MS}ms ${FLIGHT_EASE}`
      : "none";
    layer.style.transform = `translate3d(${cam.x}px, ${cam.y}px, 0) scale(${cam.k})`;
    layer.style.setProperty("--map-inv", String(1 / cam.k));
  }, []);

  /* Keep the drawing over the pane: when it is larger than the pane in an axis
     it may not pull its edge inside it, and when it is smaller it is centred.
     Without this, flying to the staging yard in the bottom-right corner framed
     half a pane of empty grey. */
  const settle = useCallback((cam: Cam): Cam => {
    const { w, h } = fitRef.current;
    const cw = cam.k * MAP_W;
    const ch = cam.k * MAP_H;
    return {
      k: cam.k,
      x: cw >= w ? clamp(cam.x, w - cw, 0) : (w - cw) / 2,
      y: ch >= h ? clamp(cam.y, h - ch, 0) : (h - ch) / 2,
    };
  }, []);

  /** The camera that frames `look` — or the whole terminal when it is null. */
  const camFor = useCallback(
    (look: Look | null): Cam => {
      const { w, h, fit } = fitRef.current;
      const k = fit * (look?.scale ?? 1);
      const point = look ?? { x: MAP_W / 2, y: MAP_H / 2 };
      return settle({
        k,
        x: w / 2 - k * point.x,
        y: (look ? h * FOCUS_Y : h / 2) - k * point.y,
      });
    },
    [settle]
  );

  /* ---- what the map is looking at -------------------------------------- */

  const focus = tour.step?.focus ?? null;
  const look = useMemo<Look | null>(() => {
    // A stage is framed by its place, not by itself: its siblings have to stay
    // on screen, or opening one step of the gatehouse hides the other. Layer
    // stages have no spot in the terminal at all, so the map holds the overview
    // and the panel does the talking.
    const place = activeStage?.layer ? null : placeOf(activeStage);
    // The highlight beat is the exception to place framing: it is pointing at
    // one spot, so it closes in on the stage's own zoom rather than the frame
    // that keeps its siblings on screen.
    return highlight?.zoom ?? (place ? place.zoom : focus);
  }, [activeStage, highlight, focus]);

  const [resetKey, setResetKey] = useState(0);
  // Clearing the selection is half the job: with a stage still active the map
  // flies straight back to that stage's framing, so the button looked inert.
  const resetView = useCallback(() => {
    onSelectStage(null);
    setResetKey((key) => key + 1);
  }, [onSelectStage]);

  // Fly whenever the destination changes — and whenever the reset button is
  // pressed, which may leave the destination exactly where it was while the
  // visitor has panned somewhere else entirely.
  useEffect(() => {
    if (!fitRef.current.fit) return;
    apply(camFor(look), true);
  }, [look, resetKey, apply, camFor]);

  // The pane is short and wide on a totem and near-16:9 on a desktop, so the
  // fit is measured, not assumed. A resize re-frames without animating: the
  // drawing must not appear to fly when the window is merely being dragged.
  // The destination is read through a ref rather than a dependency — an
  // observer rebuilt on every stage change fires on observe() and would snap
  // the map to the destination the effect above had just started flying to.
  const lookRef = useRef(look);
  lookRef.current = look;
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width: w, height: h } = entry.contentRect;
      if (!w || !h) return;
      fitRef.current = { w, h, fit: Math.min(w / MAP_W, h / MAP_H) };
      apply(camFor(lookRef.current), false);
    });
    observer.observe(scene);
    return () => observer.disconnect();
  }, [apply, camFor]);

  /* ---- pan and zoom ----------------------------------------------------- */

  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const drag = useRef<{ cam: Cam; x: number; y: number; span: number; moved: boolean } | null>(null);

  /** Zoom about a viewport point, so the bit of terminal under the fingers (or
      the cursor) stays under them. */
  const zoomAt = useCallback(
    (px: number, py: number, nextK: number) => {
      const { fit } = fitRef.current;
      const cam = camRef.current;
      const k = clamp(nextK, fit * MIN_SCALE, fit * MAX_SCALE);
      const ratio = k / cam.k;
      apply(settle({ k, x: px - (px - cam.x) * ratio, y: py - (py - cam.y) * ratio }), false);
    },
    [apply, settle]
  );

  const localPoint = (event: React.PointerEvent) => {
    const rect = sceneRef.current!.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const point = localPoint(event);
    pointers.current.set(event.pointerId, point);
    event.currentTarget.setPointerCapture(event.pointerId);
    const marks = [...pointers.current.values()];
    const centre = {
      x: marks.reduce((sum, p) => sum + p.x, 0) / marks.length,
      y: marks.reduce((sum, p) => sum + p.y, 0) / marks.length,
    };
    drag.current = {
      cam: camRef.current,
      x: centre.x,
      y: centre.y,
      span: marks.length > 1 ? Math.hypot(marks[0].x - marks[1].x, marks[0].y - marks[1].y) : 0,
      // A second finger landing mid-drag is never a tap.
      moved: marks.length > 1,
    };
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!pointers.current.has(event.pointerId)) return;
    pointers.current.set(event.pointerId, localPoint(event));
    const state = drag.current;
    if (!state) return;
    const marks = [...pointers.current.values()];
    const centre = {
      x: marks.reduce((sum, p) => sum + p.x, 0) / marks.length,
      y: marks.reduce((sum, p) => sum + p.y, 0) / marks.length,
    };
    const dx = centre.x - state.x;
    const dy = centre.y - state.y;
    if (!state.moved && Math.hypot(dx, dy) > TAP_SLOP) state.moved = true;
    if (marks.length > 1 && state.span > 0) {
      const span = Math.hypot(marks[0].x - marks[1].x, marks[0].y - marks[1].y);
      zoomAt(centre.x, centre.y, (state.cam.k * span) / state.span);
      return;
    }
    apply(settle({ k: camRef.current.k, x: state.cam.x + dx, y: state.cam.y + dy }), false);
  };

  const onPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    pointers.current.delete(event.pointerId);
    const state = drag.current;
    if (pointers.current.size === 0) {
      drag.current = null;
      // A tap on the terminal itself — not on a sign, which stops the event —
      // means "never mind", the same as the reset button.
      if (state && !state.moved && activeStage) onSelectStage(null);
      return;
    }
    // One finger lifted out of a pinch: re-seat the drag on what is left.
    const marks = [...pointers.current.values()];
    drag.current = {
      cam: camRef.current,
      x: marks.reduce((sum, p) => sum + p.x, 0) / marks.length,
      y: marks.reduce((sum, p) => sum + p.y, 0) / marks.length,
      span: 0,
      moved: true,
    };
  };

  const onWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    const rect = sceneRef.current!.getBoundingClientRect();
    // Exponential, so a notch is the same proportional step whether the map is
    // at the overview or deep in the tank farm.
    zoomAt(
      event.clientX - rect.left,
      event.clientY - rect.top,
      camRef.current.k * Math.exp(-event.deltaY * 0.0015)
    );
  };

  /* ---- pins ------------------------------------------------------------- */

  const simulating = scenario.id !== "normal";
  // No scenario running means no impact anywhere, so the pins stay exactly as
  // they were before the simulator existed.
  const impactOf = useCallback(
    (stage: Stage) => (simulating ? result.impacts.get(stage.id)?.status : undefined),
    [simulating, result]
  );
  const openPlace = activeStage?.layer ? null : placeOf(activeStage);

  // The clip takes the whole screen once the map has arrived (see TourStage).
  // It renders inside this wrapper on purpose: the wrapper isolates a stacking
  // context, so the fullscreen video and the tour HUD that has to stay above it
  // are ordered against each other and nothing else on the page.
  const cinema = tour.running && tour.videoVisible && activeStage !== null;

  return (
    <div
      className="plant-map-wrapper"
      data-presenting={tour.running || undefined}
      data-highlight={highlight ? true : undefined}
      data-cinema={cinema || undefined}
    >
      <div className="map-toolbar" aria-label="Controles do mapa">
        {/* The product's own mark, in place of the context chip that used to
            name the open stage here. The chip was saying what the panel below
            already says in a heading, and what the tour HUD repeats during a
            presentation — so the corner is worth more as the badge that tells
            a visitor which product they are standing in front of. */}
        <Image
          className="map-brand"
          src="/brand/autoload-logo-white.png"
          alt="Autoload"
          width={801}
          height={216}
          priority
        />
        {/* Going back to the whole terminal is the move a visitor makes over and
            over; the guided presentation is the one a presenter starts once.
            So the reset leads and wears the brand gradient, and the
            presentation sits behind it as the quiet secondary action. */}
        {!tour.running && (
          <span className="map-actions">
            <button className="map-reset" onClick={resetView} aria-label="Voltar à visão geral"><span aria-hidden="true">↗</span> Visão geral</button>
            <button className="map-present" onClick={tour.start}>
              <PlayIcon size={13} /> Apresentação
            </button>
          </span>
        )}
      </div>
      {/* Auditoria and Gestão used to live here, as a pair of chips on the map's
          own chrome, because they read across the whole terminal rather than
          happening at one spot in it. They are now the last two entries in the
          panel's own station list — one list, one place to look — and selecting
          one still holds the map at the overview (see `look`). */}
      {cinema && activeStage && <TourStage stage={activeStage} />}
      <GuidedTour controller={tour} />
      <MapErrorBoundary>
        <div
          ref={sceneRef}
          className="plant-scene"
          data-ready={ready || undefined}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onWheel={onWheel}
        >
          <div ref={layerRef} className="plant-layer" style={{ width: MAP_W, height: MAP_H }}>
            <Image
              ref={artRef}
              className="plant-art"
              src={MAP_SRC}
              alt="Planta do terminal de combustíveis: portaria, pátio de manobras, parque de tanques, plataforma de carregamento, balança, ferrovia e píer."
              width={MAP_W}
              height={MAP_H}
              priority
              draggable={false}
              onLoad={() => setReady(true)}
            />

            {/* One pin per place. The open place hands its pin over to its own
                steps, which the map has by then pulled far enough apart to
                read. A layer stage leaves every pin at full strength — the map
                is not its subject. */}
            {places.map((place) =>
              place === openPlace ? (
                place.stages.map((stage) => (
                  <YardPin
                    key={stage.id}
                    u={stage.x / MAP_W}
                    v={stage.y / MAP_H}
                    name={stageLabel(stage)}
                    onClick={() => onSelectStage(stage)}
                    dimmed={!!activeStage && activeStage.id !== stage.id}
                    active={activeStage?.id === stage.id}
                    impact={impactOf(stage)}
                  />
                ))
              ) : (
                <YardPin
                  key={place.id}
                  u={place.x / MAP_W}
                  v={place.y / MAP_H}
                  name={place.stages.length > 1 ? place.label : stageLabel(place.stages[0])}
                  note={place.stages.length > 1 ? `${place.stages.length} etapas` : undefined}
                  onClick={() => onSelectStage(place.stages[0])}
                  muted={!!openPlace}
                  dimmed={false}
                  active={false}
                  impact={place.stages
                    .map(impactOf)
                    .reduce<ImpactStatus | undefined>(
                      (worst, next) => (next && (!worst || SEVERITY[next] > SEVERITY[worst]) ? next : worst),
                      undefined
                    )}
                />
              )
            )}
          </div>
        </div>
      </MapErrorBoundary>
    </div>
  );
});
