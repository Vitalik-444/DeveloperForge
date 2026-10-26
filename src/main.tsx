import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { I18nProvider } from "./i18n";
import { SettingsProvider } from "./settings";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <I18nProvider>
    <SettingsProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </SettingsProvider>
  </I18nProvider>,
);
