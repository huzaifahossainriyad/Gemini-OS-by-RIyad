/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
/* tslint:disable */
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import {GeneratedContent} from './components/GeneratedContent';
import {Icon} from './components/Icon';
import {ParametersPanel} from './components/ParametersPanel';
import {Window} from './components/Window';
import {APP_DEFINITIONS_CONFIG, INITIAL_MAX_HISTORY_LENGTH} from './constants';
import {streamAppContent} from './services/geminiService';
import {AppDefinition, InteractionData} from './types';

// --- Taskbar Component Definition ---
interface TaskbarProps {
  openApps: AppDefinition[];
  activeAppId: string | null;
  onSwitchApp: (appId: string) => void;
  onGoHome: () => void;
}

const Clock: React.FC = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timerId = setInterval(() => setTime(new Date()), 60000); // Update every minute
    return () => clearInterval(timerId);
  }, []);

  return (
    <div className="text-xs text-white">
      {time.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
    </div>
  );
};

const Taskbar: React.FC<TaskbarProps> = ({
  openApps,
  activeAppId,
  onSwitchApp,
  onGoHome,
}) => {
  return (
    <div className="absolute bottom-0 left-0 right-0 h-12 bg-gray-800/90 backdrop-blur-sm flex items-center justify-between px-2 z-50 border-t border-gray-700/50 shadow-lg">
      <div className="flex items-center gap-1">
        {/* Home/Desktop Button */}
        <button
          onClick={onGoHome}
          className={`h-10 w-10 flex items-center justify-center rounded-md transition-colors ${!activeAppId && openApps.length === 0 ? 'bg-blue-600/50' : 'hover:bg-white/10'}`}
          aria-label="Show Desktop"
          title="Show Desktop">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6z"
            />
          </svg>
        </button>

        {openApps.length > 0 && (
          <div className="w-px h-8 bg-white/20 mx-1"></div>
        )}

        {/* Open App Icons */}
        {openApps.map((app) => (
          <button
            key={app.id}
            onClick={() => onSwitchApp(app.id)}
            className={`taskbar-app-icon relative h-10 w-12 flex items-center justify-center rounded-md transition-colors ${activeAppId === app.id ? 'bg-white/20' : 'hover:bg-blue-500/30'}`}
            aria-label={`Switch to ${app.name}`}
            data-tooltip={app.name}>
            <span className="text-2xl">{app.icon}</span>
            {activeAppId === app.id && (
              <div className="absolute bottom-0 left-2 right-2 h-1 bg-blue-400 rounded-t-full"></div>
            )}
          </button>
        ))}
      </div>

      {/* System Tray */}
      <div className="flex items-center gap-3 px-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 text-white"
          viewBox="0 0 24 24"
          aria-label="Network Status">
          <title>Network: Connected</title>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            stroke="currentColor"
            fill="none"
            d="M8.288 15.038a5.25 5.25 0 0 1 7.424 0M5.136 11.886a9 9 0 0 1 12.728 0M1.984 8.734a12.75 12.75 0 0 1 18.032 0"
          />
          <path
            fill="currentColor"
            d="M12 18.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z"
          />
        </svg>
        <Clock />
      </div>
    </div>
  );
};
// --- End Taskbar Component ---

const DesktopView: React.FC<{
  onAppOpen: (app: AppDefinition) => void;
  onSearch: (query: string) => void;
}> = ({onAppOpen, onSearch}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const handleSearchSubmit = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && searchQuery.trim()) {
      onSearch(searchQuery.trim());
      setSearchQuery(''); // Clear input after search
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    searchInputRef.current?.focus();
  };

  return (
    <div className="flex flex-col items-center justify-start w-full h-full p-4 pt-12">
      <div className="w-full max-w-lg mb-12 relative">
        <input
          ref={searchInputRef}
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleSearchSubmit}
          placeholder="Search the web..."
          className="w-full px-5 py-3 pr-12 text-base text-gray-800 bg-white/70 border-2 border-gray-300 rounded-full shadow-lg backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:shadow-xl transition-all placeholder-gray-500"
          aria-label="Search the web"
        />
        {searchQuery && (
          <button
            onClick={handleClearSearch}
            className="absolute top-1/2 right-4 transform -translate-y-1/2 p-1 text-gray-500 hover:text-gray-800 hover:bg-gray-200 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
            aria-label="Clear search query">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>
      <div className="flex flex-wrap content-start justify-center p-4">
        {APP_DEFINITIONS_CONFIG.map((app) => (
          <Icon key={app.id} app={app} onInteract={() => onAppOpen(app)} />
        ))}
      </div>
    </div>
  );
};

