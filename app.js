const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

let mainWindow

/* // descomentar para pruebas de toasts con IPC
function makeToast(domEl,time){

    domEl.classList.add("show");
    setTimeout(function () { domEl.classList.remove("show"); }, time);

}

ipcMain.handle("make-toast",(el,ti)=>{
    makeToast(el, ti)
}); */

// Create a new BrowserWindow when `app` is ready
function createWindow() {

    mainWindow = new BrowserWindow({
        width: 1000,
        height: 800,
        minWidth: 800,
        minHeight: 400,        
        webPreferences: {
            nodeIntegration: true,
            enableRemoteModule: true            
        },
        //icon:"assets/imgs/icon.ico"
        icon:path.join(__dirname,"assets/imgs/icon.ico")
    })

    // Load index.html into the new BrowserWindow
    //mainWindow.loadFile('./views/main.html')
    mainWindow.loadFile(path.join(__dirname,'views/main.html'));

    // Open DevTools - Remove for PRODUCTION!
    //mainWindow.webContents.openDevTools();     // SOLO PARA DESARROLLO
    mainWindow.setMenuBarVisibility(false)
    // Listen for window being closed
    mainWindow.on('closed', () => {
        mainWindow = null
    })
}

// Electron `app` is ready
app.on('ready', createWindow)

// Quit when all windows are closed - (Not macOS - Darwin)
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
})

// When app icon is clicked and app is running, (macOS) recreate the BrowserWindow
app.on('activate', () => {
    if (mainWindow === null) createWindow()
})
