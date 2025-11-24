// Web Browser Application - Gesture-Controlled Browser

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

interface WebBrowserAppProps {
  windowId: string;
}

interface BookmarkItem {
  id: string;
  title: string;
  url: string;
  favicon?: string;
}

interface HistoryItem {
  id: string;
  title: string;
  url: string;
  timestamp: Date;
}

const defaultBookmarks: BookmarkItem[] = [
  { id: '1', title: 'Google', url: 'https://www.google.com', favicon: '🔍' },
  { id: '2', title: 'GitHub', url: 'https://github.com', favicon: '🐙' },
  { id: '3', title: 'MDN Web Docs', url: 'https://developer.mozilla.org', favicon: '📚' },
  { id: '4', title: 'Stack Overflow', url: 'https://stackoverflow.com', favicon: '📋' },
  { id: '5', title: 'WebOS Demo', url: 'https://example.com', favicon: '👋' },
];

export const WebBrowserApp: React.FC<WebBrowserAppProps> = ({ windowId }) => {
  const [currentUrl, setCurrentUrl] = useState('https://www.google.com');
  const [addressBarUrl, setAddressBarUrl] = useState('https://www.google.com');
  const [isLoading, setIsLoading] = useState(false);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>(defaultBookmarks);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [zoomLevel, setZoomLevel] = useState(100);
  
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const historyStack = useRef<string[]>([]);
  const historyIndex = useRef(-1);

  const navigateToUrl = (url: string) => {
    let fullUrl = url;
    
    // Add protocol if missing
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      if (url.includes('.') && !url.includes(' ')) {
        fullUrl = `https://${url}`;
      } else {
        // Treat as search query
        fullUrl = `https://www.google.com/search?q=${encodeURIComponent(url)}`;
      }
    }

    setIsLoading(true);
    setCurrentUrl(fullUrl);
    setAddressBarUrl(fullUrl);

    // Add to history
    if (historyIndex.current === -1 || historyStack.current[historyIndex.current] !== fullUrl) {
      historyStack.current = historyStack.current.slice(0, historyIndex.current + 1);
      historyStack.current.push(fullUrl);
      historyIndex.current = historyStack.current.length - 1;
    }

    // Add to browsing history
    const historyItem: HistoryItem = {
      id: Date.now().toString(),
      title: getDomainFromUrl(fullUrl),
      url: fullUrl,
      timestamp: new Date()
    };
    setHistory(prev => [historyItem, ...prev.slice(0, 49)]); // Keep last 50 items

    updateNavigationButtons();
  };

  const goBack = () => {
    if (canGoBack && historyIndex.current > 0) {
      historyIndex.current--;
      const url = historyStack.current[historyIndex.current];
      setCurrentUrl(url);
      setAddressBarUrl(url);
      updateNavigationButtons();
    }
  };

  const goForward = () => {
    if (canGoForward && historyIndex.current < historyStack.current.length - 1) {
      historyIndex.current++;
      const url = historyStack.current[historyIndex.current];
      setCurrentUrl(url);
      setAddressBarUrl(url);
      updateNavigationButtons();
    }
  };

  const refresh = () => {
    setIsLoading(true);
    if (iframeRef.current) {
      iframeRef.current.src = currentUrl;
    }
  };

  const updateNavigationButtons = () => {
    setCanGoBack(historyIndex.current > 0);
    setCanGoForward(historyIndex.current < historyStack.current.length - 1);
  };

  const getDomainFromUrl = (url: string) => {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  };

  const handleAddressBarSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigateToUrl(addressBarUrl);
  };

  const addBookmark = () => {
    const title = prompt('Bookmark title:', getDomainFromUrl(currentUrl));
    if (title) {
      const newBookmark: BookmarkItem = {
        id: Date.now().toString(),
        title,
        url: currentUrl,
        favicon: '🔖'
      };
      setBookmarks(prev => [...prev, newBookmark]);
    }
  };

  const removeBookmark = (id: string) => {
    setBookmarks(prev => prev.filter(b => b.id !== id));
  };

  const handleZoom = (direction: 'in' | 'out' | 'reset') => {
    if (direction === 'in' && zoomLevel < 200) {
      setZoomLevel(prev => prev + 25);
    } else if (direction === 'out' && zoomLevel > 50) {
      setZoomLevel(prev => prev - 25);
    } else if (direction === 'reset') {
      setZoomLevel(100);
    }
  };

  // Initialize with first URL
  useEffect(() => {
    navigateToUrl(currentUrl);
  }, []);

  return (
    <div className="h-full bg-white dark:bg-gray-900 flex flex-col">
      {/* Navigation Bar */}
      <div className="flex items-center space-x-2 p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        {/* Navigation Buttons */}
        <div className="flex items-center space-x-1">
          <button
            onClick={goBack}
            disabled={!canGoBack}
            className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Go back"
          >
            ⬅️
          </button>
          <button
            onClick={goForward}
            disabled={!canGoForward}
            className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Go forward"
          >
            ➡️
          </button>
          <button
            onClick={refresh}
            className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
            title="Refresh"
          >
            {isLoading ? '⏳' : '🔄'}
          </button>
        </div>

        {/* Address Bar */}
        <form onSubmit={handleAddressBarSubmit} className="flex-1">
          <input
            type="text"
            value={addressBarUrl}
            onChange={(e) => setAddressBarUrl(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter URL or search..."
          />
        </form>

        {/* Action Buttons */}
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setShowBookmarks(!showBookmarks)}
            className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
            title="Bookmarks"
          >
            ⭐
          </button>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
            title="History"
          >
            📚
          </button>
          <button
            onClick={addBookmark}
            className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
            title="Add bookmark"
          >
            ➕
          </button>
        </div>
      </div>

      {/* Bookmarks/History Bar */}
      {(showBookmarks || showHistory) && (
        <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          {showBookmarks && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-900 dark:text-white">Bookmarks</h3>
                <button
                  onClick={() => setShowBookmarks(false)}
                  className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  ✕
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {bookmarks.map((bookmark) => (
                  <div
                    key={bookmark.id}
                    className="flex items-center space-x-1 px-2 py-1 bg-white dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 group"
                  >
                    <button
                      onClick={() => navigateToUrl(bookmark.url)}
                      className="flex items-center space-x-1 text-sm text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                    >
                      <span>{bookmark.favicon}</span>
                      <span>{bookmark.title}</span>
                    </button>
                    <button
                      onClick={() => removeBookmark(bookmark.id)}
                      className="text-xs text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {showHistory && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-900 dark:text-white">History</h3>
                <button
                  onClick={() => setShowHistory(false)}
                  className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  ✕
                </button>
              </div>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {history.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">No history yet</p>
                ) : (
                  history.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => navigateToUrl(item.url)}
                      className="flex items-center justify-between w-full p-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                    >
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {item.title}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {item.url}
                        </div>
                      </div>
                      <div className="text-xs text-gray-400">
                        {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Browser Content */}
      <div className="flex-1 relative bg-white">
        <iframe
          ref={iframeRef}
          src={currentUrl}
          className="w-full h-full border-0"
          style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top left' }}
          onLoad={() => setIsLoading(false)}
          title="Web Browser Content"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
        />

        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin text-4xl mb-2">⏳</div>
              <p className="text-gray-600">Loading...</p>
            </div>
          </div>
        )}

        {/* Gesture Hints Overlay */}
        <div className="absolute top-4 right-4 bg-black bg-opacity-75 text-white p-3 rounded-lg text-sm max-w-xs">
          <h4 className="font-semibold mb-2">Gesture Controls:</h4>
          <ul className="space-y-1 text-xs">
            <li className="flex items-center space-x-2">
              <span>👌</span>
              <span>Pinch to zoom in/out</span>
            </li>
            <li className="flex items-center space-x-2">
              <span>👆</span>
              <span>Point to scroll</span>
            </li>
            <li className="flex items-center space-x-2">
              <span>✋</span>
              <span>Swipe left/right for back/forward</span>
            </li>
            <li className="flex items-center space-x-2">
              <span>✊</span>
              <span>Fist to refresh page</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm">
        <div className="flex items-center space-x-4">
          <span className="text-gray-600 dark:text-gray-400">
            {getDomainFromUrl(currentUrl)}
          </span>
          {isLoading && (
            <span className="text-blue-600 dark:text-blue-400">Loading...</span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-gray-600 dark:text-gray-400">Zoom:</span>
          <button
            onClick={() => handleZoom('out')}
            className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            -
          </button>
          <span className="text-gray-900 dark:text-white min-w-12 text-center">
            {zoomLevel}%
          </span>
          <button
            onClick={() => handleZoom('in')}
            className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            +
          </button>
          <button
            onClick={() => handleZoom('reset')}
            className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
};
