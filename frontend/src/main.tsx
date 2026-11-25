import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { store } from "./store";
import App from "./App";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import "leaflet/dist/leaflet.css";
import { registerLocale } from "react-datepicker";
import { th } from "date-fns/locale/th";
registerLocale("th", th);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Provider>
  </React.StrictMode>,
);

// ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
//   <React.StrictMode>
//     <Provider store={store}>
//       <BrowserRouter basename="/cs67/reactnative/boat">
//         <App />
//       </BrowserRouter>
//     </Provider>
//   </React.StrictMode>,
// );
