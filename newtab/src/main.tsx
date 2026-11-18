import React from "react";
import { createRoot } from "react-dom/client";
import ErrorProvider from "./contexts/error";
import TimeProvider from "./contexts/time";
import UiProvider from "./contexts/ui";
import IntlProvider from "./locales/IntlProvider";
import App from "./views/App";

const container = document.getElementById("root");
if (!container) throw new Error("Missing new tab root");

createRoot(container).render(
  <React.StrictMode>
    <ErrorProvider>
      <UiProvider>
        <IntlProvider>
          <TimeProvider>
            <App />
          </TimeProvider>
        </IntlProvider>
      </UiProvider>
    </ErrorProvider>
  </React.StrictMode>,
);
