// Hand-drawn SVG illustrations (no external images needed).
window.SH_ART = {
  tomato: function (size) {
    size = size || 48;
    return '<svg class="art-tomato" width="' + size + '" height="' + size + '" viewBox="0 0 64 64" aria-hidden="true">' +
      '<ellipse cx="32" cy="38" rx="25" ry="22" fill="#E8452C"/>' +
      '<ellipse cx="22" cy="28" rx="7" ry="4.5" fill="#FF8A73" opacity=".7" transform="rotate(-28 22 28)"/>' +
      '<path d="M32 17 L26 9 L31 13 L32 5 L34 13 L39 9 L35 17 L44 14 L37 21 Q32 24 27 21 L20 14 Z" fill="#3E8E41"/>' +
      '</svg>';
  },

  leaf: function (size) {
    size = size || 40;
    return '<svg class="art-leaf" width="' + size + '" height="' + size + '" viewBox="0 0 64 64" aria-hidden="true">' +
      '<path d="M8 56 C6 26 26 8 58 8 C58 40 40 58 8 56 Z" fill="#5BAE5E"/>' +
      '<path d="M10 54 C24 40 36 28 52 14" stroke="#2D6A33" stroke-width="3" fill="none" stroke-linecap="round"/>' +
      '</svg>';
  },

  // Hero scene: rover + robotic arm picking a ripe tomato in a tomato row.
  hero: function () {
    return '<svg class="art-hero" viewBox="0 0 400 270" role="img" aria-label="Illustration of a small robot with an arm picking a ripe tomato">' +
      '<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF1D6"/><stop offset="1" stop-color="#FFFBF2"/></linearGradient></defs>' +
      '<rect width="400" height="270" rx="28" fill="url(#sky)"/>' +
      '<circle cx="332" cy="56" r="30" fill="#FFD27A"/>' +
      '<g class="cloud" fill="#fff"><ellipse cx="86" cy="52" rx="30" ry="12"/><ellipse cx="108" cy="44" rx="20" ry="11"/><ellipse cx="64" cy="46" rx="16" ry="9"/></g>' +
      // hills
      '<path d="M0 200 Q90 150 190 190 T400 170 V270 H0 Z" fill="#CFE9C4"/>' +
      '<path d="M0 225 Q110 190 220 222 T400 212 V270 H0 Z" fill="#9DD18F"/>' +
      '<rect y="244" width="400" height="26" fill="#6DB35F"/>' +
      // plant (right)
      '<g>' +
      '<path d="M296 246 C298 200 292 150 296 70" stroke="#2D6A33" stroke-width="5" fill="none" stroke-linecap="round"/>' +
      '<ellipse cx="318" cy="96" rx="22" ry="10" fill="#4FA553" transform="rotate(-25 318 96)"/>' +
      '<ellipse cx="272" cy="118" rx="22" ry="10" fill="#5BAE5E" transform="rotate(20 272 118)"/>' +
      '<ellipse cx="322" cy="168" rx="22" ry="10" fill="#4FA553" transform="rotate(-20 322 168)"/>' +
      '<ellipse cx="270" cy="196" rx="22" ry="10" fill="#5BAE5E" transform="rotate(18 270 196)"/>' +
      '<circle class="pick" cx="262" cy="136" r="16" fill="#E8452C"/><path d="M254 124 L262 128 L270 124 L264 132 L260 132 Z" fill="#3E8E41"/>' +
      '<circle cx="324" cy="130" r="14" fill="#E8452C"/><path d="M317 119 L324 123 L331 119 L326 126 L322 126 Z" fill="#3E8E41"/>' +
      '<circle cx="326" cy="202" r="13" fill="#9BCB6B"/><circle cx="270" cy="228" r="12" fill="#9BCB6B"/>' +
      '<circle cx="318" cy="76" r="12" fill="#9BCB6B"/>' +
      '</g>' +
      // rover
      '<g>' +
      '<rect x="58" y="196" width="112" height="34" rx="12" fill="#2D6A33"/>' +
      '<rect x="68" y="204" width="46" height="8" rx="4" fill="#9DD18F"/>' +
      '<circle cx="152" cy="213" r="5" fill="#FFD27A"/>' +
      '<g fill="#2B2A28"><circle cx="76" cy="238" r="13"/><circle cx="104" cy="238" r="13"/><circle cx="130" cy="238" r="13"/><circle cx="156" cy="238" r="13"/></g>' +
      '<g fill="#fff"><circle cx="76" cy="238" r="4.5"/><circle cx="104" cy="238" r="4.5"/><circle cx="130" cy="238" r="4.5"/><circle cx="156" cy="238" r="4.5"/></g>' +
      // arm
      '<g class="arm" stroke-linecap="round" fill="none">' +
      '<path d="M112 196 L136 150" stroke="#F4A93B" stroke-width="10"/>' +
      '<path d="M136 150 L212 130" stroke="#F4A93B" stroke-width="9"/>' +
      '<circle cx="112" cy="196" r="9" fill="#2B2A28"/><circle cx="136" cy="150" r="8" fill="#2B2A28"/><circle cx="212" cy="130" r="7" fill="#2B2A28"/>' +
      '<path d="M212 130 L238 122 M212 130 L236 140" stroke="#2B2A28" stroke-width="5"/>' +
      '</g>' +
      '</g>' +
      '</svg>';
  },

  vine: function () {
    return '<svg class="art-vine" viewBox="0 0 120 200" aria-hidden="true">' +
      '<path d="M60 200 C40 150 80 120 56 70 C46 50 60 20 70 4" stroke="#3E8E41" stroke-width="4" fill="none" stroke-linecap="round"/>' +
      '<ellipse cx="82" cy="150" rx="24" ry="10" fill="#5BAE5E" transform="rotate(-24 82 150)"/>' +
      '<ellipse cx="34" cy="108" rx="24" ry="10" fill="#4FA553" transform="rotate(24 34 108)"/>' +
      '<ellipse cx="80" cy="64" rx="22" ry="9" fill="#5BAE5E" transform="rotate(-28 80 64)"/>' +
      '<circle cx="40" cy="150" r="14" fill="#E8452C"/><circle cx="84" cy="100" r="12" fill="#E8452C"/>' +
      '</svg>';
  },

  // Small icon set for the three answer options and question badges are emoji (no files needed).
  seedling: function (size) {
    size = size || 28;
    return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 48 48" aria-hidden="true">' +
      '<path d="M24 44 V24" stroke="#3E8E41" stroke-width="4" stroke-linecap="round"/>' +
      '<path d="M24 26 C10 26 6 16 6 8 C16 8 24 12 24 26Z" fill="#5BAE5E"/>' +
      '<path d="M24 22 C24 12 32 8 42 8 C42 18 36 24 24 22Z" fill="#4FA553"/></svg>';
  }
};
