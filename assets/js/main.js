(() => {
  'use strict';

  // =====================================================================
  // EVENT LISTENER MANAGEMENT MODULE
  // =====================================================================

  /**
   * Centralized event listener management to prevent memory leaks
   */
  const eventListenerManager = {
    listeners: new Map(),
    
    /**
     * Adds an event listener with automatic cleanup tracking
     * @param {EventTarget} target - The target element
     * @param {string} event - The event type
     * @param {Function} handler - The event handler
     * @param {Object} options - Event listener options
     * @returns {Function} Cleanup function
     */
    add(target, event, handler, options = {}) {
      if (!target || !event || !handler) {
        console.warn('Event listener manager: Invalid parameters provided');
        return () => {};
      }

      target.addEventListener(event, handler, options);
      
      const key = `${target.constructor.name}_${Date.now()}_${Math.random()}`;
      const cleanup = () => {
        try {
          target.removeEventListener(event, handler, options);
          this.listeners.delete(key);
        } catch (error) {
          // Silently handle cleanup errors to avoid browser console noise
        }
      };
      
      this.listeners.set(key, { target, event, handler, options, cleanup });
      return cleanup;
    },

    /**
     * Removes all tracked event listeners
     */
    cleanup() {
      for (const [key, listener] of this.listeners) {
        try {
          listener.cleanup();
        } catch (error) {
          // Silently handle cleanup errors to avoid browser console noise
        }
      }
      this.listeners.clear();
    }
  };

  // Global cleanup on page unload
  window.addEventListener('beforeunload', () => {
    eventListenerManager.cleanup();
  });

  // =====================================================================
  // FONT LOADING MODULE
  // =====================================================================

  /**
   * Handles async font loading with proper fallback
   */
  const handleFontLoading = () => {
    const fontPreload = document.getElementById('font-preload');
    if (fontPreload) {
      // Convert preload to stylesheet
      const loadFont = () => {
        fontPreload.rel = 'stylesheet';
      };
      
      // Use requestAnimationFrame to ensure DOM is ready
      if (document.readyState === 'loading') {
        eventListenerManager.add(document, 'DOMContentLoaded', loadFont);
      } else {
        requestAnimationFrame(loadFont);
      }
    }
  };

  // Initialize font loading
  handleFontLoading();

  // =====================================================================
  // CONFIGURATION CONSTANTS
  // =====================================================================

  // User interaction settings
  const KEYBOARD_ACTIVATION_KEYS = new Set(['Enter', ' ', 'Spacebar']);

  // Animation timing constants
  const CELEBRATION_TRANSITION_DELAY_MS = 520;
  const VIDEO_COMPLETE_DELAY_MS = 600;
  const COUNTDOWN_INTERVAL_MS = 1100;
  const COUNTDOWN_COMPLETE_VIDEO_DELAY_MS = 400;
  const COUNTDOWN_TRANSITION_RESET_MS = 360;
  const START_OVERLAY_CLEAR_DELAY_MS = 420;
  const SAVE_THE_DATE_REVEAL_DELAY_MS = 80;

  // Confetti animation settings
  const CELEBRATION_CONFETTI_PIECES = 80;
  const CELEBRATION_CONFETTI_COLORS = ['#03281c', '#000000', '#ffffff'];
  const CELEBRATION_CONFETTI_LIFETIME_MS = 4200;

  // Calendar invite settings
  const CALENDAR_EVENT = {
    title: 'Wedding Weekend: Lorraine & Christopher',
    location: 'Chalet View Lodge, 72056 CA-70, Blairsden-Graeagle, CA 96103',
    website: 'https://becomingcummings.love',
    description:
      'Join us for our wedding weekend celebration. Visit https://becomingcummings.love for details.',
    startDate: '20260911',
    endDateExclusive: '20260914',
    uid: 'wedding-weekend-20260911@becomingcummings.love',
  };

  // Mobile photo sequence settings
  const MOBILE_PHOTO_DEFAULT_DURATION_MS = 1600;
  const MOBILE_PHOTO_TRANSITION_BUFFER_MS = 80;
  const MOBILE_PHOTO_CYCLE_DURATIONS = [
    { start: 2000, step: 140, min: 1200 },
    { start: 1100, step: 160, min: 420 },
  ];
  const MOBILE_FINAL_PHOTO_ANIMATION_DURATION_MS = 4560;
  const MOBILE_FINAL_PHOTO_ADDITIONAL_DELAY_MS = 360;

  // Content settings
  const COUNTDOWN_START_FALLBACK = 10;
  const CELEBRATION_VIDEO_SOURCE = 'assets/CelebrationVideo.mov';
  const VENUE_SNEAK_PEEK_VIDEO_SOURCE = 'assets/ChaletView.mp4';
  const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';

  // =====================================================================
  // VIDEO MANAGEMENT MODULE
  // =====================================================================

  // Shared video state
  let sharedCelebrationVideoElement = null;
  let sharedCelebrationVideoEndedHandler = null;
  let sharedCelebrationVideoErrorHandler = null;
  let hasPrimedMobileVideoPlayback = false;

  /**
   * Enables audio output on a video element
   * @param {HTMLVideoElement} video - Target video element
   */
  const setVideoSoundEnabled = (video) => {
    if (!video) {
      return;
    }

    video.muted = false;
    video.defaultMuted = false;
    video.removeAttribute('muted');

    try {
      video.volume = 1;
    } catch (error) {
      // Ignore browsers that prevent direct volume manipulation
    }
  };

  /**
   * Ensures a video's sound is enabled as soon as playback begins
   * @param {HTMLVideoElement} video - Target video element
   */
  const enableSoundOnPlayback = (video) => {
    if (!video) {
      return;
    }

    const applySound = () => {
      setVideoSoundEnabled(video);
    };

    if (!video.paused && !video.ended) {
      applySound();
      return;
    }

    video.addEventListener('play', applySound, { once: true });
  };

  /**
   * Creates a new celebration video element with appropriate settings
   * @returns {HTMLVideoElement} The configured video element
   */
  const createCelebrationVideoElement = () => {
    const video = document.createElement('video');
    video.className = 'countdown-video countdown-video--embedded';
    video.src = CELEBRATION_VIDEO_SOURCE;
    video.preload = 'auto';
    video.autoplay = true;
    video.muted = true;
    video.defaultMuted = true;
    video.setAttribute('muted', '');
    video.controls = true;
    video.setAttribute('playsinline', '');
    return video;
  };

  /**
   * Creates a new celebration audio element with appropriate settings
   * @returns {HTMLAudioElement} The configured audio element
   */
  /**
   * Gets or creates the shared celebration video element
   * @returns {HTMLVideoElement} The shared video element
   */
  const getCelebrationVideoElement = () => {
    if (!sharedCelebrationVideoElement) {
      sharedCelebrationVideoElement = createCelebrationVideoElement();
    }
    return sharedCelebrationVideoElement;
  };

  /**
   * Stops playback of the shared celebration video element if it exists
   */
  const stopCelebrationVideoPlayback = () => {
    if (!sharedCelebrationVideoElement) {
      return;
    }

    try {
      sharedCelebrationVideoElement.pause();
    } catch (error) {
      // Ignore pause errors during cleanup
    }
  };

  /**
   * Removes existing event handlers from the video element
   * @param {HTMLVideoElement} video - The video element to clean up
   */
  const resetCelebrationVideoHandlers = (video) => {
    if (!video) return;

    if (sharedCelebrationVideoEndedHandler) {
      video.removeEventListener('ended', sharedCelebrationVideoEndedHandler);
      sharedCelebrationVideoEndedHandler = null;
    }

    if (sharedCelebrationVideoErrorHandler) {
      video.removeEventListener('error', sharedCelebrationVideoErrorHandler);
      sharedCelebrationVideoErrorHandler = null;
    }
  };

  /**
   * Attaches new event handlers to the video element
   * @param {HTMLVideoElement} video - The video element
   * @param {Object} handlers - Object with onEnded and onError callbacks
   */
  const attachCelebrationVideoHandlers = (video, { onEnded, onError }) => {
    if (!video) return;

    resetCelebrationVideoHandlers(video);

    if (typeof onEnded === 'function') {
      sharedCelebrationVideoEndedHandler = onEnded;
      video.addEventListener('ended', sharedCelebrationVideoEndedHandler, { once: true });
    }

    if (typeof onError === 'function') {
      sharedCelebrationVideoErrorHandler = onError;
      video.addEventListener('error', sharedCelebrationVideoErrorHandler, { once: true });
    }
  };

  /**
   * Attempts to play video safely with proper error handling
   * @param {HTMLVideoElement} videoElement - The video to play
   * @param {Object} options - Playback options
   * @param {Function} [options.onError] - Error callback
   * @param {Function} [options.onSuccess] - Success callback
   */
  const safelyPlayVideo = (videoElement, { onError, onSuccess } = {}) => {
    if (!videoElement || typeof videoElement.play !== 'function') {
      console.error('Video playback: Invalid video element provided');
      onError?.('Invalid video element');
      return;
    }

    const attemptVideoPlayback = () => {
      const playPromise = videoElement.play();
      if (playPromise && typeof playPromise.then === 'function') {
        playPromise
          .then(() => {
            onSuccess?.();
          })
          .catch((error) => {
            // Handle autoplay policy restrictions gracefully
            if (error.name === 'NotAllowedError') {
              console.info('Video autoplay was prevented by browser policy - this is expected behavior');
            } else {
              console.warn('Video playback failed:', error.message);
            }
            onError?.(error);
          });
      } else {
        onSuccess?.();
      }
    };

    if (videoElement.readyState >= 2) {
      attemptVideoPlayback();
    } else {
      eventListenerManager.add(videoElement, 'canplay', attemptVideoPlayback, { once: true });
    }
  };

  /**
   * Primes video playback for mobile devices by attempting a silent play
   * This helps with autoplay restrictions on mobile browsers
   */
  const primeMobileCelebrationVideoPlayback = () => {
    if (hasPrimedMobileVideoPlayback) {
      return;
    }

    const video = getCelebrationVideoElement();
    if (!video || (!video.paused && !video.ended)) {
      return;
    }

    const body = document.body;
    if (!body) {
      return;
    }

    const primerContainer = document.createElement('div');
    primerContainer.style.position = 'fixed';
    primerContainer.style.width = '1px';
    primerContainer.style.height = '1px';
    primerContainer.style.overflow = 'hidden';
    primerContainer.style.pointerEvents = 'none';
    primerContainer.style.opacity = '0';
    primerContainer.style.zIndex = '-1';
    primerContainer.setAttribute('aria-hidden', 'true');

    primerContainer.appendChild(video);
    body.appendChild(primerContainer);

    const originalMuted = video.muted;
    video.muted = true;

    const finalizePrimer = (wasSuccessful) => {
      try {
        video.pause();
      } catch (error) {
        // Ignore pause errors during primer cleanup
      }

      try {
        video.currentTime = 0;
      } catch (error) {
        // Ignore rewind errors during primer cleanup
      }

      video.muted = originalMuted;

      try {
        if (primerContainer.parentNode) {
          primerContainer.remove();
        }
      } catch (cleanupError) {
        // Ignore cleanup errors
      }

      if (wasSuccessful) {
        hasPrimedMobileVideoPlayback = true;
        console.debug('Mobile video playback primed successfully');
      } else {
        console.debug('Mobile video priming failed, but continuing gracefully');
      }
    };

    const handlePrimerFailure = (error) => {
      if (error?.message) {
        console.debug('Mobile video primer play failed:', error.message);
      } else if (error) {
        console.debug('Mobile video primer play failed:', error);
      } else {
        console.debug('Mobile video primer play failed');
      }
      finalizePrimer(false);
    };

    try {
      const playPromise = video.play();

      if (playPromise && typeof playPromise.then === 'function') {
        playPromise
          .then(() => {
            finalizePrimer(true);
          })
          .catch((error) => {
            handlePrimerFailure(error);
          });
      } else {
        finalizePrimer(true);
      }
    } catch (error) {
      handlePrimerFailure(error);
    }
  };

  // =====================================================================
  // AUDIO MANAGEMENT MODULE
  // =====================================================================

  const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
  let audioCtx = null;

  /**
   * Gets or creates the shared audio context
   * @returns {AudioContext|null} The audio context or null if unavailable
   */
  const getAudioContext = () => {
    if (!AudioContextConstructor) return null;

    if (!audioCtx) {
      try {
        audioCtx = new AudioContextConstructor();
      } catch (error) {
        return null;
      }
    }
    return audioCtx;
  };

  /**
   * Resumes audio context if it's suspended (required for some browsers)
   * @param {AudioContext} context - The audio context to resume
   */
  const resumeContextIfSuspended = (context) => {
    if (context?.state === 'suspended') {
      context.resume().catch(() => {});
    }
  };

  /**
   * Plays a subtle transition sound effect with graceful fallback
   */
  const playTransitionSound = () => {
    try {
      const context = getAudioContext();
      if (!context) return;

      resumeContextIfSuspended(context);

      const oscillator = context.createOscillator();
      const gain = context.createGain();
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(82, context.currentTime);
      oscillator.connect(gain);
      gain.connect(context.destination);

      const now = context.currentTime;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(1.3, now + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.34);
      
      oscillator.start(now);
      oscillator.stop(now + 0.34);
    } catch (error) {
      // Audio not available or blocked - gracefully continue without sound
      console.info('Audio not available, continuing silently');
    }
  };

  /**
   * Plays a celebratory boom sound effect with graceful fallback
   */
  const playBoom = () => {
    try {
      const context = getAudioContext();
      if (!context) return;

      resumeContextIfSuspended(context);

      const now = context.currentTime;
      const duration = 0.82;

      // Create tone oscillator
      const toneOscillator = context.createOscillator();
      const toneGain = context.createGain();
      toneOscillator.type = 'sine';
      toneOscillator.frequency.setValueAtTime(180, now);
      toneOscillator.frequency.exponentialRampToValueAtTime(52, now + duration);
    toneGain.gain.setValueAtTime(0.0001, now);
    toneGain.gain.exponentialRampToValueAtTime(1.1, now + 0.02);
    toneGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    toneOscillator.connect(toneGain);
    toneGain.connect(context.destination);

    toneOscillator.start(now);
    toneOscillator.stop(now + duration);

    // Create noise buffer for impact effect
    const noiseBuffer = context.createBuffer(1, Math.ceil(context.sampleRate * duration), context.sampleRate);
    const noiseChannelData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseChannelData.length; i++) {
      const decay = 1 - i / noiseChannelData.length;
      noiseChannelData[i] = (Math.random() * 2 - 1) * decay * decay;
    }

    const noiseSource = context.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    const noiseGain = context.createGain();
    noiseGain.gain.setValueAtTime(0.5, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    noiseSource.connect(noiseGain);
    noiseGain.connect(context.destination);

    noiseSource.start(now);
    noiseSource.stop(now + duration);
    } catch (error) {
      // Audio not available or blocked - gracefully continue without sound
      console.info('Audio celebration not available, continuing silently');
    }
  };

  // =====================================================================
  // ANIMATION & VISUAL EFFECTS MODULE
  // =====================================================================

  // Motion preferences detection
  const prefersReducedMotionQuery = typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)')
    : null;
  const prefersReducedMotion = prefersReducedMotionQuery?.matches ?? false;

  /**
   * Creates and launches confetti animation for celebrations
   */
  const launchConfetti = () => {
    if (prefersReducedMotion || !document.body) return;

    const confettiContainer = document.createElement('div');
    confettiContainer.className = 'confetti-container';

    for (let i = 0; i < CELEBRATION_CONFETTI_PIECES; i++) {
      const piece = document.createElement('span');
      piece.className = 'confetti-piece';
      piece.style.setProperty('--confetti-left', `${Math.random() * 100}%`);
      piece.style.setProperty('--confetti-delay', `${Math.random() * 0.45}s`);
      piece.style.setProperty('--confetti-duration', `${2.6 + Math.random()}s`);
      piece.style.setProperty('--confetti-drift', `${Math.random() * 120 - 60}px`);
      piece.style.backgroundColor = CELEBRATION_CONFETTI_COLORS[i % CELEBRATION_CONFETTI_COLORS.length];
      confettiContainer.appendChild(piece);
    }

    document.body.appendChild(confettiContainer);
    window.setTimeout(() => {
      confettiContainer.remove();
    }, CELEBRATION_CONFETTI_LIFETIME_MS);
  };

  // =====================================================================
  // LAYOUT & RESPONSIVE MANAGEMENT
  // =====================================================================

  // Border cell management for countdown animation
  const borderCells = Array.from(document.querySelectorAll('.border-cell')).sort((a, b) => {
    const aIndex = Number(a.dataset.revealIndex) || 0;
    const bIndex = Number(b.dataset.revealIndex) || 0;
    return aIndex - bIndex;
  });

  // Show all cells immediately if motion is reduced
  if (prefersReducedMotion) {
    borderCells.forEach((cell) => cell.classList.add('is-visible'));
  }

  // Mobile experience management
  const mobileStage = document.getElementById('mobileStage');
  if (!mobileStage) {
    console.warn('Main: mobileStage element not found - mobile experience may not work properly');
  }
  const mobileBreakpointQuery = typeof window.matchMedia === 'function'
    ? window.matchMedia('(max-width: 640px), (max-height: 520px)')
    : null;
  let isMobileExperienceActive = mobileBreakpointQuery?.matches ?? false;

  /**
   * Updates mobile experience preference based on viewport changes
   * @param {MediaQueryListEvent} event - The media query change event
   */
  const updateMobileExperiencePreference = (event) => {
    isMobileExperienceActive = typeof event?.matches === 'boolean' 
      ? event.matches 
      : mobileBreakpointQuery?.matches ?? false;
  };

  // Set up mobile breakpoint listener with proper cleanup
  if (mobileBreakpointQuery) {
    if (typeof mobileBreakpointQuery.addEventListener === 'function') {
      eventListenerManager.add(mobileBreakpointQuery, 'change', updateMobileExperiencePreference);
    } else if (typeof mobileBreakpointQuery.addListener === 'function') {
      // Fallback for older browsers
      mobileBreakpointQuery.addListener(updateMobileExperiencePreference);
    }
  }

  // =====================================================================
  // MOBILE PHOTO SEQUENCE DATA
  // =====================================================================

  // Extract photo data from border cells for mobile slideshow
  const mobilePhotoDetails = borderCells.map((cell) => {
    const cellImage = cell.querySelector('img');
    return {
      src: cellImage?.getAttribute('src') ?? '',
      alt: cellImage?.getAttribute('alt') ?? '',
    };
  });
  
  const mobilePhotoLoopCount = 1;

  /**
   * Calculates display duration for mobile photos based on position
   * @param {Object} params - Parameters object
   * @param {number} params.cycleIndex - Current cycle iteration (accepted for compatibility, but unused)
   * @param {number} params.photoIndex - Index of photo in sequence
   * @returns {number} Duration in milliseconds
   */
  const getMobilePhotoDisplayDuration = ({ cycleIndex, photoIndex }) => {
    if (prefersReducedMotion) {
      return MOBILE_PHOTO_DEFAULT_DURATION_MS;
    }

    // Use first cycle settings consistently
    const settings = MOBILE_PHOTO_CYCLE_DURATIONS[0];
    const duration = settings.start - settings.step * photoIndex;
    return Math.max(settings.min, duration);
  };

  // =====================================================================
  // COUNTDOWN STATE & CONTROLS
  // =====================================================================

  // DOM references and countdown state
  const cardShell = document.getElementById('cardShell');
  if (!cardShell) {
    console.warn('Main: cardShell element not found - some functionality may be limited');
  }
  const initialCountdownWrapper = cardShell?.querySelector('.countdown-wrapper');
  const countdownNumber = document.getElementById('countdownNumber');
  if (!countdownNumber) {
    console.warn('Main: countdownNumber element not found - countdown display may not work properly');
  }
  const countdownNote = initialCountdownWrapper?.querySelector('.countdown-note');
  const countdownStart = borderCells.length > 0 ? borderCells.length : COUNTDOWN_START_FALLBACK;
  
  let currentValue = countdownStart;
  let revealedCells = 0;
  let countdownIntervalId = null;
  let hasStarted = false;


  // Overlay control elements
  const startOverlay = document.getElementById('startOverlay');
  if (!startOverlay) {
    console.warn('Main: startOverlay element not found - start overlay may not function properly');
  }
  const startOverlayContent = startOverlay?.querySelector('.countdown-overlay-content') ?? null;
  const startButton = document.getElementById('startCountdownButton');
  if (!startButton) {
    console.warn('Main: startCountdownButton element not found - manual start may not work');
  }

  /**
   * Reveals the next border cell in sequence during countdown
   */
  const revealNextBorderCell = () => {
    if (prefersReducedMotion || isMobileExperienceActive) return;

    const nextCell = borderCells[revealedCells];
    if (nextCell) {
      nextCell.classList.add('is-visible');
      revealedCells += 1;
    }
  };

  // =====================================================================
  // SAVE THE DATE COMPONENTS
  // =====================================================================

  /**
   * Creates a styled action button for save-the-date interface
   * @param {Object} config - Button configuration
   * @param {string} config.label - Button text label
   * @param {string} [config.iconPath] - SVG path data for icon
   * @param {Function} [config.iconFactory=null] - Optional factory returning a custom SVG element
   * @param {string} [config.additionalClassName=''] - Additional CSS classes
   * @param {string} [config.viewBox='0 0 24 24'] - SVG viewBox
   * @param {string} [config.element='button'] - HTML element type ('button' or 'a')
   * @param {string} [config.href=''] - Link URL for anchor elements
   * @param {boolean} [config.isIconOnly=false] - Whether to render as icon-only button
   * @param {string} [config.tooltipText=''] - Optional tooltip text
   * @param {string} [config.ariaLabel=''] - Custom accessible label
   * @returns {HTMLElement} The configured button element
   */
  const createSaveTheDateActionButton = ({
    label,
    iconPath,
    iconFactory = null,
    additionalClassName = '',
    viewBox = '0 0 24 24',
    element = 'button',
    href = '',
    isIconOnly = false,
    tooltipText = '',
    ariaLabel = '',
  }) => {
    const tagName = element === 'a' ? 'a' : 'button';
    const button = document.createElement(tagName);

    // Configure element based on type
    if (tagName === 'button') {
      button.type = 'button';
    } else if (href) {
      button.href = href;
      button.target = '_blank';
      button.rel = 'noopener noreferrer';
    } else {
      button.href = '#';
    }

    if (ariaLabel) {
      button.setAttribute('aria-label', ariaLabel);
    }

    const buttonClassNames = ['save-date-action'];
    if (additionalClassName) {
      buttonClassNames.push(additionalClassName);
    }
    if (isIconOnly) {
      buttonClassNames.push('save-date-action--icon-only');
    }

    button.className = buttonClassNames.join(' ');


    const tooltipLabel = tooltipText || (isIconOnly ? label : '');
    if (tooltipLabel) {
      button.dataset.tooltip = tooltipLabel;
      button.setAttribute('title', tooltipLabel);
    }

    // Create icon container
    const icon = document.createElement('span');
    icon.className = 'save-date-action__icon';

    // Create SVG icon
    const hasCustomFactory = typeof iconFactory === 'function';
    let iconElement = hasCustomFactory ? iconFactory() : null;

    if (!iconElement) {
      if (!iconPath) {
        return button;
      }

      iconElement = document.createElementNS(SVG_NAMESPACE, 'svg');
      iconElement.setAttribute('viewBox', viewBox);

      const path = document.createElementNS(SVG_NAMESPACE, 'path');
      path.setAttribute('d', iconPath);
      path.setAttribute('fill', 'currentColor');
      iconElement.appendChild(path);
    }

    if (iconElement?.namespaceURI === SVG_NAMESPACE) {
      if (!iconElement.hasAttribute('aria-hidden')) {
        iconElement.setAttribute('aria-hidden', 'true');
      }
      if (!iconElement.hasAttribute('focusable')) {
        iconElement.setAttribute('focusable', 'false');
      }
    } else if (iconElement instanceof HTMLImageElement) {
      if (!iconElement.hasAttribute('alt')) {
        iconElement.alt = '';
      }
      iconElement.decoding = 'async';
      iconElement.loading = 'lazy';
    }

    iconElement.classList.add('save-date-action__icon-graphic');

    icon.appendChild(iconElement);

    // Create label
    const labelEl = document.createElement('span');
    labelEl.className = 'save-date-action__label';
    if (isIconOnly) {
      labelEl.classList.add('visually-hidden');
    }
    labelEl.textContent = label;

    button.append(icon, labelEl);
    return button;
  };

  /**
   * Creates an icon element that reuses the site favicon
   * @returns {HTMLImageElement} Image element referencing the favicon
   */
  const createFaviconIcon = () => {
    const image = document.createElement('img');
    // Dynamically get the favicon URL from the DOM, fallback to default if not found
    const faviconUrl = document.querySelector('link[rel="icon"]')?.href || '/assets/favicon.png';
    image.src = faviconUrl;
    image.alt = '';
    image.loading = 'lazy';
    image.decoding = 'async';
    return image;
  };

  /**
   * Creates the title section with names and ampersand
   * @returns {HTMLElement} The title element with nested spans
   */
  const createSaveTheDateTitle = () => {
    const title = document.createElement('h1');
    title.className = 'save-date-title';
    
    const firstName = document.createElement('span');
    firstName.className = 'save-date-name';
    firstName.textContent = 'Lorraine';

    const ampersand = document.createElement('span');
    ampersand.className = 'save-date-amp';
    ampersand.textContent = '&';

    const secondName = document.createElement('span');
    secondName.className = 'save-date-name';
    secondName.textContent = 'Christopher';

    title.append(firstName, ampersand, secondName);
    return title;
  };

  /**
   * Creates the date and location information section
   * @returns {HTMLElement} The date line element
   */
  const createSaveTheDateInfo = () => {
    const dateLine = document.createElement('p');
    dateLine.className = 'save-date-date';
    
    const dateMain = document.createElement('span');
    dateMain.className = 'save-date-date-main';
    dateMain.textContent = 'September 12, 2026';

    const dateLocation = document.createElement('span');
    dateLocation.className = 'save-date-date-location';
    dateLocation.textContent = 'Portola, California';

    dateLine.append(dateMain, dateLocation);
    return dateLine;
  };

  /**
   * Creates the action buttons for the save the date interface
   * @returns {HTMLElement} The actions container with all buttons
   */
  const createSaveTheDateActions = () => {
    const actions = document.createElement('div');
    actions.className = 'save-date-actions';

    // Wedding website link
    const websiteLink = createSaveTheDateActionButton({
      label: 'Wedding website',
      iconFactory: createFaviconIcon,
      element: 'a',
      href: 'https://becomingcummings.love',
      isIconOnly: true,
      tooltipText: 'Wedding website',
      ariaLabel: 'Visit our wedding website (opens in a new tab)',
    });

    // Replay video button
    const replayButton = createSaveTheDateActionButton({
      label: 'Replay celebration video',
      iconPath: 'M12 5.5V2L5.5 8.5 12 15V10.6c3.15 0 5.9 2.55 5.9 5.9s-2.55 5.9-5.9 5.9-5.9-2.55-5.9-5.9h-2c0 4.36 3.54 7.9 7.9 7.9s7.9-3.54 7.9-7.9S16.36 8.6 12 8.6z',
      isIconOnly: true,
      tooltipText: 'Replay video',
      ariaLabel: 'Replay celebration video',
    });

    // Venue sneak peek button
    const sneakPeekButton = createSaveTheDateActionButton({
      label: 'Venue sneak peek',
      iconPath: 'M8 5.5v13l11-6.5-11-6.5z',
      additionalClassName: 'save-date-action--secondary save-date-action--full',
    });
    sneakPeekButton.setAttribute('aria-label', 'Play the venue sneak peek video');

    // Hotel reservations button
    const hotelButton = createSaveTheDateActionButton({
      label: 'Hotel reservations',
      iconPath:
        'M4 11h16c1.1 0 2 .9 2 2v5h-2v-3H4v3H2v-9c0-1.1.9-2 2-2h1V7c0-1.1.9-2 2-2h6c1.1 0 2 .9 2 2v2h3v2h-3V9H7v2H4z',
      element: 'a',
      href: 'https://booking.chaletviewlodge.com/#/booking/step-1?group=becomingcummings',
      ariaLabel: 'Book hotel reservations (opens in a new tab)',
      isIconOnly: true,
      tooltipText: 'Hotel reservations',
    });

    const iconActions = document.createElement('div');
    iconActions.className = 'save-date-action-icons';
    iconActions.append(replayButton, websiteLink, hotelButton);

    actions.append(sneakPeekButton, iconActions);
    return { actions, websiteLink, replayButton, sneakPeekButton, hotelButton };
  };

  /**
   * Builds a URL safe text string for calendar services
   * @param {string} value - Text to encode
   * @returns {string} Encoded text string
   */
  const encodeCalendarText = (value) =>
    encodeURIComponent(value.replace(/\s+/g, ' ').trim());

  let cachedCalendarBlobUrl = null;

  /**
   * Escapes text according to ICS specification requirements
   * @param {string} value - Text to escape
   * @returns {string} Escaped text value
   */
  const escapeIcsText = (value) =>
    value
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\n/g, '\\n');

  /**
   * Formats a date instance to an ICS timestamp in UTC
   * @param {Date} date - Date instance to format
   * @returns {string} Formatted timestamp string
   */
  const formatIcsTimestamp = (date) =>
    date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');

  /**
   * Creates the ICS file contents for the wedding event
   * @returns {string} ICS file data
   */
  const createCalendarIcsContent = () => {
    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Becoming Cummings//Save The Date//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `DTSTAMP:${formatIcsTimestamp(new Date())}`,
      `DTSTART;VALUE=DATE:${CALENDAR_EVENT.startDate}`,
      `DTEND;VALUE=DATE:${CALENDAR_EVENT.endDateExclusive}`,
      `SUMMARY:${escapeIcsText(CALENDAR_EVENT.title)}`,
      `DESCRIPTION:${escapeIcsText(CALENDAR_EVENT.description)}`,
      `LOCATION:${escapeIcsText(CALENDAR_EVENT.location)}`,
      `UID:${escapeIcsText(CALENDAR_EVENT.uid)}`,
      `URL:${CALENDAR_EVENT.website}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ];

    return `${lines.join('\r\n')}\r\n`;
  };

  /**
   * Creates a fresh object URL for the ICS download with enhanced mobile support
   * Revokes any previous blob URL to ensure each download uses a valid URL
   * @returns {string} Object URL pointing to ICS data
   */
  const getCalendarIcsUrl = () => {
    // Revoke any previously cached blob URL before creating a new one
    if (cachedCalendarBlobUrl) {
      try {
        window.URL.revokeObjectURL(cachedCalendarBlobUrl);
      } catch (e) {
        // Silently handle revocation errors (URL might already be revoked)
      }
      cachedCalendarBlobUrl = null;
    }

    const icsContent = createCalendarIcsContent();
    
    // Enhanced blob creation with better MIME type for mobile compatibility
    const blob = new Blob([icsContent], { 
      type: 'text/calendar; charset=utf-8' 
    });
    
    cachedCalendarBlobUrl = window.URL.createObjectURL(blob);
    return cachedCalendarBlobUrl;
  };

  // Enhanced cleanup with better error handling
  const cleanupCalendarBlobUrl = () => {
    if (cachedCalendarBlobUrl) {
      try {
        window.URL.revokeObjectURL(cachedCalendarBlobUrl);
      } catch (error) {
        // Silently handle revocation errors (URL might already be revoked)
        console.debug('Calendar blob URL cleanup:', error.message);
      }
      cachedCalendarBlobUrl = null;
    }
  };

  // Multiple cleanup triggers for better resource management
  window.addEventListener('beforeunload', cleanupCalendarBlobUrl);
  window.addEventListener('pagehide', cleanupCalendarBlobUrl);
  
  // Cleanup when page becomes hidden (mobile browser behavior)
  if (document.addEventListener) {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        cleanupCalendarBlobUrl();
      }
    });
  }

  /**
   * Builds the Google Calendar template URL
   * @returns {string} Google Calendar URL
   */
  const buildGoogleCalendarUrl = () => {
    const baseUrl = 'https://www.google.com/calendar/render?action=TEMPLATE';
    const params = [
      `text=${encodeCalendarText(CALENDAR_EVENT.title)}`,
      `details=${encodeCalendarText(CALENDAR_EVENT.description)}`,
      `location=${encodeCalendarText(CALENDAR_EVENT.location)}`,
      `dates=${CALENDAR_EVENT.startDate}/${CALENDAR_EVENT.endDateExclusive}`,
      `ctz=America/Los_Angeles`,
    ];

    return `${baseUrl}&${params.join('&')}`;
  };

  /**
   * Creates a calendar option link element
   * @param {Object} options - Link configuration options
   * @param {string} options.label - The text label for the link
   * @param {string} options.href - The destination URL
   * @param {boolean} [options.download] - Whether to trigger a download
   * @returns {HTMLAnchorElement} Configured anchor element
   */
  const createCalendarOptionLink = ({ label, href, download = false }) => {
    const link = document.createElement('a');
    link.className = 'save-date-calendar-link';
    link.setAttribute('role', 'menuitem');
    link.textContent = label;
    link.href = '#';

    if (download) {
      // For download links, don't set href initially - it will be set fresh on each click
      link.setAttribute('download', 'wedding-weekend.ics');
      // Improved MIME type for better mobile compatibility
      link.setAttribute('type', 'text/calendar; charset=utf-8');
      const clickCleanup = eventListenerManager.add(link, 'click', (event) => {
        // Add loading state
        link.setAttribute('aria-busy', 'true');
        link.style.pointerEvents = 'none';
        
        // Generate a fresh blob URL for each download attempt
        const freshBlobUrl = getCalendarIcsUrl();
        // Revoke previous blob URL if present to prevent memory leaks
        if (link.href && link.href.startsWith('blob:')) {
          URL.revokeObjectURL(link.href);
        }
        link.href = freshBlobUrl;

        // For iOS Safari, we need to handle the download differently
        const isIOSSafari = /iPad|iPhone|iPod/.test(navigator.userAgent) &&
                           /Safari/.test(navigator.userAgent) &&
                           !/CriOS|FxiOS|OPiOS|mercury/.test(navigator.userAgent);

        if (isIOSSafari) {
          // iOS Safari needs special handling - open in new window
          event.preventDefault();
          window.open(freshBlobUrl, '_blank');
        }
        
        // Remove loading state after a brief delay
        setTimeout(() => {
          link.removeAttribute('aria-busy');
          link.style.pointerEvents = '';
        }, 500);
      });
      // Store cleanup function for potential cleanup
      link._eventCleanup = clickCleanup;
    } else {
      // For non-download links (like Google Calendar), set href normally
      link.href = href;
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noreferrer noopener');
      link.setAttribute('aria-describedby', 'google-calendar-hint');
    }
    return link;
  };

  /**
   * Creates the Add to calendar control with improved accessibility
   * @returns {Object} Object containing container and interactive elements
   */
  const createCalendarInviteControls = () => {
    const container = document.createElement('div');
    container.className = 'save-date-calendar';

    const details = document.createElement('details');
    details.className = 'save-date-calendar-details';
    details.setAttribute('role', 'group');
    details.setAttribute('aria-labelledby', 'calendar-summary');

    const summary = document.createElement('summary');
    summary.className = 'save-date-calendar-summary';
    summary.id = 'calendar-summary';
    summary.setAttribute('aria-label', 'Add the wedding weekend to your calendar');
    summary.setAttribute('aria-expanded', 'false');
    summary.setAttribute('aria-haspopup', 'menu');
    summary.setAttribute('title', 'Add to calendar');
    summary.dataset.tooltip = 'Add to calendar';

    const icon = document.createElement('span');
    icon.className = 'save-date-calendar-icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.innerHTML =
      '<svg width="24" height="24" viewBox="0 0 24 24" role="img" focusable="false">' +
      '<path fill="currentColor" d="M7 2a1 1 0 0 1 1 1v1h8V3a1 1 0 1 1 2 0v1h1a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3h1V3a1 1 0 0 1 1-1zm13 6H4v10a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1zm-5 3a1 1 0 0 1 1 1v3h-6v-3a1 1 0 0 1 1-1z"></path>' +
      '</svg>';

    summary.appendChild(icon);

    const menu = document.createElement('div');
    menu.className = 'save-date-calendar-menu';
    menu.setAttribute('role', 'menu');
    menu.setAttribute('aria-labelledby', 'calendar-summary');

    const googleLink = createCalendarOptionLink({
      label: 'Google Calendar',
      href: buildGoogleCalendarUrl(),
    });

    const universalLink = createCalendarOptionLink({
      label: 'Apple, Outlook & others (ICS)',
      download: true,
    });

    menu.append(googleLink, universalLink);
    details.append(summary, menu);
    container.append(details);

    const setExpanded = (expanded) => {
      summary.setAttribute('aria-expanded', expanded ? 'true' : 'false');
    };

    // Handle native details toggle event
    const toggleCleanup = eventListenerManager.add(details, 'toggle', () => {
      setExpanded(details.open);
      
      // Focus management for accessibility
      if (details.open) {
        // Focus first menu item when opened
        requestAnimationFrame(() => {
          const firstMenuItem = menu.querySelector('[role="menuitem"]');
          if (firstMenuItem) {
            firstMenuItem.focus();
          }
        });
      }
    });

    // Enhanced keyboard navigation
    const summaryKeydownCleanup = eventListenerManager.add(summary, 'keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        details.open = !details.open;
      } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        if (!details.open) {
          details.open = true;
        }
      }
    });

    // Menu keyboard navigation
    const menuKeydownCleanup = eventListenerManager.add(menu, 'keydown', (event) => {
      const menuItems = Array.from(menu.querySelectorAll('[role="menuitem"]'));
      const currentIndex = menuItems.indexOf(document.activeElement);

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          const nextIndex = (currentIndex + 1) % menuItems.length;
          menuItems[nextIndex].focus();
          break;
        case 'ArrowUp':
          event.preventDefault();
          const prevIndex = currentIndex <= 0 ? menuItems.length - 1 : currentIndex - 1;
          menuItems[prevIndex].focus();
          break;
        case 'Escape':
          event.preventDefault();
          details.open = false;
          summary.focus();
          break;
        case 'Tab':
          // Allow normal tab behavior, but close menu if tabbing out
          if (!event.shiftKey && currentIndex === menuItems.length - 1) {
            details.open = false;
          }
          break;
      }
    });

    // Close dropdown when clicking outside
    const handleOutsideClick = (event) => {
      if (details.open && !details.contains(event.target)) {
        details.open = false;
      }
    };

    // Improved focus management
    const handleFocusOut = (event) => {
      // Use setTimeout to allow for focus to settle
      setTimeout(() => {
        if (!details.contains(document.activeElement)) {
          details.open = false;
          setExpanded(false);
        }
      }, 0);
    };

    const clickCleanup = eventListenerManager.add(document, 'click', handleOutsideClick);
    const focusCleanup = eventListenerManager.add(details, 'focusout', handleFocusOut);

    // Comprehensive cleanup function
    const cleanup = () => {
      toggleCleanup();
      summaryKeydownCleanup();
      menuKeydownCleanup();
      clickCleanup();
      focusCleanup();
    };

    // Store cleanup function for potential future use
    container._cleanup = cleanup;

    return { container, details };
  };

  /**
   * Builds the complete save the date details interface
   * @returns {Object} Object containing wrapper and interactive elements
   */
  const buildSaveTheDateDetails = () => {
    const wrapper = document.createElement('div');
    wrapper.className = 'countdown-wrapper has-details';

    // Create header
    const eyebrow = document.createElement('p');
    eyebrow.className = 'eyebrow';
    eyebrow.textContent = 'Save the Date';

    // Create title section
    const title = createSaveTheDateTitle();

    // Create date/location section
    const dateLine = createSaveTheDateInfo();

    // Create note
    const note = document.createElement('p');
    note.className = 'countdown-note save-date-note';
    note.textContent = 'Formal invite to follow';

    // Create action buttons
    const calendarControls = createCalendarInviteControls();
    const { actions, websiteLink, replayButton, sneakPeekButton } = createSaveTheDateActions();

    const header = document.createElement('div');
    header.className = 'save-date-header';
    header.append(calendarControls.container, eyebrow);

    // Assemble the interface
    wrapper.appendChild(header);
    wrapper.appendChild(title);
    wrapper.appendChild(dateLine);
    wrapper.appendChild(note);
    wrapper.appendChild(actions);

    return { wrapper, title, replayButton, sneakPeekButton, websiteLink };
  };

  /**
   * Reveals save the date details with optional celebration effects
   * @param {Object} elements - Object containing title element
   * @param {Object} options - Options object
   * @param {boolean} [options.withCelebrateEffects=false] - Whether to play celebration effects
   */
  const revealSaveTheDateDetails = ({ title }, { withCelebrateEffects = false } = {}) => {
    if (withCelebrateEffects && !prefersReducedMotion) {
      window.requestAnimationFrame(() => {
        title.classList.add('save-date-title--spiral');
      });

      window.setTimeout(() => {
        playBoom();
        launchConfetti();
      }, CELEBRATION_TRANSITION_DELAY_MS);
    }
  };

  /**
   * Creates a back to details button for navigation
   * @returns {HTMLElement} The back button element
   */
  const createBackToDetailsButton = () =>
    createSaveTheDateActionButton({
      label: 'Back to details',
      iconPath: 'M14.5 6.5 8.5 12l6 5.5V6.5z',
      additionalClassName: 'save-date-action--ghost save-date-back-button',
    });

  /**
   * Wires up event handlers for save the date action buttons with enhanced feedback
   * @param {Object} elements - Object containing button elements
   * @param {Object} handlers - Object containing callback functions
   * @param {Function} [handlers.onReplay] - Replay button click handler
   * @param {Function} [handlers.onSneakPeek] - Sneak peek button click handler
   */
  const wireSaveTheDateActions = (
    { replayButton, sneakPeekButton },
    { onReplay, onSneakPeek } = {}
  ) => {
    if (replayButton && typeof onReplay === 'function') {
      eventListenerManager.add(replayButton, 'click', (event) => {
        // Add loading state and feedback
        replayButton.setAttribute('aria-busy', 'true');
        replayButton.style.pointerEvents = 'none';
        
        try {
          onReplay(event);
        } finally {
          // Remove loading state after content loads
          setTimeout(() => {
            replayButton.removeAttribute('aria-busy');
            replayButton.style.pointerEvents = '';
          }, 800);
        }
      });
    }

    if (sneakPeekButton && typeof onSneakPeek === 'function') {
      eventListenerManager.add(sneakPeekButton, 'click', (event) => {
        // Add loading state and feedback
        sneakPeekButton.setAttribute('aria-busy', 'true');
        sneakPeekButton.style.pointerEvents = 'none';
        
        try {
          onSneakPeek(event);
        } finally {
          // Remove loading state after content loads
          setTimeout(() => {
            sneakPeekButton.removeAttribute('aria-busy');
            sneakPeekButton.style.pointerEvents = '';
          }, 800);
        }
      });
    }
  };

  /**
   * Shows the save the date details interface in the specified container
   * @param {Object} options - Configuration options
   * @param {HTMLElement} [options.targetContainer] - Container element
   * @param {boolean} [options.withCelebrateEffects=false] - Whether to show celebration effects
   */
  const showSaveTheDateDetails = ({
    targetContainer = cardShell,
    withCelebrateEffects = false,
  } = {}) => {
    if (!targetContainer) return;

    stopCelebrationVideoPlayback();

    const elements = buildSaveTheDateDetails();
    targetContainer.innerHTML = '';
    targetContainer.appendChild(elements.wrapper);
    
    wireSaveTheDateActions(elements, {
      onReplay: () => {
        showCelebrationVideo({ targetContainer, withCelebrateEffectsOnComplete: false });
      },
      onSneakPeek: () => {
        showSneakPeekVideo({ targetContainer });
      },
    });
    
    revealSaveTheDateDetails(elements, { withCelebrateEffects });
  };

  // =====================================================================
  // VIDEO INTERFACE BUILDERS
  // =====================================================================

  /**
   * Builds the celebration video interface
   * @returns {Object} Object containing wrapper and video elements
   */
  const buildCelebrationVideo = () => {
    const wrapper = document.createElement('div');
    wrapper.className = 'countdown-wrapper has-video';

    const videoHashtag = document.createElement('p');
    videoHashtag.className = 'video-hashtag';
    videoHashtag.textContent = '#BECOMINGCUMMINGS';

    const videoFrame = document.createElement('div');
    videoFrame.className = 'countdown-video-frame countdown-video-frame--embedded';

    const celebrationVideo = getCelebrationVideoElement();
    celebrationVideo.pause();
    celebrationVideo.currentTime = 0;
    enableSoundOnPlayback(celebrationVideo);
    celebrationVideo.autoplay = true;
    celebrationVideo.controls = true;
    celebrationVideo.setAttribute('playsinline', '');

    videoFrame.appendChild(celebrationVideo);

    const videoDetails = document.createElement('div');
    videoDetails.className = 'celebration-video-details';

    const celebrationDate = document.createElement('p');
    celebrationDate.className = 'countdown-note celebration-video-detail';
    celebrationDate.textContent = '9/12/2026';

    const celebrationVenue = document.createElement('p');
    celebrationVenue.className = 'countdown-note celebration-video-detail';
    // Make venue name configurable via data attribute, fallback to default
    celebrationVenue.textContent = wrapper?.dataset?.venueName || 'Chalet View Lodge';

    const celebrationLocation = document.createElement('p');
    celebrationLocation.className = 'countdown-note celebration-video-detail';
    celebrationLocation.textContent = 'Portola CA';

    videoDetails.appendChild(celebrationDate);
    videoDetails.appendChild(celebrationVenue);
    videoDetails.appendChild(celebrationLocation);

    wrapper.appendChild(videoHashtag);
    wrapper.appendChild(videoFrame);
    wrapper.appendChild(videoDetails);

    return { wrapper, celebrationVideo };
  };

  /**
   * Builds the venue sneak peek video interface
   * @returns {Object} Object containing wrapper, video, and back button elements
   */
  const buildSneakPeekVideo = () => {
    const wrapper = document.createElement('div');
    wrapper.className = 'countdown-wrapper has-video sneak-peek-wrapper';

    const videoHashtag = document.createElement('p');
    videoHashtag.className = 'video-hashtag sneak-peek-hashtag';
    videoHashtag.textContent = 'Venue sneak peek';

    const videoFrame = document.createElement('div');
    videoFrame.className = 'countdown-video-frame countdown-video-frame--embedded sneak-peek-frame';

    const video = document.createElement('video');
    video.className = 'countdown-video countdown-video--embedded sneak-peek-embed';
    video.src = VENUE_SNEAK_PEEK_VIDEO_SOURCE;
    video.controls = true;
    video.preload = 'auto';
    video.autoplay = true;
    video.setAttribute('playsinline', '');
    video.setAttribute('aria-label', 'Sneak peek of the celebration venue');
    enableSoundOnPlayback(video);

    videoFrame.appendChild(video);

    const caption = document.createElement('p');
    caption.className = 'countdown-note sneak-peek-caption';
    caption.textContent = 'Take a quick tour of where we will celebrate together!';

    const backButton = createBackToDetailsButton();

    wrapper.appendChild(videoHashtag);
    wrapper.appendChild(videoFrame);
    wrapper.appendChild(caption);
    wrapper.appendChild(backButton);

    return { wrapper, video, backButton };
  };

  // =====================================================================
  // VIDEO DISPLAY CONTROLLERS
  // =====================================================================

  /**
   * Shows the celebration video in the specified container
   * @param {Object} options - Configuration options
   * @param {HTMLElement} [options.targetContainer] - Target container element
   * @param {Function} [options.onVideoEnded] - Callback when video ends
   * @param {Function} [options.onVideoError] - Callback on video error
   * @param {boolean} [options.withCelebrateEffectsOnComplete=true] - Whether to show effects
   */
  const showCelebrationVideo = ({
    targetContainer = cardShell,
    onVideoEnded,
    onVideoError,
    withCelebrateEffectsOnComplete = true,
  } = {}) => {
    if (!targetContainer) return;

    const { wrapper, celebrationVideo } = buildCelebrationVideo();
    targetContainer.innerHTML = '';
    targetContainer.appendChild(wrapper);

    const resolvedOnEnded = typeof onVideoEnded === 'function'
      ? onVideoEnded
      : () => {
          if (withCelebrateEffectsOnComplete) {
            showSaveTheDateDetails({ targetContainer, withCelebrateEffects: true });
          } else {
            showSaveTheDateDetails({ targetContainer });
          }
        };

    const resolvedOnError = typeof onVideoError === 'function'
      ? onVideoError
      : () => {
          showSaveTheDateDetails({ targetContainer });
        };

    attachCelebrationVideoHandlers(celebrationVideo, {
      onEnded: () => {
        window.setTimeout(resolvedOnEnded, VIDEO_COMPLETE_DELAY_MS);
      },
      onError: () => {
        resolvedOnError();
      },
    });

    safelyPlayVideo(celebrationVideo, {
      onError: () => {
        resolvedOnError();
      },
    });
  };

  /**
   * Shows the venue sneak peek video in the specified container
   * @param {Object} options - Configuration options
   * @param {HTMLElement} [options.targetContainer] - Target container element
   */
  const showSneakPeekVideo = ({ targetContainer = cardShell } = {}) => {
    if (!targetContainer) return;

    stopCelebrationVideoPlayback();

    const { wrapper, video, backButton } = buildSneakPeekVideo();

    targetContainer.innerHTML = '';
    targetContainer.appendChild(wrapper);

    if (backButton) {
      eventListenerManager.add(backButton, 'click', () => {
        showSaveTheDateDetails({ targetContainer });
      });
    }

    if (video) {
      video.currentTime = 0;

      safelyPlayVideo(video, {
        onError: (error) => {
          // Always log the error, regardless of its truthiness, and provide type context
          console.info(
            'Sneak peek video playback could not start automatically.',
            typeof error === 'undefined'
              ? '[no error provided]'
              : error
          );
        },
      });
    }
  };

  // Mobile experience helpers ----------------------------------------
  const createMobileFrame = (additionalClassName = '') => {
    const frame = document.createElement('div');
    frame.className = `mobile-frame${additionalClassName ? ` ${additionalClassName}` : ''}`;
    return frame;
  };

  const swapMobileFrame = (newFrame) => {
    if (!mobileStage) {
      return;
    }

    playTransitionSound();

    const transitionDelay = prefersReducedMotion ? 0 : CELEBRATION_TRANSITION_DELAY_MS;
    const existingFrame = mobileStage.firstElementChild;

    const placeNewFrame = () => {
      mobileStage.replaceChildren(newFrame);
      if (prefersReducedMotion) {
        newFrame.classList.add('is-visible');
      } else {
        window.requestAnimationFrame(() => {
          newFrame.classList.add('is-visible');
        });
      }
    };

    if (existingFrame && !prefersReducedMotion) {
      existingFrame.classList.remove('is-visible');
      window.setTimeout(placeNewFrame, transitionDelay);
    } else {
      placeNewFrame();
    }
  };

  const showMobileSaveTheDate = ({ withCelebrateEffects = true } = {}) => {
    if (!mobileStage) {
      return;
    }

    stopCelebrationVideoPlayback();

    const elements = buildSaveTheDateDetails();
    const frame = createMobileFrame('mobile-frame--card');
    frame.appendChild(elements.wrapper);

    swapMobileFrame(frame);

    wireSaveTheDateActions(elements, {
      onReplay: () => {
        showMobileVideo();
      },
      onSneakPeek: () => {
        showMobileSneakPeek();
      },
    });

    const reveal = () => {
      revealSaveTheDateDetails(elements, { withCelebrateEffects });
    };

    if (prefersReducedMotion) {
      reveal();
    } else {
      window.setTimeout(reveal, SAVE_THE_DATE_REVEAL_DELAY_MS);
    }
  };

  const showMobileVideo = ({ isFromFinalPhoto = false } = {}) => {
    if (!mobileStage) {
      return;
    }

    const { wrapper, celebrationVideo } = buildCelebrationVideo();
    const frame = createMobileFrame('mobile-frame--video');
    if (!prefersReducedMotion && isFromFinalPhoto) {
      frame.classList.add('mobile-frame--video-slow-reveal');
    }
    frame.appendChild(wrapper);

    swapMobileFrame(frame);

    attachCelebrationVideoHandlers(celebrationVideo, {
      onEnded: () => {
        window.setTimeout(() => {
          showMobileSaveTheDate({ withCelebrateEffects: true });
        }, VIDEO_COMPLETE_DELAY_MS);
      },
      onError: () => {
        showMobileSaveTheDate({ withCelebrateEffects: false });
      },
    });

    safelyPlayVideo(celebrationVideo, {
      onError: () => {
        showMobileSaveTheDate({ withCelebrateEffects: false });
      },
    });
  };

  const showMobileSneakPeek = () => {
    if (!mobileStage) {
      showSneakPeekVideo({ targetContainer: cardShell });
      return;
    }

    stopCelebrationVideoPlayback();

    const { wrapper, video, backButton } = buildSneakPeekVideo();

    const frame = createMobileFrame('mobile-frame--video');
    frame.appendChild(wrapper);

    swapMobileFrame(frame);

    if (video) {
      video.currentTime = 0;

      safelyPlayVideo(video, {
        onError: (error) => {
          if (error) {
            console.info('Sneak peek video playback could not start automatically.', error);
          }
        },
      });
    }

    if (backButton) {
      eventListenerManager.add(backButton, 'click', () => {
        showMobileSaveTheDate({ withCelebrateEffects: false });
      });
    }
  };

  const showMobilePhotoAtIndex = (index, cycleIndex = 0) => {
    if (!mobileStage) {
      return;
    }

    if (cycleIndex >= mobilePhotoLoopCount) {
      showMobileVideo();
      return;
    }

    if (index >= mobilePhotoDetails.length) {
      showMobilePhotoAtIndex(0, cycleIndex + 1);
      return;
    }

    const photoDetails = mobilePhotoDetails[index];
    if (!photoDetails || !photoDetails.src) {
      window.setTimeout(() => {
        showMobilePhotoAtIndex(index + 1, cycleIndex);
      }, 0);
      return;
    }

    const frame = createMobileFrame('mobile-frame--photo');
    const image = document.createElement('img');
    image.src = photoDetails.src;
    image.alt = photoDetails.alt || '';
    const isFinalPhoto =
      !prefersReducedMotion &&
      cycleIndex === mobilePhotoLoopCount - 1 &&
      index === mobilePhotoDetails.length - 1;
    if (isFinalPhoto) {
      frame.classList.add('mobile-frame--photo-final');
      image.classList.add('mobile-frame__image--final');
    }
    frame.appendChild(image);

    swapMobileFrame(frame);

    const transitionDelay = prefersReducedMotion ? 0 : CELEBRATION_TRANSITION_DELAY_MS;
    const displayDuration = getMobilePhotoDisplayDuration({ cycleIndex, photoIndex: index });
    const minimumDelay = transitionDelay > 0
      ? transitionDelay + MOBILE_PHOTO_TRANSITION_BUFFER_MS
      : 0;
    const scheduleDelay = Math.max(displayDuration, minimumDelay);

    if (isFinalPhoto) {
      const finalDelay = Math.max(
        MOBILE_FINAL_PHOTO_ANIMATION_DURATION_MS + MOBILE_FINAL_PHOTO_ADDITIONAL_DELAY_MS,
        scheduleDelay
      );
      window.setTimeout(() => {
        showMobileVideo({ isFromFinalPhoto: true });
      }, finalDelay);
      return;
    }

    window.setTimeout(() => {
      showMobilePhotoAtIndex(index + 1, cycleIndex);
    }, scheduleDelay);
  };

  const startMobileSequence = () => {
    if (!mobileStage) {
      showCelebrationVideo({ targetContainer: cardShell });
      return;
    }

    if (mobilePhotoDetails.length === 0) {
      showMobileVideo();
      return;
    }

    showMobilePhotoAtIndex(0, 0);
  };

  // Countdown flow ----------------------------------------------------
  const handleCountdownTick = () => {
    if (!countdownNumber) {
      return;
    }

    currentValue -= 1;
    countdownNumber.classList.add('is-transitioning');
    playTransitionSound();

    if (currentValue <= 0) {
      countdownNumber.textContent = '0';
      countdownNumber.setAttribute('aria-label', 'Countdown finished - celebration begins now!');
      
      // Announce completion to screen readers
      const announcement = document.createElement('div');
      announcement.textContent = 'Countdown complete! The celebration video is now playing.';
      announcement.setAttribute('aria-live', 'polite');
      announcement.setAttribute('role', 'status');
      announcement.className = 'visually-hidden';
      document.body.appendChild(announcement);
      setTimeout(() => announcement.remove(), 3000);
      
      window.clearInterval(countdownIntervalId);
      revealNextBorderCell();
      if (countdownNote) {
        countdownNote.textContent = 'Get ready for the celebration!';
      }
      window.setTimeout(() => {
        showCelebrationVideo();
      }, COUNTDOWN_COMPLETE_VIDEO_DELAY_MS);
    } else {
      countdownNumber.textContent = String(currentValue);
      countdownNumber.setAttribute('aria-label', `Countdown at ${currentValue}`);
      revealNextBorderCell();
    }

    window.setTimeout(() => {
      countdownNumber.classList.remove('is-transitioning');
    }, COUNTDOWN_TRANSITION_RESET_MS);
  };

  const startCountdownFlow = () => {
    if (isMobileExperienceActive) {
      primeMobileCelebrationVideoPlayback();
      startMobileSequence();
      return;
    }

    if (!countdownNumber || !initialCountdownWrapper) {
      showCelebrationVideo();
      return;
    }

    countdownNumber.textContent = String(currentValue);
    countdownNumber.setAttribute('aria-label', `Countdown at ${currentValue}`);
    revealNextBorderCell();
    playTransitionSound();
    countdownIntervalId = window.setInterval(handleCountdownTick, COUNTDOWN_INTERVAL_MS);
  };

  // Overlay lifecycle -------------------------------------------------
  const startExperience = () => {
    if (hasStarted) {
      return;
    }

    hasStarted = true;

    if (startOverlayContent) {
      startOverlayContent.classList.add('is-clearing');
    }

    if (startOverlay) {
      startOverlay.removeEventListener('click', startExperience);
      startOverlay.removeEventListener('keydown', handleOverlayKeyDown);
      startOverlay.classList.add('is-counting');
      window.setTimeout(() => {
        startOverlay.classList.add('hidden');
        startOverlay.setAttribute('aria-hidden', 'true');
        startOverlay.setAttribute('tabindex', '-1');
        if (startOverlay.parentElement) {
          startOverlay.remove();
        }
      }, START_OVERLAY_CLEAR_DELAY_MS);
    }

    if (startButton) {
      startButton.removeEventListener('click', startExperience);
      startButton.disabled = true;
      startButton.setAttribute('tabindex', '-1');
    }

    const context = getAudioContext();
    resumeContextIfSuspended(context);

    if (isMobileExperienceActive) {
      primeMobileCelebrationVideoPlayback();
      startMobileSequence();
    } else {
      startCountdownFlow();
    }
  };

  const handleOverlayKeyDown = (event) => {
    if (!event) {
      return;
    }

    if (KEYBOARD_ACTIVATION_KEYS.has(event.key)) {
      event.preventDefault();
      startExperience();
    }
  };

  // Wire up interactions with proper event management --------------
  if (startButton) {
    eventListenerManager.add(startButton, 'click', startExperience);
  }

  if (startOverlay) {
    eventListenerManager.add(startOverlay, 'click', startExperience);
    eventListenerManager.add(startOverlay, 'keydown', handleOverlayKeyDown);
  }

  if (!startOverlay || !startButton) {
    startExperience();
  }
})();
