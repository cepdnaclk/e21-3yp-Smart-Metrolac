tailwind.config = {
  theme: {
    extend: {
      colors: {
        "inverse-surface": "#313030", "on-tertiary": "#ffffff", "on-tertiary-fixed": "#002020",
        "on-primary-container": "#819986", "tertiary": "#001a1a", "outline-variant": "#c3c8c1",
        "surface-bright": "#fcf9f8", "surface-container-high": "#eae7e7", "on-secondary-container": "#696458",
        "surface": "#fcf9f8", "error-container": "#ffdad6", "on-primary-fixed": "#0b2013",
        "primary-container": "#1b3022", "inverse-primary": "#b4cdb8", "error": "#ba1a1a",
        "surface-container-lowest": "#ffffff", "outline": "#737973", "surface-variant": "#e5e2e1",
        "tertiary-fixed": "#93f2f2", "on-surface-variant": "#434843", "inverse-on-surface": "#f3f0ef",
        "surface-dim": "#dcd9d9", "tertiary-container": "#003131", "on-tertiary-container": "#3ca1a0",
        "tertiary-fixed-dim": "#76d6d5", "secondary-fixed-dim": "#cdc6b8", "surface-tint": "#4d6453",
        "on-tertiary-fixed-variant": "#004f4f", "secondary-container": "#e9e2d3", "surface-container-low": "#f6f3f2",
        "on-primary-fixed-variant": "#364c3c", "secondary-fixed": "#e9e2d3", "on-surface": "#1c1b1b",
        "on-secondary": "#ffffff", "on-secondary-fixed": "#1e1b13", "primary-fixed": "#d0e9d4",
        "surface-container": "#f0eded", "secondary": "#635e53", "background": "#fcf9f8",
        "primary-fixed-dim": "#b4cdb8", "on-primary": "#ffffff", "on-background": "#1c1b1b",
        "on-secondary-fixed-variant": "#4b463c", "on-error": "#ffffff", "surface-container-highest": "#e5e2e1",
        "primary": "#061b0e", "on-error-container": "#93000a"
      },
      borderRadius: { DEFAULT: "0.125rem", lg: "0.25rem", xl: "0.5rem", full: "0.75rem" },
      spacing: { "margin-mobile": "16px", gutter: "24px", md: "24px", "margin-desktop": "64px", xs: "4px", lg: "48px", xl: "80px", sm: "12px", base: "8px" },
      fontFamily: {
        "body-sm": ["Inter"], "body-md": ["Inter"], "data-display": ["JetBrains Mono"],
        "headline-lg": ["Inter"], "headline-md": ["Inter"], "label-caps": ["JetBrains Mono"],
        "body-lg": ["Inter"], "headline-lg-mobile": ["Inter"], "headline-xl": ["Inter"]
      },
      fontSize: {
        "body-sm": ["14px", { lineHeight: "20px", fontWeight: "400" }],
        "body-md": ["16px", { lineHeight: "24px", fontWeight: "400" }],
        "data-display": ["20px", { lineHeight: "24px", fontWeight: "500" }],
        "headline-lg": ["32px", { lineHeight: "40px", letterSpacing: "-0.01em", fontWeight: "700" }],
        "headline-md": ["24px", { lineHeight: "32px", fontWeight: "600" }],
        "label-caps": ["12px", { lineHeight: "16px", letterSpacing: "0.05em", fontWeight: "600" }],
        "body-lg": ["18px", { lineHeight: "28px", fontWeight: "400" }],
        "headline-lg-mobile": ["24px", { lineHeight: "32px", fontWeight: "700" }],
        "headline-xl": ["48px", { lineHeight: "56px", letterSpacing: "-0.02em", fontWeight: "700" }]
      }
    }
  }
};