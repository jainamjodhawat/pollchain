import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import AppErrorBoundary from "./components/AppErrorBoundary";
import ConsentBasedMonitoring from "./components/ConsentBasedMonitoring";
import { WalletProvider } from "./hooks/useWallet";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <WalletProvider>
        <App />
      </WalletProvider>
    </AppErrorBoundary>
    <ConsentBasedMonitoring />
  </React.StrictMode>
);
