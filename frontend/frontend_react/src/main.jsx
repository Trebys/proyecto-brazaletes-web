import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { AutoLogout } from "./components/AutoLogout.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AutoLogout>
      <App />
    </AutoLogout>
  </React.StrictMode>
);
