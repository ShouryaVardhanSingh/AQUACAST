import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { useCallback, useState } from "react";
import { CONTINENTS, type ContinentId } from "@/lib/continents";
import { Landing } from "@/components/aquacast/Landing";
import { LogoReveal } from "@/components/aquacast/LogoReveal";
import { PlanetSelect } from "@/components/aquacast/PlanetSelect";
import { ContinentMap } from "@/components/aquacast/ContinentMap";
import { Terra } from "@/components/aquacast/Terra";
import { Sato } from "@/components/aquacast/Sato";
import { Ripple } from "@/components/aquacast/Starfield";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AQUACAST — Satellite Flood Intelligence" },
      { name: "description", content: "Explore satellite-powered flood intelligence: pick a continent, zoom into India and explore the TERRA dashboard with SATO." },
      { property: "og:title", content: "AQUACAST — Satellite Flood Intelligence" },
      { property: "og:description", content: "Understanding floods. Seeing beyond the surface." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

type Stage = "landing" | "reveal" | "planets" | "continent" | "terra" | "sato";

function Index() {
  const [stage, setStage] = useState<Stage>("landing");
  const [continent, setContinent] = useState<ContinentId>("as");
  const [question, setQuestion] = useState("");
  const [ripple, setRipple] = useState(0);
  const go = useCallback((s: Stage) => { setRipple((r) => r + 1); setStage(s); }, []);
  const toPlanets = useCallback(() => setStage("planets"), []);
  const c = CONTINENTS.find((x) => x.id === continent) ?? CONTINENTS[2]!;

  return (
    <MotionConfig reducedMotion="user">
      <main className="min-h-screen bg-background">
        <AnimatePresence mode="wait">
          <motion.div key={stage} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, filter: "blur(8px)" }} transition={{ duration: 0.7 }}>
            {stage === "landing" && <Landing onEnter={() => go("reveal")} />}
            {stage === "reveal" && <LogoReveal onDone={toPlanets} />}
            {stage === "planets" && <PlanetSelect onSelect={(id) => { setContinent(id); go("continent"); }} />}
            {stage === "continent" && <ContinentMap continent={c} onBack={() => setStage("planets")} onEnterTerra={() => go("terra")} />}
            {stage === "terra" && <Terra onAskSato={(q) => { setQuestion(q); go("sato"); }} />}
            {stage === "sato" && <Sato initial={question} onBack={() => setStage("terra")} />}
          </motion.div>
        </AnimatePresence>
        <Ripple trigger={ripple} />
      </main>
    </MotionConfig>
  );
}
