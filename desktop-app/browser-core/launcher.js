import puppeteer from 'puppeteer-core';
import path from 'path';
import { fileURLToPath } from 'url';
import { applyFingerprint } from './fingerprint.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Find Chromium executable path
 */
function getChromiumPath() {
  const platform = process.platform;
  
  // Common Chromium paths by platform
  const paths = {
    darwin: [
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Chromium.app/Contents/MacOS/Chromium',
      '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
    ],
    win32: [
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files\\Chromium\\Application\\chrome.exe',
    ],
    linux: [
      '/usr/bin/google-chrome',
      '/usr/bin/chromium',
      '/usr/bin/chromium-browser',
      '/snap/bin/chromium',
    ],
  };

  return paths[platform] || paths.linux;
}

/**
 * Build browser launch arguments
 */
function buildLaunchArgs(profile) {
  const args = [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-accelerated-2d-canvas',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
  ];

  // User agent
  if (profile.fingerprint?.userAgent) {
    args.push(`--user-agent=${profile.fingerprint.userAgent}`);
  }

  // Window size
  if (profile.fingerprint?.screen) {
    const { width, height } = profile.fingerprint.screen;
    args.push(`--window-size=${width},${height}`);
  }

  // Proxy configuration
  if (profile.proxy?.enabled) {
    const { type, host, port, username, password } = profile.proxy;
    
    if (type === 'http' || type === 'https') {
      args.push(`--proxy-server=${type}://${host}:${port}`);
    } else if (type === 'socks4' || type === 'socks5') {
      args.push(`--proxy-server=socks5://${host}:${port}`);
    }

    // Note: Proxy authentication requires additional handling
    if (username && password) {
      // Will be handled via page.authenticate()
    }
  }

  // WebRTC settings
  if (profile.fingerprint?.webrtc?.mode === 'disabled') {
    args.push('--disable-webrtc');
  }

  // Timezone
  if (profile.fingerprint?.timezone) {
    args.push(`--tz=${profile.fingerprint.timezone}`);
  }

  // Language
  if (profile.fingerprint?.locale) {
    args.push(`--lang=${profile.fingerprint.locale}`);
  }

  // Custom args from profile
  if (profile.browser?.args) {
    args.push(...profile.browser.args);
  }

  return args;
}

/**
 * Launch browser with profile configuration
 * @param {Object} profile - Profile configuration
 * @returns {Promise<Browser>} - Puppeteer browser instance
 */
export async function launchBrowser(profile) {
  try {
    // Find Chromium executable
    const chromiumPaths = getChromiumPath();
    let executablePath = profile.browser?.chromiumPath || chromiumPaths[0];

    // Build launch arguments
    const args = buildLaunchArgs(profile);

    // User data directory
    const userDataDir = profile.browser?.userDataDir || 
      path.join(process.env.HOME || process.env.USERPROFILE, '.antidetect-browser', 'profiles', profile.id);

    // Launch options
    const launchOptions = {
      executablePath,
      headless: false,
      args,
      userDataDir,
      defaultViewport: profile.fingerprint?.screen ? {
        width: profile.fingerprint.screen.width,
        height: profile.fingerprint.screen.height,
        deviceScaleFactor: profile.fingerprint.screen.pixelRatio || 1,
      } : null,
      ignoreDefaultArgs: ['--enable-automation', '--enable-blink-features=AutomationControlled'],
    };

    console.log('Launching browser with options:', launchOptions);

    // Launch browser
    const browser = await puppeteer.launch(launchOptions);

    // Get first page
    const pages = await browser.pages();
    const page = pages[0] || await browser.newPage();

    // Apply fingerprint spoofing
    await applyFingerprint(page, profile.fingerprint);

    // Set proxy authentication if needed
    if (profile.proxy?.enabled && profile.proxy.username) {
      await page.authenticate({
        username: profile.proxy.username,
        password: profile.proxy.password,
      });
    }

    // Set geolocation if enabled
    if (profile.fingerprint?.geolocation?.enabled) {
      await page.setGeolocation({
        latitude: profile.fingerprint.geolocation.latitude,
        longitude: profile.fingerprint.geolocation.longitude,
        accuracy: profile.fingerprint.geolocation.accuracy || 100,
      });
    }

    // Set cookies if exists
    if (profile.cookies && Object.keys(profile.cookies).length > 0) {
      try {
        await page.setCookie(...Object.values(profile.cookies));
      } catch (error) {
        console.warn('Failed to set cookies:', error);
      }
    }

    // Set localStorage if exists
    if (profile.localStorage && Object.keys(profile.localStorage).length > 0) {
      await page.evaluateOnNewDocument((storage) => {
        for (const [key, value] of Object.entries(storage)) {
          localStorage.setItem(key, value);
        }
      }, profile.localStorage);
    }

    // Navigate to start URL
    const startUrl = profile.browser?.startUrl || 'about:blank';
    await page.goto(startUrl, { waitUntil: 'networkidle2' });

    console.log('Browser launched successfully');

    return browser;
  } catch (error) {
    console.error('Failed to launch browser:', error);
    throw error;
  }
}

/**
 * Close browser instance
 * @param {Browser} browser - Puppeteer browser instance
 */
export async function closeBrowser(browser) {
  try {
    if (browser && browser.isConnected()) {
      await browser.close();
      console.log('Browser closed successfully');
    }
  } catch (error) {
    console.error('Failed to close browser:', error);
    throw error;
  }
}
