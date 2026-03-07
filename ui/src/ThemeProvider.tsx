import React, { createContext, useContext, useState, useMemo, type ReactNode } from "react";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { darkTheme, lightTheme } from "./theme";

type Mode = "dark" | "light";

interface ThemeCtx {
  mode: Mode;
  toggle: () => void;
}

const Ctx = createContext<ThemeCtx>({ mode: "dark", toggle: () => {} });

export const useThemeMode = () => useContext(Ctx);

export function BlueWirksThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<Mode>(
    () => (localStorage.getItem("bw_theme") as Mode) || "dark",
  );

  const toggle = () =>
    setMode((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      localStorage.setItem("bw_theme", next);
      return next;
    });

  const theme = useMemo(() => (mode === "dark" ? darkTheme : lightTheme), [mode]);

  return (
    <Ctx.Provider value={{ mode, toggle }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </Ctx.Provider>
  );
}
