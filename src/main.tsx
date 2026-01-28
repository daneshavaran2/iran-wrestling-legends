import { createRoot } from "react-dom/client";
import { useState, useEffect } from "react";
import App from "./App";
import "./index.css";
import { SplashScreen } from "./components/SplashScreen";
import { PWAUpdateNotification } from "./components/PWAUpdateNotification";

const Root = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    // Pre-load critical resources
    const preloadResources = async () => {
      // Wait for fonts to load
      if (document.fonts) {
        try {
          await document.fonts.ready;
        } catch (e) {
          console.log('Fonts ready check failed:', e);
        }
      }
      setAppReady(true);
    };

    preloadResources();
  }, []);

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  return (
    <>
      <PWAUpdateNotification />
      {showSplash && <SplashScreen onComplete={handleSplashComplete} minDisplayTime={2500} />}
      {appReady && <App />}
    </>
  );
};

createRoot(document.getElementById("root")!).render(<Root />);
