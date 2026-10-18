import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import './fonts.css';
import './studio.css';
import {loadCaptionFonts} from './data/fonts';
void loadCaptionFonts();

ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
