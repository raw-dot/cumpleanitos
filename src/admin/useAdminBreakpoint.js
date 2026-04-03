import { useState, useEffect } from "react";

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => 
    typeof window !== "undefined" && window.innerWidth < 768
  );
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return isMobile;
}

// Grids responsivos
export const rg = {
  // 6 cols → 2 en mobile
  kpi6: (mobile) => mobile ? "repeat(2, 1fr)" : "repeat(6, minmax(0,1fr))",
  // 4 cols → 2 en mobile
  stat4: (mobile) => mobile ? "repeat(2, 1fr)" : "repeat(4, minmax(0,1fr))",
  // 3 cols → 1 en mobile
  col3: (mobile) => mobile ? "1fr" : "repeat(3, minmax(0,1fr))",
  // 2 cols → 1 en mobile
  col2: (mobile) => mobile ? "1fr" : "1fr 1fr",
  // chart + panel lateral → stack
  chartPanel: (mobile) => mobile ? "1fr" : "1fr 280px",
  // tabla + feed → stack
  tablePanel: (mobile) => mobile ? "1fr" : "1fr 300px",
  // config sidebar + content
  configLayout: (mobile) => mobile ? "1fr" : "200px 1fr",
};
