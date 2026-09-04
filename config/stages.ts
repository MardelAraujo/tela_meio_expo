export type StageId =
  | "agendamento"
  | "checkin"
  | "pesagem"
  | "inspecao"
  | "carga-descarga"
  | "filas"
  | "estoque"
  | "auditoria"
  | "gestao";

export interface Stage {
  id: StageId;
  title: string;
  /** Marker/chip label. Defaults to the title's part before " - ", which is
      still too long for a few stages at totem viewing distance. */
  short?: string;
  description: string;
  videoSrc: string;
  /** Where the stage happens on the terminal artwork, in the illustration's
      own pixels (MAP_W x MAP_H, origin top-left). PlantMap normalizes them.
      The point is the spot on the ground, not the middle of the building: the
      sign's plate rises above its point, so an anchor on a roof would cover
      the very thing the sign names. */
  x: number;
  y: number;
  /** True for a stage that is not a spot in the yard but a reading across the
      whole operation. Layers have no map pin — see `places` below. */
  layer?: true;
  zoom: { x: number; y: number; scale: number };
}

// The illustration these coordinates are read off (public/map/terminal.webp).
// Exported because the map's framing math is expressed in its pixels; swapping
// the artwork means re-reading every x/y below against the new drawing.
export const MAP_SRC = "/map/terminal.webp";
export const MAP_W = 1662;
export const MAP_H = 946;

/** How far a single stage's own framing closes in. The drawing is a 1662px
    raster, so past ~3x its line work starts to soften on a totem; this is as
    close as the map goes and still reads as ink rather than as pixels. */
const STAGE_ZOOM = 2.9;
/** A place has to keep every step it holds on screen, so it sits a little
    further out than a single stage's own zoom. */
const PLACE_ZOOM = 2.4;

// Each stage is pinned to the thing in the drawing that actually does the job:
// the queue of tankers, the gatehouse, the inspection portal, the weighbridge
// slab, the loading canopy, the tank farm. Stages that are readings rather
// than places (auditoria, gestao) are marked `layer` and never get a pin —
// they are anchored to the operation's own dashboards in the artwork instead,
// which is only where the panel points, never where the map flies.
// Declaration order is the order the station grid lists them, and it follows
// the operation: a load is booked before the truck ever reaches the gate, so
// agendamento comes first. The two layer readings close the list.
export const stages: Stage[] = [
  {
    id: "agendamento",
    title: "Agendamento - Etapa Inicial",
    description: "Motoristas e transportadoras agendam a janela de carga com antecedência, reduzindo filas e organizando o fluxo de chegada ao terminal.",
    videoSrc: "/videos/agendamento.mp4",
    // The staging yard outside the terminal, bottom right of the drawing:
    // tankers parked at the transport office, still on the public side of the
    // gate. The window is booked before any of them moves.
    x: 1452,
    y: 812,
    zoom: { x: 1452, y: 812, scale: STAGE_ZOOM },
  },
  {
    id: "checkin",
    title: "Check In - Check Out",
    short: "Check-In",
    description: "Registro automático de entrada e saída do motorista na portaria, com validação de documentos e liberação de acesso ao pátio em segundos.",
    videoSrc: "/videos/checkin-checkout.mp4",
    // The gate itself: guard booth, barrier arm and the portal frame the truck
    // drives under on its way in. This is the portaria — not the office block
    // out on the waiting yard, which is where the queue forms (see `filas`).
    x: 665,
    y: 788,
    zoom: { x: 665, y: 788, scale: STAGE_ZOOM },
  },
  {
    id: "filas",
    title: "Controle de Filas",
    description: "Painel de chamada organiza a ordem de atendimento dos caminhões no pátio, priorizando por horário de agendamento e disponibilidade das docas.",
    videoSrc: "/videos/controle-filas.mp4",
    // The waiting yard outside the gate: five tankers lined up at the office
    // block, with the driver's self-service kiosk and the call board above it.
    x: 392,
    y: 775,
    zoom: { x: 392, y: 775, scale: STAGE_ZOOM },
  },
  {
    id: "pesagem",
    title: "Pesagem Inicial e Final",
    short: "Pesagem",
    description: "Pesagem automatizada na entrada e na saída, com captura de peso bruto, tara e líquido integrada diretamente ao sistema operacional.",
    videoSrc: "/videos/pesagem.mp4",
    // The weighbridge slab on the manoeuvring lane, under its reading gantry.
    x: 1105,
    y: 615,
    zoom: { x: 1105, y: 615, scale: STAGE_ZOOM },
  },
  {
    id: "inspecao",
    // The yard calls this "vistoria" — and so does the drawing: the inspection
    // cabin at the edge of the paved lane, facing the rail cars with the ship
    // beyond, where a tanker pulls up to be checked. The id stays `inspecao`:
    // it is internal, and renaming it would ripple into the scenario CHAIN and
    // the tour for no gain.
    title: "Vistoria - Checklist Digital",
    description: "Checklist digital de inspeção veicular e de carga, com registro fotográfico e liberação condicionada à conformidade dos itens verificados.",
    videoSrc: "/videos/inspecao.mp4",
    x: 1293,
    y: 412,
    zoom: { x: 1293, y: 412, scale: STAGE_ZOOM },
  },
  {
    id: "carga-descarga",
    title: "Carga e Descarga - Dashboards e Telemetria",
    description: "Acompanhamento em tempo real da carga e descarga por telemetria, com dashboards de vazão, tempo de doca e status de cada operação.",
    videoSrc: "/videos/carga-descarga.mp4",
    // The loading canopy at the centre of the yard, with its control booth.
    x: 980,
    y: 540,
    zoom: { x: 980, y: 540, scale: STAGE_ZOOM },
  },
  {
    id: "estoque",
    title: "Estoque - Inventário e Tancagem",
    // Without this the label would be just "Estoque" (stageLabel cuts at " - ").
    short: "Estoque/Inventário",
    description: "Controle de inventário e tancagem com leitura contínua de níveis, permitindo rastrear disponibilidade de produto por tanque em tempo real.",
    videoSrc: "/videos/estoque.mp4",
    // The tank farm itself rather than the manifold below it: the stage is
    // about what is inside the tanks.
    x: 690,
    y: 315,
    zoom: { x: 690, y: 315, scale: STAGE_ZOOM },
  },
  {
    id: "auditoria",
    layer: true,
    title: "Auditoria - Registros e Rastreabilidade",
    description: "Trilha de auditoria completa de cada movimentação, com registros e evidências rastreáveis para conferência e compliance.",
    videoSrc: "/videos/auditoria.mp4",
    // The gatehouse's own board: every movement's record starts there.
    x: 416,
    y: 609,
    zoom: { x: 416, y: 609, scale: STAGE_ZOOM },
  },
  {
    id: "gestao",
    layer: true,
    title: "Dashboard de Gestão - Acompanhamento de movimentações",
    short: "Gestão",
    description: "Dashboard de gestão consolida indicadores de todas as etapas da operação, dando visibilidade ponta a ponta do pátio para a liderança.",
    videoSrc: "/videos/dashboard-gestao.mp4",
    // The board over the transport office, the one screen in the drawing that
    // reads the whole terminal at once.
    x: 1530,
    y: 725,
    zoom: { x: 1530, y: 725, scale: STAGE_ZOOM },
  },
];

