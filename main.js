const { app, BrowserWindow } = require('electron');
const path = require('path');

const envPath = app.isPackaged
  ? path.join(process.resourcesPath, '.env')
  : path.join(__dirname, '.env');

require('dotenv').config({ path: envPath });

require(path.join(__dirname, 'server.js'));

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 450,
    height: 750,
    resizable: true,
    autoHideMenuBar: true,
    title: "Hikari - Virtual Girlfriend",
    icon: path.join(__dirname, 'public', '384ce59382db9b5921a5341ee9b310b9.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  mainWindow.loadURL('http://213.154.18.113:9871');

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});