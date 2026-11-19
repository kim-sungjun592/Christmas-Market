import { hydrateRoot } from 'react-dom/client';
import { App, type InitialData } from './root';
import './runtime.css';

declare global { interface Window { __VERT_INITIAL__: InitialData } }
hydrateRoot(document.getElementById('root')!, <App initial={window.__VERT_INITIAL__} />);
