const { app, screen, BrowserWindow } = require('electron');
const path = require('path');

/** @type {BrowserWindow} */
let window;
const createOverlayWindow = async () => {
    app.setAppUserModelId('net.godslayerakp.mister-mc-macenstein');
    // Making the overlay window fullscreen breaks some apps that also want to be in fullscreen.
    // The taskbar will stay visible inside of games if we use real fullscreen.
    const display = screen.getPrimaryDisplay();
    const { x, y, width, height } = display.workArea;
    const win = new BrowserWindow({
        icon: path.join(__dirname, '../../assets/icon_o.png'),
        width,
        height,
        sandbox: false,
        transparent: true,
        resizable: false,
        frame: false,
        webPreferences: {
            preload: require.resolve('./preload.js'),
            nodeIntegration: true,
            webSecurity: false
        }
    });

    await win.loadFile(path.join(__dirname, './player.html'));
    win.setIgnoreMouseEvents(true);
    win.setAlwaysOnTop(true, "screen-saver");
    win.setPosition(x, y, false);
    win.blur();
    win.on("close", () => {});

    window = win;
};

app.whenReady().then(() => {
    createOverlayWindow();
    const server = require('express')();
    server.get('/cancel', (req,res) => {
        window.webContents.send('cancel');
        res.send('Gaa');
    });
    server.get(/^(?<file>\/.*)/, (req, res) => {
        if (!window) return res.send('Not Yet');
        window.webContents.send('play', req.params.file);
        res.send('Goo');
    });
    server.listen(8080);
});