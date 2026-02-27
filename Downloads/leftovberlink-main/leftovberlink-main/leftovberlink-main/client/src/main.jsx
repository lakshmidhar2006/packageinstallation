import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

// We import both CSS files; index.css holds global tokens, App.css holds components.
import './index.css';
import './App.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);