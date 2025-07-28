import { loadApiData } from './apiHandler.js';
import { addInteractions, addGeneralInteractions } from './interactions.js';
import { saveFeature } from './apiHandler.js';

document.getElementById('saveFeatureBtn').onclick = saveFeature;

document.addEventListener('DOMContentLoaded', () => {
    loadApiData(1);
    addInteractions();
    addGeneralInteractions();
});