import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SnackbarProvider } from "notistack";
import { BlueWirksThemeProvider } from "./ThemeProvider";
import App from "./App";

const qc = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 30_000 },
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={qc}>
        <BlueWirksThemeProvider>
          <SnackbarProvider
            maxSnack={4}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            autoHideDuration={4000}
          >
            <App />
          </SnackbarProvider>
        </BlueWirksThemeProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
