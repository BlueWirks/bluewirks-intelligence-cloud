import { createTheme, alpha } from "@mui/material/styles";

// ── BlueWirks Design Tokens ──────────────────────────────────────────────────
// Google Cloud–aligned palette, Material Design 3 foundations
// Dark mode default, 8px grid, Google Sans headings, Roboto body

const BRAND = {
  blue: {
    50: "#E8F0FE",
    100: "#D2E3FC",
    200: "#AECBFA",
    300: "#8AB4F8",
    400: "#669DF6",
    500: "#4285F4",
    600: "#1A73E8",
    700: "#1967D2",
    800: "#185ABC",
    900: "#174EA6",
  },
  green: {
    50: "#E6F4EA",
    400: "#5BB974",
    500: "#34A853",
    600: "#1E8E3E",
    700: "#188038",
  },
  amber: {
    50: "#FEF7E0",
    400: "#FDD663",
    500: "#FBBC04",
    600: "#F9AB00",
    700: "#F29900",
  },
  red: {
    50: "#FCE8E6",
    400: "#EE675C",
    500: "#EA4335",
    600: "#D93025",
    700: "#C5221F",
  },
  neutral: {
    0: "#FFFFFF",
    50: "#F8F9FA",
    100: "#F1F3F4",
    200: "#E8EAED",
    300: "#DADCE0",
    400: "#BDC1C6",
    500: "#9AA0A6",
    600: "#80868B",
    700: "#5F6368",
    800: "#3C4043",
    900: "#202124",
    950: "#171717",
    1000: "#0D0D0D",
  },
} as const;

const SURFACE_DARK = {
  background: "#0F1117",
  paper: "#161822",
  elevated: "#1C1F2E",
  overlay: "#222639",
  border: alpha(BRAND.neutral[400], 0.12),
  borderHover: alpha(BRAND.neutral[400], 0.24),
};

const SURFACE_LIGHT = {
  background: "#FAFBFD",
  paper: "#FFFFFF",
  elevated: "#FFFFFF",
  overlay: BRAND.neutral[50],
  border: BRAND.neutral[200],
  borderHover: BRAND.neutral[300],
};

const headingFont = "'Google Sans', 'Roboto', sans-serif";
const bodyFont = "'Roboto', sans-serif";
const monoFont = "'Roboto Mono', monospace";

