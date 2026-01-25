alert("MAIN.JSX ESEGUITO");

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";

console.log("MAIN.JSX CONSOLE LOG");


if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then(regs => {
    regs.forEach(reg => reg.unregister());
  });
}
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
