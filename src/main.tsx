import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

console.log("main.tsx cargado");
console.log("root element:", document.getElementById("root"));

ReactDOM.createRoot(document.getElementById("root")!).render(<App />);