// A terminal has *places*, and a place can hold more than one step. The map
// shows one pin per place; opening a place moves the view in and its steps take
// over as individual pins, far enough apart at that magnification to read on
// their own. On this artwork every step has a home of its own far enough from
// the rest to carry a plate — the waiting yard, the gate, the inspection cabin
// by the rail and the loading rack are all separate buildings — so no place
// currently holds more than one. The grouping stays because that is a property
// of the drawing, not of the product: an artwork that puts two steps in the
// same building only has to list them together here.
export interface Place {
  id: string;
  /** Only used when the place holds more than one stage; a lone stage speaks
      for itself. */
  label: string;
  stages: Stage[];
  x: number;
  y: number;
  zoom: { x: number; y: number; scale: number };
}

const byId = (id: StageId) => stages.find((stage) => stage.id === id)!;

function place(id: string, label: string, ids: StageId[]): Place {
  const members = ids.map(byId);
  const x = members.reduce((sum, s) => sum + s.x, 0) / members.length;
  const y = members.reduce((sum, s) => sum + s.y, 0) / members.length;
  return {
    id,
    label,
    stages: members,
    x,
    y,
    zoom: { x, y, scale: members.length > 1 ? PLACE_ZOOM : STAGE_ZOOM },
  };
}

// Ordered the way a truck moves through the drawing — staging yard, queue,
// gate, scale, rack, tanks, inspection — so the pins read as a route rather
// than as a scattering of labels. Later entries paint over earlier ones where
// two plates overlap at the overview.
export const places: Place[] = [
  place("agendamento", "Agendamento", ["agendamento"]),
  place("patio", "Pátio de espera", ["filas"]),
  place("portaria", "Portaria", ["checkin"]),
  place("balanca", "Balança", ["pesagem"]),
  place("carregamento", "Carregamento", ["carga-descarga"]),
  place("tancagem", "Tancagem", ["estoque"]),
  place("vistoria", "Vistoria", ["inspecao"]),
];

export function placeOf(stage: Stage | null) {
  return stage ? places.find((p) => p.stages.includes(stage)) ?? null : null;
}

// Some legacy stage records were saved with UTF-8 decoded as Latin-1. Normalize
// those labels at the boundary so the interface always presents readable copy.
const mojibakeFixes: Record<string, string> = {
  "Ã§": "ç", "Ã£": "ã", "Ã¡": "á", "Ã©": "é", "Ã­": "í", "Ã³": "ó", "Ãº": "ú", "Ãµ": "õ", "Ã§Ã£": "çã", "Â·": "·", "Â": "",
};
function cleanCopy(value: string) {
  return Object.entries(mojibakeFixes).reduce((text, [bad, good]) => text.replaceAll(bad, good), value);
}
stages.forEach((stage) => {
  stage.title = cleanCopy(stage.title);
  stage.description = cleanCopy(stage.description);
});

/** The short name a stage goes by in the map marker and the station chips. */
export function stageLabel(stage: Stage) {
  return stage.short ?? stage.title.split(" - ")[0];
}

export const autoIntelligence = {
  title: "AutoIntelligence - Assistente de IA do Autoload",
  videoSrc: "/videos/autointelligence.mp4",
};
