// Background.jsx – varied sizes, colours, and random-feeling layout
import React from "react";
import { TOTAL_WIDTH, TOTAL_HEIGHT } from "../utils";

/** Decorative “space dust” layer: one div, six radial-gradient tiles. */
export default function Background() {
  return (
    <div
      style={{
        position       : "absolute",
        top            : 0,
        left           : 0,
        width          : TOTAL_WIDTH,
        height         : TOTAL_HEIGHT,
        pointerEvents  : "none",
        zIndex         : 0,
        backgroundColor: "#0a0a1a",

        /* 6 radial-gradient layers, smallest & brightest first           */
        backgroundImage: `
          radial-gradient(rgba(255,255,255,0.9) 1px , transparent 1.2px),
          radial-gradient(rgba(255,255,255,0.6) 1.3px, transparent 1.5px),
          radial-gradient(rgba(255,255,255,0.4) 2px  , transparent 2.3px),
          radial-gradient(rgba(177,215,255,0.7) 1px  , transparent 1.2px),
          radial-gradient(rgba(255,230,173,0.7) 1px  , transparent 1.2px),
          radial-gradient(rgba(255,255,255,0.2) 0.6px, transparent 0.8px)
        `,

        /* Different tile sizes → pseudo-random scatter                    */
        backgroundSize: `
          180px 180px,
          340px 340px,
          520px 520px,
          260px 260px,
          390px 390px,
          700px 700px
        `,

        /* Offsets break up visible grid lines                            */
        backgroundPosition: `
          0px    0px,
          90px  130px,
          50px  -80px,
          -30px  60px,
          -110px -90px,
          120px  200px
        `
      }}
    />
  );
}
