/**
 * Apply fingerprint spoofing to browser page
 * @param {Page} page - Puppeteer page instance
 * @param {Object} fingerprint - Fingerprint configuration
 */
export async function applyFingerprint(page, fingerprint = {}) {
  await page.evaluateOnNewDocument((fp) => {
    // ========== Navigator Overrides ==========

    // User Agent
    if (fp.userAgent) {
      Object.defineProperty(navigator, 'userAgent', {
        get: () => fp.userAgent,
      });
    }

    // Platform
    if (fp.platform) {
      Object.defineProperty(navigator, 'platform', {
        get: () => fp.platform,
      });
    }

    // Hardware Concurrency
    if (fp.hardwareConcurrency) {
      Object.defineProperty(navigator, 'hardwareConcurrency', {
        get: () => fp.hardwareConcurrency,
      });
    }

    // Device Memory
    if (fp.deviceMemory) {
      Object.defineProperty(navigator, 'deviceMemory', {
        get: () => fp.deviceMemory,
      });
    }

    // Languages
    if (fp.locale) {
      Object.defineProperty(navigator, 'language', {
        get: () => fp.locale,
      });
      Object.defineProperty(navigator, 'languages', {
        get: () => [fp.locale, fp.locale.split('-')[0]],
      });
    }

    // Do Not Track
    if (fp.doNotTrack !== undefined) {
      Object.defineProperty(navigator, 'doNotTrack', {
        get: () => fp.doNotTrack ? '1' : null,
      });
    }

    // ========== Screen Overrides ==========

    if (fp.screen) {
      Object.defineProperty(screen, 'width', {
        get: () => fp.screen.width,
      });
      Object.defineProperty(screen, 'height', {
        get: () => fp.screen.height,
      });
      Object.defineProperty(screen, 'availWidth', {
        get: () => fp.screen.width,
      });
      Object.defineProperty(screen, 'availHeight', {
        get: () => fp.screen.height - 40, // Account for taskbar
      });
      Object.defineProperty(screen, 'colorDepth', {
        get: () => fp.screen.colorDepth || 24,
      });
      Object.defineProperty(screen, 'pixelDepth', {
        get: () => fp.screen.colorDepth || 24,
      });
    }

    // ========== Canvas Fingerprinting ==========

    if (fp.canvas?.noise) {
      const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
      const originalToBlob = HTMLCanvasElement.prototype.toBlob;
      const originalGetImageData = CanvasRenderingContext2D.prototype.getImageData;

      // Inject noise based on seed
      const noise = (canvas) => {
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        // Use seed to generate consistent noise
        const seed = fp.canvas.seed || Math.random();
        let randomValue = seed;
        
        for (let i = 0; i < imageData.data.length; i += 4) {
          // Simple LCG for pseudo-random noise
          randomValue = (randomValue * 9301 + 49297) % 233280;
          const rnd = randomValue / 233280;
          
          // Add subtle noise (±1-2 in RGB values)
          const noiseAmount = (rnd - 0.5) * 4;
          imageData.data[i] = Math.min(255, Math.max(0, imageData.data[i] + noiseAmount));
          imageData.data[i + 1] = Math.min(255, Math.max(0, imageData.data[i + 1] + noiseAmount));
          imageData.data[i + 2] = Math.min(255, Math.max(0, imageData.data[i + 2] + noiseAmount));
        }
        
        ctx.putImageData(imageData, 0, 0);
      };

      HTMLCanvasElement.prototype.toDataURL = function(...args) {
        noise(this);
        return originalToDataURL.apply(this, args);
      };

      HTMLCanvasElement.prototype.toBlob = function(...args) {
        noise(this);
        return originalToBlob.apply(this, args);
      };

      CanvasRenderingContext2D.prototype.getImageData = function(...args) {
        const imageData = originalGetImageData.apply(this, args);
        // Add noise to getImageData as well
        return imageData;
      };
    }

    // ========== WebGL Fingerprinting ==========

    if (fp.webgl) {
      const getParameter = WebGLRenderingContext.prototype.getParameter;
      
      WebGLRenderingContext.prototype.getParameter = function(parameter) {
        // Spoof vendor and renderer
        if (parameter === 37445) { // UNMASKED_VENDOR_WEBGL
          return fp.webgl.vendor || 'Google Inc.';
        }
        if (parameter === 37446) { // UNMASKED_RENDERER_WEBGL
          return fp.webgl.renderer || 'ANGLE (Intel)';
        }
        
        return getParameter.apply(this, arguments);
      };

      // Add noise to WebGL if enabled
      if (fp.webgl.noise) {
        const originalReadPixels = WebGLRenderingContext.prototype.readPixels;
        
        WebGLRenderingContext.prototype.readPixels = function(...args) {
          originalReadPixels.apply(this, args);
          
          // Add noise to pixel data
          const pixels = args[6];
          if (pixels) {
            for (let i = 0; i < pixels.length; i++) {
              pixels[i] = pixels[i] + Math.floor(Math.random() * 3 - 1);
            }
          }
        };
      }
    }

    // ========== Audio Context Fingerprinting ==========

    if (fp.audio?.noise) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      
      if (AudioContext) {
        const originalCreateAnalyser = AudioContext.prototype.createAnalyser;
        
        AudioContext.prototype.createAnalyser = function() {
          const analyser = originalCreateAnalyser.apply(this, arguments);
          const originalGetFloatFrequencyData = analyser.getFloatFrequencyData;
          
          analyser.getFloatFrequencyData = function(array) {
            originalGetFloatFrequencyData.apply(this, arguments);
            
            // Add noise
            for (let i = 0; i < array.length; i++) {
              array[i] = array[i] + (Math.random() - 0.5) * 0.01;
            }
          };
          
          return analyser;
        };
      }
    }

    // ========== WebRTC Protection ==========

    if (fp.webrtc) {
      if (fp.webrtc.mode === 'disabled') {
        // Disable WebRTC completely
        delete window.RTCPeerConnection;
        delete window.RTCDataChannel;
        delete window.RTCSessionDescription;
        delete navigator.getUserMedia;
        delete navigator.webkitGetUserMedia;
        delete navigator.mozGetUserMedia;
        delete navigator.mediaDevices;
      } else if (fp.webrtc.mode === 'fake') {
        // Fake WebRTC with custom IPs
        const originalRTCPeerConnection = window.RTCPeerConnection;
        
        window.RTCPeerConnection = function(...args) {
          const pc = new originalRTCPeerConnection(...args);
          
          const originalCreateOffer = pc.createOffer;
          pc.createOffer = async function(...args) {
            const offer = await originalCreateOffer.apply(this, args);
            
            // Replace IPs in SDP
            if (fp.webrtc.publicIp) {
              offer.sdp = offer.sdp.replace(
                /([0-9]{1,3}(\.[0-9]{1,3}){3}|[a-f0-9]{1,4}(:[a-f0-9]{1,4}){7})/g,
                fp.webrtc.publicIp
              );
            }
            
            return offer;
          };
          
          return pc;
        };
      }
    }

    // ========== Media Devices ==========

    if (fp.mediaDevices && navigator.mediaDevices) {
      const originalEnumerateDevices = navigator.mediaDevices.enumerateDevices;
      
      navigator.mediaDevices.enumerateDevices = async function() {
        const devices = await originalEnumerateDevices.apply(this, arguments);
        
        // Filter to match specified device counts
        const audioInputs = devices.filter(d => d.kind === 'audioinput').slice(0, fp.mediaDevices.audioInputs || 1);
        const audioOutputs = devices.filter(d => d.kind === 'audiooutput').slice(0, fp.mediaDevices.audioOutputs || 1);
        const videoInputs = devices.filter(d => d.kind === 'videoinput').slice(0, fp.mediaDevices.videoInputs || 1);
        
        return [...audioInputs, ...audioOutputs, ...videoInputs];
      };
    }

    // ========== Fonts ==========

    if (fp.fonts && fp.fonts.length > 0) {
      const originalCheck = FontFaceSet.prototype.check;
      
      FontFaceSet.prototype.check = function(font, text) {
        // Only report fonts that are in our whitelist
        const fontFamily = font.match(/["']?([^"',]+)["']?/)?.[1];
        
        if (fontFamily && fp.fonts.includes(fontFamily)) {
          return true;
        }
        
        return originalCheck.apply(this, arguments);
      };
    }

    // ========== Timezone ==========

    if (fp.timezone) {
      // Override timezone
      const originalDateTimeFormat = Intl.DateTimeFormat;
      
      Intl.DateTimeFormat = function(...args) {
        if (args[1]) {
          args[1].timeZone = fp.timezone;
        } else {
          args[1] = { timeZone: fp.timezone };
        }
        return new originalDateTimeFormat(...args);
      };
      
      Intl.DateTimeFormat.prototype = originalDateTimeFormat.prototype;
    }

    // ========== Remove Automation Indicators ==========

    // Remove webdriver property
    Object.defineProperty(navigator, 'webdriver', {
      get: () => false,
    });

    // Remove Chrome automation
    delete window.chrome.runtime;

    // Remove Selenium/WebDriver properties
    delete window._Selenium_IDE_Recorder;
    delete window._selenium;
    delete window.__selenium_unwrapped;
    delete window.__selenium_evaluate;
    delete window.__selenium_script_fn;
    delete window.__webdriver_script_fn;
    delete window.__driver_evaluate;
    delete window.__webdriver_evaluate;
    delete window.__driver_unwrapped;
    delete window.__webdriver_unwrapped;
    delete window.__fxdriver_evaluate;
    delete window.__fxdriver_unwrapped;

    // Override plugins and mimeTypes to look more natural
    Object.defineProperty(navigator, 'plugins', {
      get: () => [
        {
          name: 'Chrome PDF Plugin',
          filename: 'internal-pdf-viewer',
          description: 'Portable Document Format',
        },
        {
          name: 'Chrome PDF Viewer',
          filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai',
          description: '',
        },
        {
          name: 'Native Client',
          filename: 'internal-nacl-plugin',
          description: '',
        },
      ],
    });

    console.log('Fingerprint spoofing applied successfully');
  }, fingerprint);

  // Additional page-level configurations
  
  // Set extra HTTP headers
  await page.setExtraHTTPHeaders({
    'Accept-Language': fingerprint.locale || 'en-US,en;q=0.9',
  });

  // Set viewport if specified
  if (fingerprint.screen) {
    await page.setViewport({
      width: fingerprint.screen.width,
      height: fingerprint.screen.height,
      deviceScaleFactor: fingerprint.screen.pixelRatio || 1,
    });
  }

  console.log('Page-level fingerprint configurations applied');
}

export default applyFingerprint;
