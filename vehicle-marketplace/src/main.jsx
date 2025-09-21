import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";

const el = document.getElementById("root");

try {
  const root = createRoot(el);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} catch (e) {
  console.error(e);
  if (el) {
    el.innerHTML = `<pre style="white-space:pre-wrap">${String(e)}</pre>`;
  }
}
