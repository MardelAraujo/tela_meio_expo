import { StageId } from "./stages";

export interface TourStep {
  title: string;
  narration: string;
  /** Stages this chapter visits, in order. Empty = camera-only beat. */
  stageIds: StageId[];
  /** Framing for a camera-only beat, in the artwork's own pixels (see
      MAP_W/MAP_H in config/stages.ts). Omitted = full terminal overview. */
  focus?: { x: number; y: number; scale: number };
  seconds: number;
}

// The chapters follow the physical order a truck passes through the yard, so
// the progress rail doubles as the route itself. Camera-only beats (overview,
// portaria) set `focus`; the rest reuse each stage's own zoom.
export const tour: TourStep[] = [
  {
    title: "Visão geral do terminal",
    narration:
      "Este é o terminal completo: portaria, balanças, pátio de manobras, parque de tanques, ferrovia e píer. O Autoload acompanha cada caminhão do agendamento até a saída — é esse percurso que vamos seguir agora.",
    stageIds: [],
    seconds: 17,
  },
  {
    title: "Portaria",
    narration:
      "Tudo começa na portaria. O caminhão chega com janela agendada e o sistema já sabe quem é, o que traz e para onde vai. Sem papel, sem fila na guarita.",
    stageIds: [],
    // Mid-altitude approach: frames the whole entrance — the waiting yard, the
    // office block and the gate itself — before the next chapter closes in on
    // the guard booth where check-in happens.
    focus: { x: 540, y: 782, scale: 1.8 },
    seconds: 14,
  },
  {
    title: "Check-in e check-out",
    narration:
      "No check-in, documentos e dados do motorista são validados automaticamente. A liberação de acesso ao pátio sai em segundos e o cronômetro da operação começa a contar.",
    stageIds: ["checkin"],
    seconds: 17,
  },
  {
    title: "Pesagem",
    narration:
      "A balança captura peso bruto, tara e líquido sem intervenção manual. O valor entra direto no sistema operacional — nada é digitado duas vezes.",
    stageIds: ["pesagem"],
    seconds: 15,
  },
  {
    title: "Vistoria",
    narration:
      "O checklist digital registra a vistoria do veículo e da carga com foto. Se algum item não estiver conforme, a liberação simplesmente não acontece.",
    stageIds: ["inspecao"],
    seconds: 15,
  },
  {
    title: "Carga e descarga",
    narration:
      "Na plataforma, a operação é acompanhada em tempo real: volume, tempo de doca e ocorrências ficam registrados enquanto o caminhão ainda está carregando.",
    stageIds: ["carga-descarga"],
    seconds: 16,
  },
  {
    title: "Estoque",
    narration:
      "Cada movimentação atualiza o saldo do parque de tanques na hora. O estoque que o gestor vê é o estoque que está no tanque.",
    stageIds: ["estoque"],
    seconds: 13,
  },
  {
    title: "Auditoria e gestão",
    narration:
      "Toda a operação fica auditável: quem liberou, quando e com qual documento. E o painel de gestão consolida filas, tempos e volumes do terminal inteiro em um lugar só.",
    stageIds: ["auditoria", "gestao"],
    seconds: 22,
  },
];

export const tourMinutes = Math.round(tour.reduce((total, step) => total + step.seconds, 0) / 60);
