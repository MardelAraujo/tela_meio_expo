"use client";

import { Stage, stageLabel, stages } from "@/config/stages";
import { Scenario } from "@/config/scenarios";
import { tourMinutes } from "@/config/tour";
import { ScenarioResult } from "@/lib/scenario-model";
import { ScenarioSummary } from "./ScenarioPanel";
import { TourController } from "@/lib/use-tour";
import { TourTitleCard } from "./GuidedTour";
import { PlayIcon } from "./icons";

/* "Estoque/Inventário" is a single 18-character token: no space, so nothing to
   wrap at, and it ran out of its chip. A slash is the one place it reads
   correctly broken, so mark that as the break opportunity — without it the
   overflow-wrap fallback in globals.css splits it as "Estoque/Invent | ário". */
function wrappableLabel(label: string) {
  return label.split("/").map((part, i, all) => (
    <span key={i}>
      {part}
      {i < all.length - 1 && "/"}
      {i < all.length - 1 && <wbr />}
    </span>
  ));
}

function StageEmptyState({ onSelectStage }: { onSelectStage: (stage: Stage) => void }) {
  return (
    <div className="stage-panel-empty">
      <span className="stage-panel-kicker">Etapa da operação</span>
      <p className="stage-panel-empty-hint">Arraste a planta para explorar. Toque em um ponto do pátio ou escolha uma etapa abaixo.</p>
      {/* Every stage, in operation order — the two layer readings (auditoria,
          gestão) close the list. They keep the diamond mark they wore as map
          chips, so "reads across the whole operation" still looks different
          from "happens at this spot" without needing a second list. */}
      <div className="station-grid">
        {stages.map((s) => (
          <button
            type="button"
            key={s.id}
            className="station-chip"
            data-layer={s.layer || undefined}
            onClick={() => onSelectStage(s)}
          >
            <span className="station-chip-dot" />
            <span className="station-chip-label">{wrappableLabel(stageLabel(s))}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* One surface, not two tabs. The clip now takes the whole screen (see
   StageVideoOverlay), so a "Vídeo" tab here would have been a second door to
   the same place — and the tab bar was costing the description a row of the
   pane it is read from. */
function StageContent({ stage, onPlayVideo }: { stage: Stage; onPlayVideo: (stage: Stage) => void }) {
  return (
    <>
      <div className="stage-panel-header">
        <div>
          <span className="stage-panel-kicker">{stage.layer ? "Em toda a operação" : "Etapa da operação"}</span>
          <h3>{stage.title}</h3>
        </div>
      </div>
      <div className="stage-panel-body">
        <div className="stage-panel-description-wrap">
          <p className="stage-panel-description">{stage.description}</p>
          <button type="button" className="stage-watch-video-btn" onClick={() => onPlayVideo(stage)}>
            <PlayIcon size={15} /> Assistir vídeo da etapa
          </button>
        </div>
      </div>
    </>
  );
}

export function StagePanel({
  stage,
  onSelectStage,
  onPlayVideo,
  tour,
  scenario,
  result,
}: {
  stage: Stage | null;
  onSelectStage: (stage: Stage) => void;
  onPlayVideo: (stage: Stage) => void;
  tour: TourController;
  scenario: Scenario;
  result: ScenarioResult;
}) {
  return (
    <div className="stage-panel-screen">
      {stage ? (
        <StageContent key={stage.id} stage={stage} onPlayVideo={onPlayVideo} />
      ) : tour.running && tour.step && tour.index !== null ? (
        <TourTitleCard index={tour.index} title={tour.step.title} minutes={tourMinutes} />
      ) : scenario.id !== "normal" ? (
        <ScenarioSummary scenario={scenario} result={result} onSelectStage={onSelectStage} />
      ) : (
        <StageEmptyState onSelectStage={onSelectStage} />
      )}
    </div>
  );
}
