"use client";

import { ImpactStatus } from "@/lib/scenario-model";

/**
 * A yard sign: a plate naming what is at this spot, standing on a short post
 * over a ring drawn on the point itself.
 *
 * The pin lives *inside* the map's transformed layer, so it travels with the
 * drawing exactly — no second animation to keep in step with the pan. What it
 * must not do is grow with it: a plate that scales 2.9x when the map closes in
 * would swallow the thing it names. `--map-inv` is the layer's own inverse
 * scale, written by PlantMap on the same element that carries the transform,
 * so the sign stays the same size in CSS pixels at every magnification while
 * its anchor is pure percentage of the artwork.
 */
export function YardPin({
  u,
  v,
  name,
  note,
  onClick,
  dimmed,
  muted,
  active,
  impact,
}: {
  /** Position on the artwork, 0-1 from its top-left corner. */
  u: number;
  v: number;
  name: string;
  /** Set only when the pin stands for a place holding several steps. */
  note?: string;
  onClick: () => void;
  /** A sign the map is not centred on, but still inside the place being read. */
  dimmed: boolean;
  /** A place elsewhere in the terminal while another one is open: it drops out
      so nothing competes with the step being read. */
  muted?: boolean;
  active: boolean;
  /** How the running scenario hits this spot. Undefined while none is running. */
  impact?: ImpactStatus;
}) {
  // The map clears the selection on a tap that lands on nothing; without this
  // the tap that picked a sign would bubble to the scene and bounce straight
  // back to the overview.
  const activate = (event: React.SyntheticEvent) => {
    event.stopPropagation();
    onClick();
  };

  // The scene is dragging on pointerdown, so on touch the plate never sees a
  // click at all — the gesture is read as a pan. Fire on pointerdown for
  // touch/pen and let mouse keep the real click.
  const activateOnTouch = (event: React.PointerEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (event.pointerType === "touch" || event.pointerType === "pen") {
      event.preventDefault();
      activate(event);
    }
  };

  return (
    <button
      type="button"
      className="yard-pin"
      style={{ left: `${u * 100}%`, top: `${v * 100}%` }}
      data-active={active || undefined}
      data-dimmed={dimmed || undefined}
      data-muted={muted || undefined}
      data-impact={impact}
      onPointerDown={activateOnTouch}
      onClick={activate}
      aria-label={note ? `${name} — ${note}` : name}
    >
      <span className="yard-pin-plate">
        <span className="yard-pin-name">{name}</span>
        {note && <span className="yard-pin-note">{note}</span>}
      </span>
    </button>
  );
}
