export type ThemeTokens = {
  colors: {
    primary: string;
    background: string;
    // Gold Coin Tokens
    coinOuter: string;
    coinInner: string;
    coinHighlight: string;
    coinEngraving: string;
    // Character: Wolf in Sheep's Clothing Tokens
    wolfFur: string;
    wolfEye: string;
    wolfNose: string;
    sheepFleece: string;
    sheepFace: string;
    characterOutline: string;
    // Asset: Eye of Horus / Providence
    eyeSclera: string;
    eyeIris: string;
    eyePupil: string;
    eyeMarkings: string;
    eyeGlow: string;
    // Asset: Broken Crown
    crownBase: string;
    crownJewel: string;
    crownHighlight: string;
    crownShadow: string;
    crownFracture: string;
    // Asset: Mysterious Smoke
    smokeCore: string;
    smokeAura: string;
    smokeWhisper: string;
    smokeShadow: string;
    // Asset: Shackles
    shackleBase: string;
    shackleHighlight: string;
    shackleShadow: string;
    shackleChain: string;
    // Asset: Balance Scale
    scaleBase: string;
    scaleHighlight: string;
    scalePlates: string;
    scaleStrings: string;
    // Asset: Masquerade Mask
    maskBase: string;
    maskAccent: string;
    maskFeather1: string;
    maskFeather2: string;
    maskRibbon: string;
  };
};

export const themes: Record<string, ThemeTokens> = {
  default: {
    colors: {
      primary: "#F59E0B", background: "#FFFFFF",
      coinOuter: "#D97706", coinInner: "#FBBF24", coinHighlight: "#FDE68A", coinEngraving: "#B45309",
      wolfFur: "#374151", wolfEye: "#EF4444", wolfNose: "#111827", sheepFleece: "#F3F4F6", sheepFace: "#D1D5DB", characterOutline: "#1F2937",
      eyeSclera: "#FDF8F5", eyeIris: "#3B82F6", eyePupil: "#111827", eyeMarkings: "#B45309", eyeGlow: "#FDE68A",
      crownBase: "#FBBF24", crownJewel: "#EF4444", crownHighlight: "#FEF3C7", crownShadow: "#92400E", crownFracture: "#78350F",
      smokeCore: "#9CA3AF", smokeAura: "#E5E7EB", smokeWhisper: "#D1D5DB", smokeShadow: "#4B5563",
      shackleBase: "#6B7280", shackleHighlight: "#D1D5DB", shackleShadow: "#1F2937", shackleChain: "#9CA3AF",
      scaleBase: "#B45309", scaleHighlight: "#FBBF24", scalePlates: "#D97706", scaleStrings: "#92400E",
      
      maskBase: "#FFFFFF",      // Porcelain white
      maskAccent: "#FBBF24",    // Gold trim
      maskFeather1: "#8B5CF6",  // Royal purple feather
      maskFeather2: "#3B82F6",  // Royal blue feather
      maskRibbon: "#9CA3AF",    // Silver ribbon
    }
  },
  dark: {
    colors: {
      primary: "#F59E0B", background: "#111827",
      coinOuter: "#92400E", coinInner: "#D97706", coinHighlight: "#FBBF24", coinEngraving: "#78350F",
      wolfFur: "#111827", wolfEye: "#DC2626", wolfNose: "#000000", sheepFleece: "#4B5563", sheepFace: "#374151", characterOutline: "#000000",
      eyeSclera: "#D1D5DB", eyeIris: "#1E3A8A", eyePupil: "#000000", eyeMarkings: "#78350F", eyeGlow: "#78350F",
      crownBase: "#4B5563", crownJewel: "#7F1D1D", crownHighlight: "#9CA3AF", crownShadow: "#111827", crownFracture: "#000000",
      smokeCore: "#374151", smokeAura: "#1F2937", smokeWhisper: "#4B5563", smokeShadow: "#000000",
      shackleBase: "#1F2937", shackleHighlight: "#4B5563", shackleShadow: "#000000", shackleChain: "#374151",
      scaleBase: "#374151", scaleHighlight: "#6B7280", scalePlates: "#1F2937", scaleStrings: "#000000",
      
      maskBase: "#111827",      // Pitch black velvet
      maskAccent: "#991B1B",    // Deep blood red trim
      maskFeather1: "#4C1D95",  // Dark purple feather
      maskFeather2: "#1E3A8A",  // Midnight blue feather
      maskRibbon: "#000000",    // Pitch black string
    }
  },
  cyberpunk: {
    colors: {
      primary: "#00FF9F", background: "#001119",
      coinOuter: "#00FF9F", coinInner: "#00B8FF", coinHighlight: "#FFFFFF", coinEngraving: "#FF00E5",
      wolfFur: "#1A0033", wolfEye: "#00FF9F", wolfNose: "#FF00E5", sheepFleece: "#00B8FF", sheepFace: "#001119", characterOutline: "#00FF9F",
      eyeSclera: "#001119", eyeIris: "#FF00E5", eyePupil: "#00FF9F", eyeMarkings: "#00B8FF", eyeGlow: "#FF00E5",
      crownBase: "#00FF9F", crownJewel: "#FF00E5", crownHighlight: "#FFFFFF", crownShadow: "#001119", crownFracture: "#FF00E5",
      smokeCore: "#00B8FF", smokeAura: "#FF00E5", smokeWhisper: "#00FF9F", smokeShadow: "#001119",
      shackleBase: "#001119", shackleHighlight: "#00FF9F", shackleShadow: "#FF00E5", shackleChain: "#00B8FF",
      scaleBase: "#00B8FF", scaleHighlight: "#FFFFFF", scalePlates: "#FF00E5", scaleStrings: "#00FF9F",
      
      maskBase: "#001119",      // Dark polymer/tech face
      maskAccent: "#00FF9F",    // Neon green fiber-optic trim
      maskFeather1: "#FF00E5",  // Holographic pink feather
      maskFeather2: "#00B8FF",  // Holographic cyan feather
      maskRibbon: "#00FF9F",    // Glowing neon green tether
    }
  }
};
