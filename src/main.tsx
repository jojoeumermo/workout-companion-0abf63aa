import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Belt-and-suspenders against the Android WebView long-press white-window
// (system action mode / share sheet). CSS already disables selection on
// inputs; this also blocks the contextmenu event globally so any stray
// long-press on text/images doesn't trigger the native menu either.
if (typeof window !== "undefined") {
  window.addEventListener(
    "contextmenu",
    (e) => {
      // Don't preventDefault inside a paste-allowed input (escape hatch)
      const t = e.target as HTMLElement | null;
      if (t && (t as HTMLElement).classList?.contains("allow-paste")) return;
      e.preventDefault();
    },
    { capture: true }
  );

  // Suppress the long-press text selection that triggers the toolbar
  // on non-input elements (images, divs, badges, etc).
  window.addEventListener(
    "selectstart",
    (e) => {
      const t = e.target as HTMLElement | null;
      if (!t) return;
      const tag = t.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if ((t as HTMLElement).isContentEditable) return;
      if (t.closest && t.closest(".allow-paste")) return;
      e.preventDefault();
    },
    { capture: true }
  );
}

createRoot(document.getElementById("root")!).render(<App />);
