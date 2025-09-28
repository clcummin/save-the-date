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
  const VENUE_SNEAK_PEEK_VIDEO_SOURCE = 'assets/ChaletView480.mp4';
  const CELEBRATION_AUDIO_SOURCE = 'assets/ReelAudio-33714.mp3';
  const SNEAK_PEEK_AUDIO_SOURCE = 'assets/ReelAudio-71698.mp3';
  const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';
  const SOUND_PERMISSION_VISIBLE_CLASS = 'sound-permission--visible';
  const SOUND_PERMISSION_ROLE = 'celebration-sound-permission';
  const SOUND_PERMISSION_BUTTON_LABEL = 'Enable sound';
  const SOUND_PERMISSION_MESSAGE = 'Sound is paused until you enable it.';

  // =====================================================================
  // VIDEO MANAGEMENT MODULE
  // =====================================================================

  // Shared video state
  let sharedCelebrationVideoElement = null;
  let sharedCelebrationVideoEndedHandler = null;
  let sharedCelebrationVideoErrorHandler = null;
  let hasPrimedMobileVideoPlayback = false;
  let sharedCelebrationAudioElement = null;
  let cleanupCelebrationMediaSync = null;
  let hasPrimedCelebrationAudioPlayback = false;
  let sharedSneakPeekAudioElement = null;
  let hasPrimedSneakPeekAudioPlayback = false;
  let activeCelebrationVideoElement = null;
  let celebrationAudioPermissionContainer = null;
  let celebrationAudioPermissionButton = null;
  let celebrationAudioPermissionMessage = null;
  let isCelebrationAudioPlaybackBlocked = false;
  let currentCelebrationVideoWrapper = null;

  /**
   * Creates a new celebration video element with appropriate settings
   * @returns {HTMLVideoElement} The configured video element
   */
  const createCelebrationVideoElement = () => {
    const video = document.createElement('video');
    video.className = 'countdown-video';
    video.src = 'assets/video.mp4';
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
  const ensureMediaUtilityContainer = () => {
    const body = document.body;
    if (!body) {
      return null;
    }

    let container = body.querySelector('[data-role="media-utility-container"]');
    if (container) {
      return container;
    }

    container = document.createElement('div');
    container.dataset.role = 'media-utility-container';
    container.setAttribute('aria-hidden', 'true');
    container.style.position = 'fixed';
    container.style.width = '1px';
    container.style.height = '1px';
    container.style.overflow = 'hidden';
    container.style.pointerEvents = 'none';
    container.style.opacity = '0';
    container.style.zIndex = '-1';

    body.appendChild(container);
    return container;
  };

  const registerSharedAudioElement = (audio) => {
    if (!audio) {
      return;
    }

    const container = ensureMediaUtilityContainer();
    if (!container) {
      return;
    }

    if (!container.contains(audio)) {
      container.appendChild(audio);
    }
  };

  function ensureCelebrationAudioPermissionUi(wrapper) {
    if (!wrapper) {
      return;
    }

    if (
      celebrationAudioPermissionContainer &&
      celebrationAudioPermissionContainer.parentElement !== wrapper
    ) {
      celebrationAudioPermissionContainer.remove();
      celebrationAudioPermissionContainer = null;
      celebrationAudioPermissionButton = null;
      celebrationAudioPermissionMessage = null;
    }

    if (!celebrationAudioPermissionContainer) {
      const container = document.createElement('div');
      container.className = 'sound-permission';
      container.dataset.role = SOUND_PERMISSION_ROLE;
      container.hidden = true;
      container.setAttribute('aria-live', 'polite');
      container.setAttribute('aria-atomic', 'true');
      container.setAttribute('aria-hidden', 'true');

      const message = document.createElement('span');
      message.className = 'sound-permission__message';
      message.textContent = SOUND_PERMISSION_MESSAGE;

      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'sound-permission__button';
      button.textContent = SOUND_PERMISSION_BUTTON_LABEL;
      button.setAttribute('aria-label', 'Enable sound for the celebration video');

      container.appendChild(message);
      container.appendChild(button);
      wrapper.appendChild(container);

      celebrationAudioPermissionContainer = container;
      celebrationAudioPermissionButton = button;
      celebrationAudioPermissionMessage = message;

      eventListenerManager.add(button, 'click', () => {
        ensureCelebrationAudioPlayback({ initiatedByUser: true, forceRetry: true });
      });
    } else if (!wrapper.contains(celebrationAudioPermissionContainer)) {
      wrapper.appendChild(celebrationAudioPermissionContainer);
    }

    if (celebrationAudioPermissionMessage) {
      celebrationAudioPermissionMessage.textContent = SOUND_PERMISSION_MESSAGE;
    }
  }

  function showCelebrationAudioPermissionUi() {
    if (!currentCelebrationVideoWrapper) {
      return;
    }

    ensureCelebrationAudioPermissionUi(currentCelebrationVideoWrapper);

    if (!celebrationAudioPermissionContainer) {
      return;
    }

    celebrationAudioPermissionContainer.hidden = false;
    celebrationAudioPermissionContainer.setAttribute('aria-hidden', 'false');
    window.requestAnimationFrame(() => {
      celebrationAudioPermissionContainer.classList.add(SOUND_PERMISSION_VISIBLE_CLASS);
    });
  }

  function hideCelebrationAudioPermissionUi() {
    if (!celebrationAudioPermissionContainer) {
      return;
    }

    celebrationAudioPermissionContainer.classList.remove(SOUND_PERMISSION_VISIBLE_CLASS);
    celebrationAudioPermissionContainer.setAttribute('aria-hidden', 'true');

    window.setTimeout(() => {
      if (celebrationAudioPermissionContainer) {
        celebrationAudioPermissionContainer.hidden = true;
      }
    }, 200);
  }

  const createCelebrationAudioElement = () => {
    const audio = document.createElement('audio');
    audio.src = CELEBRATION_AUDIO_SOURCE;
    audio.preload = 'auto';
    audio.autoplay = false;
    audio.loop = false;
    audio.controls = false;
    audio.muted = false;
    audio.setAttribute('playsinline', '');
    audio.setAttribute('aria-hidden', 'true');
    audio.dataset.role = 'celebration-audio';
    registerSharedAudioElement(audio);
    return audio;
  };

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
   * Gets or creates the shared celebration audio element
   * @returns {HTMLAudioElement|null} The audio element
   */
  const getCelebrationAudioElement = () => {
    if (!sharedCelebrationAudioElement) {
      sharedCelebrationAudioElement = createCelebrationAudioElement();
    }
    return sharedCelebrationAudioElement;
  };

  /**
   * Stops and rewinds the shared celebration audio
   */
  const stopCelebrationAudio = () => {
    if (!sharedCelebrationAudioElement) {
      return;
    }

    try {
      sharedCelebrationAudioElement.pause();
      sharedCelebrationAudioElement.currentTime = 0;
    } catch (error) {
      // Ignore errors while attempting to reset audio state
    }

    isCelebrationAudioPlaybackBlocked = false;
    hideCelebrationAudioPermissionUi();
  };

  /**
   * Creates the sneak peek audio element
   * @returns {HTMLAudioElement} The configured audio element
   */
  const createSneakPeekAudioElement = () => {
    const audio = document.createElement('audio');
    audio.src = SNEAK_PEEK_AUDIO_SOURCE;
    audio.preload = 'auto';
    audio.autoplay = false;
    audio.loop = true;
    audio.controls = false;
    audio.muted = false;
    audio.setAttribute('playsinline', '');
    audio.setAttribute('aria-hidden', 'true');
    audio.dataset.role = 'sneak-peek-audio';
    registerSharedAudioElement(audio);
    return audio;
  };

  /**
   * Gets or creates the shared sneak peek audio element
   * @returns {HTMLAudioElement|null} The audio element
   */
  const getSneakPeekAudioElement = () => {
    if (!sharedSneakPeekAudioElement) {
      sharedSneakPeekAudioElement = createSneakPeekAudioElement();
    }
    return sharedSneakPeekAudioElement;
  };

  /**
   * Pauses the sneak peek audio without resetting the playback position
   */
  const pauseSneakPeekAudio = () => {
    if (!sharedSneakPeekAudioElement) {
      return;
    }

    try {
      sharedSneakPeekAudioElement.pause();
    } catch (error) {
      // Ignore pause errors while controlling sneak peek audio
    }
  };

  /**
   * Stops and rewinds the shared sneak peek audio
   */
  const stopSneakPeekAudio = () => {
    if (!sharedSneakPeekAudioElement) {
      return;
    }

    try {
      sharedSneakPeekAudioElement.pause();
      sharedSneakPeekAudioElement.currentTime = 0;
    } catch (error) {
      // Ignore errors while attempting to reset audio state
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
   * Removes any existing media sync handlers between the video and audio
   */
  const resetCelebrationMediaSync = () => {
    if (typeof cleanupCelebrationMediaSync === 'function') {
      try {
        cleanupCelebrationMediaSync();
      } catch (error) {
        // Ignore cleanup errors to avoid interrupting flow
      }
      cleanupCelebrationMediaSync = null;
    }

    activeCelebrationVideoElement = null;
    currentCelebrationVideoWrapper = null;
    hideCelebrationAudioPermissionUi();
  };

  /**
   * Waits until the associated video is actively playing before attempting to
   * start linked audio playback. This helps avoid scenarios where audio begins
   * before video frames are visible on mobile browsers.
   * @param {Object} options - Configuration options
   * @param {HTMLVideoElement} options.video - The controlling video element
   * @param {Function} options.ensureAudioPlayback - Function that triggers the
   *   paired audio playback
   */
  const ensureAudioPlaybackWhenVideoActive = ({ video, ensureAudioPlayback }) => {
    if (!video || typeof ensureAudioPlayback !== 'function') {
      return;
    }

    if (!video.paused && !video.ended) {
      ensureAudioPlayback();
      return;
    }

    let cleanup = null;
    const handlePlaying = () => {
      ensureAudioPlayback();
      if (typeof cleanup === 'function') {
        cleanup();
      }
    };

    cleanup = eventListenerManager.add(video, 'playing', handlePlaying, { once: true });
  };

  /**
   * Synchronizes the celebration audio element with the provided video
   * @param {HTMLVideoElement} video - The video element to sync from
   * @param {HTMLAudioElement} audio - The audio element to sync to
   */
  const setupCelebrationMediaSync = ({ video, audio }) => {
    if (!video || !audio) {
      return;
    }

    resetCelebrationMediaSync();

    activeCelebrationVideoElement = video;
    isCelebrationAudioPlaybackBlocked = false;
    hideCelebrationAudioPermissionUi();

    const resolvedWrapper = video.closest('.countdown-wrapper');
    if (resolvedWrapper) {
      currentCelebrationVideoWrapper = resolvedWrapper;
      ensureCelebrationAudioPermissionUi(resolvedWrapper);
    }

    let hasUserAdjustedVolume = false;

    const ensureAudioSync = () => {
      try {
        const videoTime = Number(video.currentTime);
        if (!Number.isFinite(videoTime)) {
          return;
        }

        const audioTime = Number(audio.currentTime);
        if (!Number.isFinite(audioTime) || Math.abs(audioTime - videoTime) > 0.35) {
          audio.currentTime = videoTime;
        }
      } catch (error) {
        // Ignore sync errors; browser will handle gracefully
      }
    };

    const applyVolumeState = () => {
      audio.muted = video.muted;
      const resolvedVolume = Number.isFinite(video.volume) ? video.volume : 1;
      audio.volume = resolvedVolume;
    };

    const applyPlaybackRate = () => {
      try {
        audio.playbackRate = video.playbackRate || 1;
      } catch (error) {
        // Ignore playback rate sync errors
      }
    };

    const ensureAudioAudibleWhenVideoMuted = () => {
      if (!video.muted || hasUserAdjustedVolume) {
        return;
      }

      audio.muted = false;
      const resolvedVolume = Number.isFinite(video.volume) ? video.volume : 1;
      audio.volume = resolvedVolume;
    };

    const handleVideoVolumeChange = (event) => {
      if (event?.isTrusted) {
        hasUserAdjustedVolume = true;
      }

      applyVolumeState();

      if (!hasUserAdjustedVolume) {
        ensureAudioAudibleWhenVideoMuted();
      }
    };

    const handleVideoPlay = (event) => {
      ensureAudioSync();
      applyVolumeState();
      ensureAudioAudibleWhenVideoMuted();
      applyPlaybackRate();

      const allowRetry = Boolean(event?.isTrusted);

      const playPromise = audio.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(() => {
          // Allow audio playback failures to silently fall back
        });
      }

      ensureCelebrationAudioPlayback({ allowRetry, initiatedByUser: allowRetry });

      ensureAudioPlaybackWhenVideoActive({
        video,
        ensureAudioPlayback: () =>
          ensureCelebrationAudioPlayback({ allowRetry: true, initiatedByUser: allowRetry }),
      });
    };

    const handleVideoPause = () => {
      audio.pause();
    };

    const handleVideoEnded = () => {
      audio.pause();
      try {
        audio.currentTime = 0;
      } catch (error) {
        // Ignore errors when rewinding audio
      }
    };

    const cleanupFns = [];
    const registerCleanup = (cleanup) => {
      if (typeof cleanup === 'function') {
        cleanupFns.push(cleanup);
      }
    };

    audio.pause();
    try {
      audio.currentTime = 0;
    } catch (error) {
      // Ignore errors resetting audio currentTime
    }

    applyVolumeState();
    ensureAudioAudibleWhenVideoMuted();
    applyPlaybackRate();

    registerCleanup(eventListenerManager.add(video, 'play', handleVideoPlay));
    registerCleanup(eventListenerManager.add(video, 'pause', handleVideoPause));
    registerCleanup(eventListenerManager.add(video, 'seeking', ensureAudioSync));
    registerCleanup(eventListenerManager.add(video, 'timeupdate', ensureAudioSync));
    registerCleanup(eventListenerManager.add(video, 'ratechange', applyPlaybackRate));
    registerCleanup(eventListenerManager.add(video, 'volumechange', handleVideoVolumeChange));
    registerCleanup(eventListenerManager.add(video, 'ended', handleVideoEnded));

    cleanupCelebrationMediaSync = () => {
      cleanupFns.forEach((cleanup) => {
        try {
          cleanup();
        } catch (error) {
          // Ignore cleanup errors to avoid interrupting flow
        }
      });
      audio.pause();
    };
  };

  /**
   * Synchronizes sneak peek audio playback with the associated video element
   * @param {HTMLVideoElement} video - The video element to mirror
   * @param {HTMLAudioElement} audio - The audio element that provides the soundtrack
   */
  const setupSneakPeekMediaSync = ({ video, audio }) => {
    if (!video || !audio) {
      return;
    }

    const syncTime = () => {
      try {
        const videoTime = Number(video.currentTime);
        if (!Number.isFinite(videoTime)) {
          return;
        }

        const audioTime = Number(audio.currentTime);
        if (!Number.isFinite(audioTime) || Math.abs(audioTime - videoTime) > 0.3) {
          audio.currentTime = videoTime;
        }
      } catch (error) {
        // Ignore sync errors; browser timing will settle naturally
      }
    };

    const applyVolumeState = () => {
      audio.muted = video.muted;
      const resolvedVolume = Number.isFinite(video.volume) ? video.volume : 1;
      audio.volume = resolvedVolume;
    };

    const applyPlaybackRate = () => {
      try {
        audio.playbackRate = video.playbackRate || 1;
      } catch (error) {
        // Ignore playback-rate sync errors
      }
    };

    const unmuteMedia = () => {
      video.muted = false;
      video.defaultMuted = false;
      video.removeAttribute('muted');
      audio.muted = false;
    };

    applyVolumeState();

    let hasUnmutedOnPlay = false;

    const syncAndResumeAudio = () => {
      applyVolumeState();
      applyPlaybackRate();
      syncTime();
      ensureSneakPeekAudioPlayback();
    };

    eventListenerManager.add(video, 'play', () => {
      if (!hasUnmutedOnPlay && video.muted) {
        unmuteMedia();
        hasUnmutedOnPlay = true;
      }
      syncAndResumeAudio();
    });

/* Removed redundant 'playing' event handler; audio sync is now handled by ensureAudioPlaybackWhenVideoActive in the 'play' handler. */

    eventListenerManager.add(video, 'pause', () => {
      pauseSneakPeekAudio();
    });

    eventListenerManager.add(video, 'ended', () => {
      stopSneakPeekAudio();
    });

    eventListenerManager.add(video, 'seeking', syncTime);
    eventListenerManager.add(video, 'seeked', syncTime);
    // Removed redundant timeupdate handler to avoid unnecessary syncTime() calls.

    eventListenerManager.add(video, 'volumechange', applyVolumeState);
    eventListenerManager.add(video, 'ratechange', applyPlaybackRate);
  };

  /**
   * Ensures the celebration audio track is playing and audible
   * @param {Object} [options] - Playback configuration options
   * @param {boolean} [options.allowRetry=false] - Whether to retry if playback was previously blocked
   * @param {boolean} [options.initiatedByUser=false] - Indicates if the attempt was triggered by a trusted user action
   * @param {boolean} [options.forceRetry=false] - Forces a retry even if playback is flagged as blocked
   */
  function ensureCelebrationAudioPlayback(options = {}) {
    const normalizedOptions =
      options && typeof options === 'object' ? options : {};

    const {
      allowRetry = false,
      initiatedByUser = false,
      forceRetry = false,
    } = normalizedOptions;

    const audio = getCelebrationAudioElement();
    if (!audio) {
      return;
    }

    if (isCelebrationAudioPlaybackBlocked && !allowRetry && !forceRetry) {
      return;
    }

    const context = getAudioContext();
    if (context) {
      resumeContextIfSuspended(context);
    }

    const controllingVideo = activeCelebrationVideoElement;
    if (controllingVideo) {
      audio.muted = !controllingVideo.muted;
    }

    if (!audio.paused && !audio.ended) {
      isCelebrationAudioPlaybackBlocked = false;
      hideCelebrationAudioPermissionUi();
      return;
    }

    const playPromise = audio.play();
    if (playPromise && typeof playPromise.then === 'function') {
      playPromise
        .then(() => {
          isCelebrationAudioPlaybackBlocked = false;
          hideCelebrationAudioPermissionUi();
        })
        .catch((error) => {
          isCelebrationAudioPlaybackBlocked = true;

          const errorMessage = error?.message || error;
          const isPolicyRestriction =
            error?.name === 'NotAllowedError' ||
            (typeof errorMessage === 'string' &&
              /not\s+allowed/i.test(errorMessage));

          if (isPolicyRestriction) {
            showCelebrationAudioPermissionUi();
          }

          if (!initiatedByUser) {
            console.info(
              'Celebration audio playback could not start automatically:',
              errorMessage
            );
          }
        });
    } else {
      isCelebrationAudioPlaybackBlocked = false;
      hideCelebrationAudioPermissionUi();
    }
  }

  /**
   * Primes the celebration audio element to satisfy autoplay policies
   */
  const primeCelebrationAudioPlayback = () => {
    if (hasPrimedCelebrationAudioPlayback) {
      return;
    }

    const audio = getCelebrationAudioElement();
    if (!audio) {
      return;
    }

    const originalMutedState = audio.muted;

    const finalizePrimer = (wasSuccessful) => {
      try {
        audio.pause();
      } catch (error) {
        // Ignore pause errors during primer cleanup
      }

      try {
        audio.currentTime = 0;
      } catch (error) {
        // Ignore rewind errors during primer cleanup
      }

      audio.muted = originalMutedState;

      if (wasSuccessful) {
        hasPrimedCelebrationAudioPlayback = true;
      }
    };

    try {
      audio.muted = true;
      const playPromise = audio.play();

      if (playPromise && typeof playPromise.then === 'function') {
        playPromise
          .then(() => {
            finalizePrimer(true);
          })
          .catch(() => {
            finalizePrimer(false);
          });
      } else {
        // Defensive: check if playback actually started after a short delay
        setTimeout(() => {
          if (!audio.paused) {
            finalizePrimer(true);
          } else {
            finalizePrimer(false);
          }
        }, 100);
      }
    } catch (error) {
      finalizePrimer(false);
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

  /**
   * Primes the sneak peek audio element to satisfy autoplay policies
   */
  const primeSneakPeekAudioPlayback = () => {
    if (hasPrimedSneakPeekAudioPlayback) {
      return;
    }

    const audio = getSneakPeekAudioElement();
    if (!audio) {
      return;
    }

    const originalMutedState = audio.muted;

    const finalizePrimer = (wasSuccessful) => {
      try {
        audio.pause();
      } catch (error) {
        // Ignore pause errors during primer cleanup
      }

      try {
        audio.currentTime = 0;
      } catch (error) {
        // Ignore rewind errors during primer cleanup
      }

      audio.muted = originalMutedState;

      if (wasSuccessful) {
        hasPrimedSneakPeekAudioPlayback = true;
      }
    };

    try {
      audio.muted = true;
      const playPromise = audio.play();

      if (playPromise && typeof playPromise.then === 'function') {
        playPromise
          .then(() => {
            finalizePrimer(true);
          })
          .catch(() => {
            finalizePrimer(false);
          });
      } else {
        setTimeout(() => {
          if (!audio.paused) {
            finalizePrimer(true);
          } else {
            finalizePrimer(false);
          }
        }, 100);
      }
    } catch (error) {
      finalizePrimer(false);
    }
  };

  /**
   * Ensures the sneak peek audio track is playing
   */
  const ensureSneakPeekAudioPlayback = () => {
    const audio = getSneakPeekAudioElement();
    if (!audio) {
      return;
    }

    if (audio.muted) {
      audio.muted = false;
    }

    if (!audio.paused) {
      return;
    }

    const playPromise = audio.play();
    if (playPromise && typeof playPromise.then === 'function') {
      playPromise.catch(() => {
        // Allow playback failures to fail silently; user can retry by pressing play on the video
      });
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
  const initialCountdownWrapper = cardShell?.querySelector('.countdown-wrapper');
  const countdownNumber = document.getElementById('countdownNumber');
  const countdownNote = initialCountdownWrapper?.querySelector('.countdown-note');
  const countdownStart = borderCells.length > 0 ? borderCells.length : COUNTDOWN_START_FALLBACK;
  
  let currentValue = countdownStart;
  let revealedCells = 0;
  let countdownIntervalId = null;
  let hasStarted = false;


  // Overlay control elements
  const startOverlay = document.getElementById('startOverlay');
  const startOverlayContent = startOverlay?.querySelector('.countdown-overlay-content') ?? null;
  const startButton = document.getElementById('startCountdownButton');

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

    resetCelebrationMediaSync();
    stopCelebrationAudio();
    stopSneakPeekAudio();

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
    videoFrame.className = 'countdown-video-frame';

    const celebrationVideo = getCelebrationVideoElement();
    celebrationVideo.pause();
    celebrationVideo.currentTime = 0;
    celebrationVideo.muted = true;
    celebrationVideo.defaultMuted = true;
    celebrationVideo.setAttribute('muted', '');
    celebrationVideo.volume = 1;
    celebrationVideo.autoplay = true;
    celebrationVideo.controls = true;
    celebrationVideo.setAttribute('playsinline', '');

    videoFrame.appendChild(celebrationVideo);

    wrapper.appendChild(videoHashtag);
    wrapper.appendChild(videoFrame);

    currentCelebrationVideoWrapper = wrapper;
    ensureCelebrationAudioPermissionUi(wrapper);
    hideCelebrationAudioPermissionUi();

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
    videoFrame.className = 'countdown-video-frame sneak-peek-frame';

    const video = document.createElement('video');
    video.className = 'sneak-peek-embed';
    video.src = VENUE_SNEAK_PEEK_VIDEO_SOURCE;
    video.controls = true;
    video.preload = 'metadata';
    video.muted = true;
    video.defaultMuted = true;
    video.setAttribute('muted', '');
    video.setAttribute('playsinline', '');
    video.setAttribute('aria-label', 'Sneak peek of the celebration venue');

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

    stopSneakPeekAudio();
    const { wrapper, celebrationVideo } = buildCelebrationVideo();
    const celebrationAudio = getCelebrationAudioElement();
    targetContainer.innerHTML = '';
    targetContainer.appendChild(wrapper);

    setupCelebrationMediaSync({ video: celebrationVideo, audio: celebrationAudio });

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
      onSuccess: () => {
        ensureAudioPlaybackWhenVideoActive({
          video: celebrationVideo,
          ensureAudioPlayback: ensureCelebrationAudioPlayback,
        });
      },
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

    resetCelebrationMediaSync();
    stopCelebrationAudio();
    stopSneakPeekAudio();

    const { wrapper, video, backButton } = buildSneakPeekVideo();
    const sneakPeekAudio = getSneakPeekAudioElement();

    if (sneakPeekAudio) {
      try {
        sneakPeekAudio.currentTime = 0;
        sneakPeekAudio.muted = true;
      } catch (error) {
        // Ignore errors while rewinding sneak peek audio
      }
    }

    targetContainer.innerHTML = '';
    targetContainer.appendChild(wrapper);

    if (backButton) {
      eventListenerManager.add(backButton, 'click', () => {
        showSaveTheDateDetails({ targetContainer });
      });
    }

    if (video) {
      video.currentTime = 0;
      if (sneakPeekAudio) {
        setupSneakPeekMediaSync({ video, audio: sneakPeekAudio });
      }
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

    resetCelebrationMediaSync();
    stopCelebrationAudio();
    stopSneakPeekAudio();

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

    stopSneakPeekAudio();
    const { wrapper, celebrationVideo } = buildCelebrationVideo();
    const celebrationAudio = getCelebrationAudioElement();
    const frame = createMobileFrame('mobile-frame--video');
    if (!prefersReducedMotion && isFromFinalPhoto) {
      frame.classList.add('mobile-frame--video-slow-reveal');
    }
    frame.appendChild(wrapper);

    swapMobileFrame(frame);

    setupCelebrationMediaSync({ video: celebrationVideo, audio: celebrationAudio });

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
      onSuccess: () => {
        ensureAudioPlaybackWhenVideoActive({
          video: celebrationVideo,
          ensureAudioPlayback: ensureCelebrationAudioPlayback,
        });
      },
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

    resetCelebrationMediaSync();
    stopCelebrationAudio();
    stopSneakPeekAudio();

    const { wrapper, video, backButton } = buildSneakPeekVideo();
    const sneakPeekAudio = getSneakPeekAudioElement();

    if (sneakPeekAudio) {
      try {
        sneakPeekAudio.currentTime = 0;
      } catch (error) {
        // Ignore errors while rewinding sneak peek audio
      }
    }

    const frame = createMobileFrame('mobile-frame--video');
    frame.appendChild(wrapper);

    swapMobileFrame(frame);

    if (video) {
      video.currentTime = 0;
      if (sneakPeekAudio) {
        setupSneakPeekMediaSync({ video, audio: sneakPeekAudio });
      }
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
    primeCelebrationAudioPlayback();
    primeSneakPeekAudioPlayback();

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
