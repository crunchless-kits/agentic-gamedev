// Art direction + feel tuning. One place for every color, magnitude and duration.
// Direction: "dusk archipelago" - warm dusk sky, chunky rounded shapes, one hot
// accent (gold hero, cyan gems) against cool backgrounds; storms are the only
// dark, desaturated, angular-edged threat so they read at a glance.
export const PAL = {
  skyTop: "#1b1747", skyMid: "#5b3a8c", skyLow: "#f08a6b", star: "#fff3d6",
  farCloud: "rgba(255,190,160,0.16)", nearCloud: "rgba(120,80,160,0.22)",
  grass: "#5fd16a", grassLight: "#9cf08a", dirt: "#8a5a3c", dirtDark: "#5a3a2c",
  gem: "#5ee7ff", gemCore: "#e6fcff", gemGlow: "rgba(94,231,255,0.35)",
  hero: "#ffd34d", heroDark: "#d9892b", ink: "#2a1a3a",
  storm: "#4a4766", stormLight: "#6d6a8c", bolt: "#fff7a8",
  text: "#fff7e8", shadow: "rgba(20,10,40,0.55)", danger: "#ff6b6b",
};

export const feel = {
  jump:   { squashX: 0.7, squashY: 1.35, dust: 6 },
  land:   { squashX: 1.35, squashY: 0.65, minVy: 4, dust: 8, shake: 2, shakeMs: 120 },
  gem:    { burst: 12, ring: 22, popMs: 700, hitStopMs: 35, pitchStep: 0.08, pitchMax: 1.5, comboMs: 1500 },
  death:  { burst: 36, shake: 10, shakeMs: 350, flashMs: 120 },
  spring: 0.22,        // squash recovery per tick
  maxParticles: 160,   // pooled cap
  reducedScale: 0.3,   // magnitude multiplier under prefers-reduced-motion
};