interface AppState {
  llmContent: string;
  interactionHistory: InteractionData[];
  currentAppPath: string[];
  isLoading: boolean;
  error: string | null;
}

interface WindowRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface WindowState {
  rect: WindowRect;
  isMaximized: boolean;
  preMaximizeRect: WindowRect | null;
}

const LOCAL_STORAGE_KEY = 'riyad-my-computer-window-states';

const App: React.FC = () => {
  // --- Multi-app state management ---
  const [openApps, setOpenApps] = useState<AppDefinition[]>([]);
  const [activeAppId, setActiveAppId] = useState<string | null>(null);
  const [appStates, setAppStates] = useState<Record<string, AppState>>({});

  // --- Unified Window State (with persistence) ---
  const mainContainerRef = useRef<HTMLElement>(null);
  const [windowStates, setWindowStates] = useState<Record<string, WindowState>>(
    {},
  );

  // Load window states from localStorage on initial mount
  useEffect(() => {
    try {
      const savedStates = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedStates) {
        setWindowStates(JSON.parse(savedStates));
      }
    } catch (e) {
      console.error('Failed to load window states from localStorage:', e);
    }
  }, []);

  // Save window states to localStorage whenever they change
  useEffect(() => {
    try {
      if (Object.keys(windowStates).length > 0) {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(windowStates));
      }
    } catch (e) {
      console.error('Failed to save window states to localStorage:', e);
    }
  }, [windowStates]);

  // --- Global state ---
  const [isParametersOpen, setIsParametersOpen] = useState<boolean>(false);
  const [currentMaxHistoryLength, setCurrentMaxHistoryLength] =
    useState<number>(INITIAL_MAX_HISTORY_LENGTH);
  const [language, setLanguage] = useState<string>('English');
  const [isStatefulnessEnabled, setIsStatefulnessEnabled] =
    useState<boolean>(false);
  const [appContentCache, setAppContentCache] = useState<
    Record<string, string>
  >({});

  // --- Derived State ---
  const activeApp = openApps.find((app) => app.id === activeAppId);
  const activeAppState = activeAppId ? appStates[activeAppId] : undefined;
  const activeWindowState = activeAppId ? windowStates[activeAppId] : undefined;

  const internalHandleLlmRequest = useCallback(
    async (
      appId: string,
      historyForLlm: InteractionData[],
      maxHistoryLength: number,
      lang: string,
    ) => {
      if (historyForLlm.length === 0) return;

      setAppStates((prev) => ({
        ...prev,
        [appId]: {...prev[appId], isLoading: true, error: null},
      }));

      try {
        const stream = streamAppContent(historyForLlm, maxHistoryLength, lang);
        for await (const chunk of stream) {
          setAppStates((prev) => {
            const currentAppState = prev[appId];
            if (!currentAppState) return prev;
            return {
              ...prev,
              [appId]: {
                ...currentAppState,
                llmContent: currentAppState.llmContent + chunk,
              },
            };
          });
        }
      } catch (e: any) {
        setAppStates((prev) => {
          const currentAppState = prev[appId];
          if (!currentAppState) return prev;
          return {
            ...prev,
            [appId]: {
              ...currentAppState,
              error: e.message || 'Failed to stream content from the API.',
              llmContent: '', // Clear content on error to prevent showing stale data
            },
          };
        });
        console.error(e);
      } finally {
        setAppStates((prev) => ({
          ...prev,
          [appId]: {...prev[appId], isLoading: false},
        }));
      }
    },
    [],
  );

  // Effect to cache content when loading finishes
  useEffect(() => {
    if (
      activeAppId &&
      activeAppState &&
      !activeAppState.isLoading &&
      isStatefulnessEnabled &&
      activeAppState.llmContent
    ) {
      const cacheKey = activeAppState.currentAppPath.join('__');
      if (cacheKey && appContentCache[cacheKey] !== activeAppState.llmContent) {
        setAppContentCache((prev) => ({...prev, [cacheKey]: activeAppState.llmContent}));
      }
    }
  }, [activeAppId, activeAppState, isStatefulnessEnabled, appContentCache]);

  const handleInteraction = useCallback(
    async (interactionData: InteractionData) => {
      if (!activeAppId) return;

      const currentState = appStates[activeAppId];
      // Defensive check for robustness.
      if (!currentState || currentState.currentAppPath.length === 0) {
        console.error('Cannot handle interaction: active app state is invalid.');
        return;
      }

      // Check if the action is a "Restart". This is true when the interaction ID
      // of the clicked element (e.g., "Restart Game" button) is the same as the ID
      // that led to the current screen (e.g., the "Tic-Tac-Toe" menu item).
      const lastNavigationId =
        currentState.currentAppPath[currentState.currentAppPath.length - 1];
      const isRestartAction = interactionData.id === lastNavigationId;

      let nextAppPath: string[];
      let nextInteractionHistory: InteractionData[];

      if (isRestartAction) {
        // For a restart, we don't change the navigation path or history.
        // We simply re-use the existing state to re-trigger content generation.
        nextAppPath = currentState.currentAppPath;
        nextInteractionHistory = currentState.interactionHistory;
      } else {
        // For a normal navigation, we go one level deeper.
        nextAppPath = [...currentState.currentAppPath, interactionData.id];
        nextInteractionHistory = [
          interactionData,
          ...currentState.interactionHistory.slice(
            0,
            currentMaxHistoryLength - 1,
          ),
        ];
      }

      // Set the new state, clearing existing content to prepare for the new view.
      setAppStates((prev) => ({
        ...prev,
        [activeAppId]: {
          ...currentState,
          currentAppPath: nextAppPath,
          interactionHistory: nextInteractionHistory,
          llmContent: '', // Clear content for regeneration
          error: null,
        },
      }));

      const cacheKey = nextAppPath.join('__');

      // A restart must always ignore the cache to get fresh content.
      const useCache =
        !isRestartAction &&
        isStatefulnessEnabled &&
        appContentCache[cacheKey];

      if (useCache) {
        setAppStates((prev) => ({
          ...prev,
          [activeAppId]: {
            ...prev[activeAppId],
            llmContent: appContentCache[cacheKey],
            isLoading: false,
          },
        }));
      } else {
        internalHandleLlmRequest(
          activeAppId,
          nextInteractionHistory,
          currentMaxHistoryLength,
          language,
        );
      }
    },
    [
      activeAppId,
      appStates,
      internalHandleLlmRequest,
      currentMaxHistoryLength,
      isStatefulnessEnabled,
      appContentCache,
      language,
    ],
  );

  const openAndActivateApp = (
    app: AppDefinition,
    initialInteraction: InteractionData,
  ) => {
    let isNew = !openApps.some((openApp) => openApp.id === app.id);
    if (isNew) {
      setOpenApps((prev) => [...prev, app]);
    }
    setActiveAppId(app.id);
    if (isParametersOpen) setIsParametersOpen(false);

    // Initialize window state if it doesn't exist
    setWindowStates((prevStates) => {
      if (prevStates[app.id]) {
        return prevStates; // Already exists
      }
      const container = mainContainerRef.current;
      const defaultWidth = 800;
      const defaultHeight = 600;
      const newRect = container
        ? {
            width: defaultWidth,
            height: defaultHeight,
            x: Math.max(0, (container.clientWidth - defaultWidth) / 2),
            y: Math.max(0, (container.clientHeight - defaultHeight) / 2),
          }
        : {width: defaultWidth, height: defaultHeight, x: 50, y: 50};

      return {
        ...prevStates,
        [app.id]: {
          rect: newRect,
          isMaximized: false,
          preMaximizeRect: null,
        },
      };
    });

    if (!isNew && appStates[app.id]) {
      return; // App already open, just switch to it
    }

    const newHistory = [initialInteraction];
    const appPath = [app.id];
    const cacheKey = appPath.join('__');

    const newAppState: AppState = {
      llmContent: '',
      interactionHistory: newHistory,
      currentAppPath: appPath,
      isLoading: false,
      error: null,
    };
    setAppStates((prev) => ({...prev, [app.id]: newAppState}));

    if (isStatefulnessEnabled && appContentCache[cacheKey]) {
      setAppStates((prev) => ({
        ...prev,
        [app.id]: {...newAppState, llmContent: appContentCache[cacheKey]},
      }));
    } else {
      internalHandleLlmRequest(
        app.id,
        newHistory,
        currentMaxHistoryLength,
        language,
      );
    }
  };

  const handleAppOpen = (app: AppDefinition) => {
    const initialInteraction: InteractionData = {
      id: app.id,
      type: 'app_open',
      elementText: app.name,
      elementType: 'icon',
      appContext: app.id,
    };
    openAndActivateApp(app, initialInteraction);
  };

  const handleSearch = (query: string) => {
    const webApp = APP_DEFINITIONS_CONFIG.find(
      (app) => app.id === 'web_browser_app',
    );
    if (!webApp) return;

    const searchInteraction: InteractionData = {
      id: 'desktop_search_query',
      type: 'search',
      value: query,
      elementType: 'search_input',
      elementText: `Search for: ${query}`,
      appContext: webApp.id,
    };
    openAndActivateApp(webApp, searchInteraction);
  };

  const handleCloseAppView = () => {
    if (!activeAppId) return;
    const appToCloseId = activeAppId;

    // Persist maximized state upon closing
    const currentWindowState = windowStates[appToCloseId];
    if (currentWindowState && currentWindowState.isMaximized) {
      handleMaximize(); // This will restore and save the pre-maximized state
    }

    setOpenApps((prev) => prev.filter((app) => app.id !== appToCloseId));
    setAppStates((prev) => {
      const next = {...prev};
      delete next[appToCloseId];
      return next;
    });
    setActiveAppId(null);
  };

  const handleShowDesktop = () => {
    setActiveAppId(null);
  };

  const handleSwitchApp = (appId: string) => {
    setActiveAppId(appId);
  };

  const handleGoBack = () => {
    if (!activeAppId || !activeAppState) return;
    if (activeAppState.currentAppPath.length <= 1) return;

    const newPath = activeAppState.currentAppPath.slice(0, -1);
    const newHistory = activeAppState.interactionHistory.slice(1);
    const cacheKey = newPath.join('__');

    const newState = {
      ...activeAppState,
      currentAppPath: newPath,
      interactionHistory: newHistory,
      llmContent: '',
      error: null,
    };
    setAppStates((prev) => ({...prev, [activeAppId]: newState}));

    if (isStatefulnessEnabled && appContentCache[cacheKey]) {
      setAppStates((prev) => ({
        ...prev,
        [activeAppId]: {
          ...newState,
          llmContent: appContentCache[cacheKey],
          isLoading: false,
        },
      }));
    } else {
      internalHandleLlmRequest(
        activeAppId,
        newHistory,
        currentMaxHistoryLength,
        language,
      );
    }
  };

  const handleToggleParametersPanel = () => {
    setIsParametersOpen((prev) => {
      if (!prev) setActiveAppId(null); // Hide active app when opening params
      return !prev;
    });
  };

  const handleUpdateHistoryLength = (newLength: number) => {
    setCurrentMaxHistoryLength(newLength);
  };

  const handleSetStatefulness = (enabled: boolean) => {
    setIsStatefulnessEnabled(enabled);
    if (!enabled) setAppContentCache({});
  };

  const handleMinimize = () => {
    setActiveAppId(null);
  };

  const handleMaximize = () => {
    const container = mainContainerRef.current;
    if (!container || !activeAppId || !activeWindowState) return;

    setWindowStates((prev) => {
      const current = prev[activeAppId];
      if (current.isMaximized) {
        // Restore
        return {
          ...prev,
          [activeAppId]: {
            ...current,
            rect: current.preMaximizeRect || current.rect,
            isMaximized: false,
            preMaximizeRect: null,
          },
        };
      } else {
        // Maximize
        const newRect = {
          x: 0,
          y: 0,
          width: container.clientWidth,
          height: container.clientHeight,
        };
        return {
          ...prev,
          [activeAppId]: {
            ...current,
            rect: newRect,
            isMaximized: true,
            preMaximizeRect: current.rect,
          },
        };
      }
    });
  };

  const updateActiveWindowRect = useCallback(
    (updater: WindowRect | ((prev: WindowRect) => WindowRect)) => {
      if (!activeAppId) return;
      setWindowStates((prev) => {
        const current = prev[activeAppId];
        if (!current) return prev;
        const newRect =
          typeof updater === 'function' ? updater(current.rect) : updater;
        return {
          ...prev,
          [activeAppId]: {...current, rect: newRect},
        };
      });
    },
    [activeAppId],
  );

  const windowTitle = isParametersOpen
    ? 'Riyad My Computer'
    : activeApp
      ? activeApp.name
      : 'Riyad My Computer';

  return (
    <div className="w-full h-screen font-sans overflow-hidden">
      <main
        ref={mainContainerRef}
        className="desktop-wallpaper w-full h-full relative p-4 pb-16 overflow-hidden">
        {activeApp && activeWindowState && (
          <Window
            title={windowTitle}
            onClose={handleCloseAppView}
            isAppOpen={!!activeApp && !isParametersOpen}
            appId={activeApp?.id}
            onToggleParameters={handleToggleParametersPanel}
            onExitToDesktop={handleShowDesktop}
            isParametersPanelOpen={isParametersOpen}
            onGoBack={handleGoBack}
            canGoBack={
              !!activeAppState && activeAppState.currentAppPath.length > 1
            }
            rect={activeWindowState.rect}
            setRect={updateActiveWindowRect}
            containerRef={mainContainerRef}
            onMinimize={handleMinimize}
            onMaximize={handleMaximize}
            isMaximized={activeWindowState.isMaximized}
            isLoading={!!activeAppState?.isLoading}>
            <div className="w-full h-full bg-white">
              {isParametersOpen ? (
                <ParametersPanel
                  currentLength={currentMaxHistoryLength}
                  onUpdateHistoryLength={handleUpdateHistoryLength}
                  onClosePanel={handleToggleParametersPanel}
                  isStatefulnessEnabled={isStatefulnessEnabled}
                  onSetStatefulness={handleSetStatefulness}
                  currentLanguage={language}
                  onSetLanguage={setLanguage}
                />
              ) : !activeApp || !activeAppState ? (
                <DesktopView
                  onAppOpen={handleAppOpen}
                  onSearch={handleSearch}
                />
              ) : (
                <>
                  {/* Loading spinner: only shown on initial load when there's no content and no error */}
                  {activeAppState.isLoading &&
                    activeAppState.llmContent.length === 0 &&
                    !activeAppState.error && (
                      <div className="flex justify-center items-center h-full">
                        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
                      </div>
                    )}

                  {/* Error display: shown if an error occurs, mutually exclusive with content */}
                  {activeAppState.error ? (
                    <div className="p-4 text-red-700 bg-red-100 rounded-lg h-full overflow-y-auto">
                      <p className="font-bold text-lg">
                        Error Generating Content
                      </p>
                      <p className="mt-2">{activeAppState.error}</p>
                      <p className="mt-1 text-sm text-gray-600">
                        This may be due to an API key issue, network problem,
                        or misconfiguration. Please check the developer
                        console for more details.
                      </p>
                    </div>
                  ) : (
                    /* Content display: shown if there's no error */
                    /* The condition allows for streaming content to be displayed while still loading */
                    (!activeAppState.isLoading ||
                      activeAppState.llmContent) && (
                      <GeneratedContent
                        htmlContent={activeAppState.llmContent}
                        onInteract={handleInteraction}
                        appContext={activeApp.id}
                        isLoading={activeAppState.isLoading}
                      />
                    )
                  )}
                </>
              )}
            </div>
          </Window>
        )}
        {/* Render Desktop view when no app is active */}
        {!activeApp && !isParametersOpen && (
          <DesktopView onAppOpen={handleAppOpen} onSearch={handleSearch} />
        )}
        {/* Render parameters panel when it's open (it will appear inside a generic window) */}
        {isParametersOpen && (
          <Window
            title={windowTitle}
            onClose={handleToggleParametersPanel}
            isAppOpen={false}
            onToggleParameters={handleToggleParametersPanel}
            onExitToDesktop={handleShowDesktop}
            isParametersPanelOpen={isParametersOpen}
            onGoBack={() => {}}
            canGoBack={false}
            rect={{x: 100, y: 100, width: 600, height: 450}} // Default rect for params
            setRect={() => {}} // Non-movable
            containerRef={mainContainerRef}
            onMinimize={() => {}}
            onMaximize={() => {}}
            isMaximized={false}
            isLoading={false}>
            <ParametersPanel
              currentLength={currentMaxHistoryLength}
              onUpdateHistoryLength={handleUpdateHistoryLength}
              onClosePanel={handleToggleParametersPanel}
              isStatefulnessEnabled={isStatefulnessEnabled}
              onSetStatefulness={handleSetStatefulness}
              currentLanguage={language}
              onSetLanguage={setLanguage}
            />
          </Window>
        )}
      </main>
      <Taskbar
        openApps={openApps}
        activeAppId={activeAppId}
        onSwitchApp={handleSwitchApp}
        onGoHome={handleShowDesktop}
      />
    </div>
  );
};

export default App;