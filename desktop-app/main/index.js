import { app, BrowserWindow, ipcMain, shell, dialog } from 'electron';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs/promises';
import Store from 'electron-store';
import log from 'electron-log';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure logging
log.transports.file.level = 'info';
log.transports.console.level = 'debug';

// Initialize store
const store = new Store({
  name: 'config',
  defaults: {
    windowBounds: { width: 1400, height: 900 },
    apiUrl: 'http://localhost:3000/api/v1',
    theme: 'light',
    profiles: [],
  },
});

let mainWindow = null;
let browserWindows = new Map(); // Track browser instances

// Development mode check
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

// Create main window
function createMainWindow() {
  const windowBounds = store.get('windowBounds');

  mainWindow = new BrowserWindow({
    ...windowBounds,
    minWidth: 1000,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      preload: path.join(__dirname, '../preload/preload.js'),
    },
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    show: false,
  });

  // Load the app
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/dist/index.html'));
  }

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    log.info('Main window shown');
  });

  // Save window bounds on close
  mainWindow.on('close', () => {
    const bounds = mainWindow.getBounds();
    store.set('windowBounds', bounds);
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

// App ready
app.whenReady().then(() => {
  log.info('App is ready');
  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

// Quit when all windows are closed (except macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handlers

/**
 * Store management
 */
ipcMain.handle('store:get', (event, key) => {
  return store.get(key);
});

ipcMain.handle('store:set', (event, key, value) => {
  store.set(key, value);
  return true;
});

ipcMain.handle('store:delete', (event, key) => {
  store.delete(key);
  return true;
});

ipcMain.handle('store:clear', () => {
  store.clear();
  return true;
});

/**
 * Profile management
 */
ipcMain.handle('profile:launch', async (event, profile) => {
  try {
    log.info(`Launching profile: ${profile.name}`);

    // Import browser launcher dynamically
    const { launchBrowser } = await import('../browser-core/launcher.js');
    
    const browser = await launchBrowser(profile);
    
    // Track browser instance
    browserWindows.set(profile.id, browser);

    log.info(`Profile launched successfully: ${profile.name}`);
    
    return {
      success: true,
      message: 'Profile launched successfully',
    };
  } catch (error) {
    log.error('Failed to launch profile:', error);
    return {
      success: false,
      error: error.message,
    };
  }
});

ipcMain.handle('profile:close', async (event, profileId) => {
  try {
    const browser = browserWindows.get(profileId);
    
    if (browser) {
      await browser.close();
      browserWindows.delete(profileId);
      log.info(`Profile closed: ${profileId}`);
    }

    return { success: true };
  } catch (error) {
    log.error('Failed to close profile:', error);
    return {
      success: false,
      error: error.message,
    };
  }
});

ipcMain.handle('profile:export', async (event, profile) => {
  try {
    const { filePath } = await dialog.showSaveDialog(mainWindow, {
      title: 'Export Profile',
      defaultPath: `${profile.name}.json`,
      filters: [
        { name: 'JSON Files', extensions: ['json'] },
        { name: 'All Files', extensions: ['*'] },
      ],
    });

    if (filePath) {
      await fs.writeFile(filePath, JSON.stringify(profile, null, 2));
      log.info(`Profile exported to: ${filePath}`);
      return { success: true, filePath };
    }

    return { success: false, cancelled: true };
  } catch (error) {
    log.error('Failed to export profile:', error);
    return {
      success: false,
      error: error.message,
    };
  }
});

ipcMain.handle('profile:import', async (event) => {
  try {
    const { filePaths } = await dialog.showOpenDialog(mainWindow, {
      title: 'Import Profile',
      filters: [
        { name: 'JSON Files', extensions: ['json'] },
        { name: 'All Files', extensions: ['*'] },
      ],
      properties: ['openFile'],
    });

    if (filePaths && filePaths.length > 0) {
      const content = await fs.readFile(filePaths[0], 'utf-8');
      const profile = JSON.parse(content);
      log.info('Profile imported successfully');
      return { success: true, profile };
    }

    return { success: false, cancelled: true };
  } catch (error) {
    log.error('Failed to import profile:', error);
    return {
      success: false,
      error: error.message,
    };
  }
});

/**
 * Cookies management
 */
ipcMain.handle('cookies:export', async (event, profileId) => {
  try {
    const browser = browserWindows.get(profileId);
    
    if (!browser) {
      throw new Error('Browser instance not found');
    }

    const pages = await browser.pages();
    const cookies = await pages[0].cookies();

    const { filePath } = await dialog.showSaveDialog(mainWindow, {
      title: 'Export Cookies',
      defaultPath: `cookies-${profileId}.json`,
      filters: [{ name: 'JSON Files', extensions: ['json'] }],
    });

    if (filePath) {
      await fs.writeFile(filePath, JSON.stringify(cookies, null, 2));
      log.info(`Cookies exported to: ${filePath}`);
      return { success: true, filePath };
    }

    return { success: false, cancelled: true };
  } catch (error) {
    log.error('Failed to export cookies:', error);
    return {
      success: false,
      error: error.message,
    };
  }
});

ipcMain.handle('cookies:import', async (event, profileId) => {
  try {
    const { filePaths } = await dialog.showOpenDialog(mainWindow, {
      title: 'Import Cookies',
      filters: [{ name: 'JSON Files', extensions: ['json'] }],
      properties: ['openFile'],
    });

    if (filePaths && filePaths.length > 0) {
      const content = await fs.readFile(filePaths[0], 'utf-8');
      const cookies = JSON.parse(content);

      const browser = browserWindows.get(profileId);
      
      if (browser) {
        const pages = await browser.pages();
        await pages[0].setCookie(...cookies);
        log.info('Cookies imported successfully');
      }

      return { success: true, cookies };
    }

    return { success: false, cancelled: true };
  } catch (error) {
    log.error('Failed to import cookies:', error);
    return {
      success: false,
      error: error.message,
    };
  }
});

/**
 * File system operations
 */
ipcMain.handle('fs:selectDirectory', async (event) => {
  const { filePaths } = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
  });

  if (filePaths && filePaths.length > 0) {
    return { success: true, path: filePaths[0] };
  }

  return { success: false };
});

ipcMain.handle('fs:selectFile', async (event, options = {}) => {
  const { filePaths } = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    ...options,
  });

  if (filePaths && filePaths.length > 0) {
    return { success: true, path: filePaths[0] };
  }

  return { success: false };
});

/**
 * Application info
 */
ipcMain.handle('app:getVersion', () => {
  return app.getVersion();
});

ipcMain.handle('app:getPlatform', () => {
  return process.platform;
});

ipcMain.handle('app:getPath', (event, name) => {
  return app.getPath(name);
});

/**
 * Logging
 */
ipcMain.on('log:info', (event, message) => {
  log.info(message);
});

ipcMain.on('log:error', (event, message) => {
  log.error(message);
});

ipcMain.on('log:warn', (event, message) => {
  log.warn(message);
});

// Cleanup on quit
app.on('before-quit', async () => {
  log.info('App is quitting, closing all browsers');
  
  // Close all browser instances
  for (const [profileId, browser] of browserWindows) {
    try {
      await browser.close();
      log.info(`Closed browser for profile: ${profileId}`);
    } catch (error) {
      log.error(`Failed to close browser for profile ${profileId}:`, error);
    }
  }
  
  browserWindows.clear();
});

log.info('Main process initialized');
