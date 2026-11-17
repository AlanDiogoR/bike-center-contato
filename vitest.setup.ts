import "@testing-library/jest-dom/vitest";

if (typeof document !== "undefined") {
  const style = document.createElement("style");
  style.textContent = `
    html:not([data-utm-source="placa"]) [data-placa="show"] { display: none; }
    html[data-utm-source="placa"] [data-placa="hide"] { display: none; }
  `;
  document.head.appendChild(style);
}
