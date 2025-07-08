const { app, BrowserWindow, screen } = require('electron');
const net = require('net');

let win;
const PORT = 3000;

const checkPort = (port, host = 'localhost', timeout = 1000) => {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(timeout);
    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.on('error', () => {
      resolve(false);
    });
    socket.connect(port, host);
  });
};

const waitForServer = async (port, retries = 40, interval = 500) => {
  for (let i = 0; i < retries; i++) {
    const isOpen = await checkPort(port);
    if (isOpen) return true;
    await new Promise((r) => setTimeout(r, interval));
  }
  return false;
};

function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  win = new BrowserWindow({
    width,
    height,
    webPreferences: {
      contextIsolation: true,
    },
    show: false,
  });

  win.once('ready-to-show', () => {
    win.show();
  });

  win.loadURL(`http://localhost:${PORT}`);
}

app.whenReady().then(async () => {
  const serverReady = await waitForServer(PORT, 40, 500);
  if (serverReady) {
    createWindow();
  } else {
    console.error('No se pudo conectar con el servidor en localhost:3000');
    const errorWin = new BrowserWindow({
      width: 600,
      height: 300,
    });
    errorWin.loadURL(`data:text/html;charset=utf-8,
      <h2 style='font-family:sans-serif;text-align:center;margin-top:100px;'>
        No se pudo conectar con el servidor en localhost:3000
      </h2>`);
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});