import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Brand protection and console signature
console.log(
  "%cBuilt with ❤️ by Lee Cole & Gloria Gunn – https://ezprofitsoftware.com/lazy-marketers-dream-come-true/",
  "color:#1d4ed8;font-weight:bold;font-size:14px"
);

createRoot(document.getElementById("root")!).render(<App />);
