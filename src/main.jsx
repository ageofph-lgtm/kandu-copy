import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'

// O aviso de versão nova recarrega com ?_v=<timestamp>: limpa-o do URL
if (window.location.search.includes('_v=')) {
  const params = new URLSearchParams(window.location.search)
  params.delete('_v')
  const query = params.toString()
  window.history.replaceState({}, '', window.location.pathname + (query ? '?' + query : '') + window.location.hash)
}

ReactDOM.createRoot(document.getElementById('root')).render(
  // <React.StrictMode>
  <App />
  // </React.StrictMode>,
)

// Web Push — o service worker só se regista em produção (o dev usa o HMR do Vite)
if ('serviceWorker' in navigator && !import.meta.hot) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => setInterval(() => reg.update().catch(() => {}), 30 * 60 * 1000))
      .catch(() => {});
  });
}

if (import.meta.hot) {
  import.meta.hot.on('vite:beforeUpdate', () => {
    window.parent?.postMessage({ type: 'sandbox:beforeUpdate' }, '*');
  });
  import.meta.hot.on('vite:afterUpdate', () => {
    window.parent?.postMessage({ type: 'sandbox:afterUpdate' }, '*');
  });
}