function buildTheme(mode: "dark" | "light") {
  const isDark = mode === "dark";
  const surface = isDark ? SURFACE_DARK : SURFACE_LIGHT;

  return createTheme({
    palette: {
      mode,
      primary: {
        main: BRAND.blue[600],
        light: BRAND.blue[300],
        dark: BRAND.blue[800],
        contrastText: "#FFFFFF",
      },
      secondary: {
        main: BRAND.blue[300],
        light: BRAND.blue[100],
        dark: BRAND.blue[500],
      },
      success: {
        main: BRAND.green[500],
        light: BRAND.green[400],
        dark: BRAND.green[700],
      },
      warning: {
        main: BRAND.amber[500],
        light: BRAND.amber[400],
        dark: BRAND.amber[700],
      },
      error: {
        main: BRAND.red[500],
        light: BRAND.red[400],
        dark: BRAND.red[700],
      },
      background: {
        default: surface.background,
        paper: surface.paper,
      },
      divider: surface.border,
      text: {
        primary: isDark ? BRAND.neutral[100] : BRAND.neutral[900],
        secondary: isDark ? BRAND.neutral[400] : BRAND.neutral[700],
        disabled: isDark ? BRAND.neutral[600] : BRAND.neutral[500],
      },
    },
    typography: {
      fontFamily: bodyFont,
      h1: { fontFamily: headingFont, fontWeight: 700, fontSize: "2rem", lineHeight: 1.2, letterSpacing: "-0.02em" },
      h2: { fontFamily: headingFont, fontWeight: 700, fontSize: "1.5rem", lineHeight: 1.3, letterSpacing: "-0.01em" },
      h3: { fontFamily: headingFont, fontWeight: 600, fontSize: "1.25rem", lineHeight: 1.4 },
      h4: { fontFamily: headingFont, fontWeight: 600, fontSize: "1.125rem", lineHeight: 1.4 },
      h5: { fontFamily: headingFont, fontWeight: 500, fontSize: "1rem", lineHeight: 1.5 },
      h6: { fontFamily: headingFont, fontWeight: 500, fontSize: "0.875rem", lineHeight: 1.5 },
      subtitle1: { fontFamily: headingFont, fontWeight: 500, fontSize: "0.875rem" },
      subtitle2: { fontFamily: headingFont, fontWeight: 500, fontSize: "0.8125rem" },
      body1: { fontSize: "0.875rem", lineHeight: 1.6 },
      body2: { fontSize: "0.8125rem", lineHeight: 1.5 },
      caption: { fontSize: "0.75rem", lineHeight: 1.5, color: isDark ? BRAND.neutral[500] : BRAND.neutral[600] },
      overline: { fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" as const },
      button: { fontFamily: headingFont, fontWeight: 500, textTransform: "none" as const, fontSize: "0.875rem" },
    },
    shape: { borderRadius: 12 },
    spacing: 8,
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            scrollbarWidth: "thin",
            scrollbarColor: `${isDark ? BRAND.neutral[700] : BRAND.neutral[300]} transparent`,
          },
          "*::-webkit-scrollbar": { width: 6, height: 6 },
          "*::-webkit-scrollbar-track": { background: "transparent" },
          "*::-webkit-scrollbar-thumb": {
            background: isDark ? BRAND.neutral[700] : BRAND.neutral[300],
            borderRadius: 3,
          },
          code: { fontFamily: monoFont, fontSize: "0.8125em" },
        },
      },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: { borderRadius: 8, padding: "8px 20px", fontWeight: 500 },
          sizeSmall: { padding: "4px 12px", fontSize: "0.8125rem" },
          containedPrimary: {
            background: `linear-gradient(135deg, ${BRAND.blue[600]} 0%, ${BRAND.blue[700]} 100%)`,
            "&:hover": { background: `linear-gradient(135deg, ${BRAND.blue[500]} 0%, ${BRAND.blue[600]} 100%)` },
          },
        },
      },
      MuiPaper: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: {
            backgroundImage: "none",
            border: `1px solid ${surface.border}`,
            ...(isDark && { backgroundColor: surface.paper }),
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            border: `1px solid ${surface.border}`,
            borderRadius: 12,
            transition: "border-color 0.2s, box-shadow 0.2s",
            "&:hover": {
              borderColor: surface.borderHover,
              boxShadow: isDark
                ? `0 4px 24px ${alpha("#000", 0.3)}`
                : `0 4px 24px ${alpha("#000", 0.08)}`,
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: { fontWeight: 500, borderRadius: 6, height: 24, fontSize: "0.75rem" },
          sizeSmall: { height: 20, fontSize: "0.6875rem" },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderBottom: `1px solid ${surface.border}`,
            padding: "10px 16px",
            fontSize: "0.8125rem",
          },
          head: {
            fontFamily: headingFont,
            fontWeight: 600,
            fontSize: "0.75rem",
            textTransform: "uppercase" as const,
            letterSpacing: "0.05em",
            color: isDark ? BRAND.neutral[400] : BRAND.neutral[600],
          },
        },
      },
      MuiTableRow: {
        styleOverrides: {
          root: {
            "&:hover": { backgroundColor: isDark ? alpha(BRAND.blue[600], 0.06) : alpha(BRAND.blue[600], 0.04) },
          },
        },
      },
      MuiTextField: {
        defaultProps: { size: "small", variant: "outlined" },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: { borderRadius: 8 },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: { borderRadius: 16, border: `1px solid ${surface.border}` },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            backgroundColor: isDark ? BRAND.neutral[800] : BRAND.neutral[900],
            fontSize: "0.75rem",
            borderRadius: 6,
            padding: "6px 12px",
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundColor: isDark ? "#0D0F17" : BRAND.neutral[50],
            borderRight: `1px solid ${surface.border}`,
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            margin: "2px 8px",
            padding: "6px 12px",
            "&.Mui-selected": {
              backgroundColor: alpha(BRAND.blue[600], isDark ? 0.15 : 0.1),
              color: BRAND.blue[isDark ? 300 : 600],
              "& .MuiListItemIcon-root": { color: BRAND.blue[isDark ? 300 : 600] },
            },
            "&:hover": {
              backgroundColor: alpha(BRAND.blue[600], isDark ? 0.08 : 0.05),
            },
          },
        },
      },
      MuiListItemIcon: {
        styleOverrides: {
          root: { minWidth: 36, color: isDark ? BRAND.neutral[500] : BRAND.neutral[600] },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            fontFamily: headingFont,
            fontWeight: 500,
            textTransform: "none" as const,
            minHeight: 40,
          },
        },
      },
      MuiTabs: {
        styleOverrides: {
          indicator: { height: 3, borderRadius: "3px 3px 0 0" },
        },
      },
      MuiSkeleton: {
        styleOverrides: {
          root: { borderRadius: 8 },
        },
      },
    },
  });
}

export const darkTheme = buildTheme("dark");
export const lightTheme = buildTheme("light");
export { BRAND, SURFACE_DARK, SURFACE_LIGHT, monoFont, headingFont };
