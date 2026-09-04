import { StageView } from "@/components/StageView";
import { AutoIntelligenceFab } from "@/components/AutoIntelligenceFab";
import { BrandMark } from "@/components/BrandMark";

export default function Home() {
  return (
    <>
      <header className="topbar">
        <div className="topbar-brand"><BrandMark /></div>
      </header>
      <div className="brand-rule" />
      <main className="page">
        <StageView />
        <AutoIntelligenceFab />
      </main>
    </>
  );
}
