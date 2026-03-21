const { ipcRenderer } = require("electron");

ipcRenderer.on('play', (_, file) => {
    const box = document.getElementById('media-box');
    /** @type {HTMLVideoElement} */
    const video = document.createElement('video');
    video.autoplay = true;
    video.controls = false;
    video.onended = () => video.remove();
    video.classList.add('background');
    /** @type {HTMLSourceElement} */
    const source = document.createElement('source');
    source.src = file;
    video.appendChild(source);
    box.appendChild(video);
});
ipcRenderer.on('cancel', () => {
    const box = document.getElementById('media-box');
    box.innerHTML = '';
})