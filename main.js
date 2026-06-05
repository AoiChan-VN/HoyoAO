import { BootstrapApp } from './src/app.js';

document.addEventListener('DOMContentLoaded', () => {
    const app = new BootstrapApp({
        viewportId: 'vr-viewport',
        sceneRootId: 'vr-scene-root',
        loaderId: 'app-loader'
    });
    app.init();

    const modal = document.getElementById('global-detail-modal');
    const btnProjects = document.getElementById('nav-trigger-projects');
    const btnProfile = document.getElementById('nav-trigger-profile');

    if (modal && btnProjects && btnProfile) {
        btnProjects.addEventListener('click', (e) => {
            e.stopPropagation();
            modal.setAttribute('data-type', 'projects');
            modal.setAttribute('data-title', 'Featured Projects');
            modal.setAttribute('open', 'true');
        });

        btnProfile.addEventListener('click', (e) => {
            e.stopPropagation();
            modal.setAttribute('data-type', 'profile');
            modal.setAttribute('data-title', 'Developer Profile');
            modal.setAttribute('open', 'true');
        });
    }
});
