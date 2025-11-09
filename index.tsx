
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// The onGapiLoad and onGisLoad callbacks are now defined in index.html
// to ensure they exist globally before the Google scripts load.

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);