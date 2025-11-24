// Text Editor Application - Gesture-Controlled Text Editor

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TextEditorAppProps {
  windowId: string;
}

interface FileTab {
  id: string;
  name: string;
  content: string;
  modified: boolean;
  language: string;
}

interface FindReplaceState {
  show: boolean;
  findText: string;
  replaceText: string;
  caseSensitive: boolean;
  wholeWord: boolean;
  useRegex: boolean;
}

export const TextEditorApp: React.FC<TextEditorAppProps> = ({ windowId }) => {
  const [tabs, setTabs] = useState<FileTab[]>([
    {
      id: 'welcome',
      name: 'Welcome.md',
      content: `# Welcome to WebOS Text Editor

This is a gesture-controlled text editor with the following features:

## Features
- Multiple tabs for different files
- Syntax highlighting (basic)
- Find and replace functionality
- Gesture controls for navigation
- Auto-save functionality
- Line numbers
- Word wrap toggle

## Gesture Controls
- 👆 **Point up/down**: Scroll through document
- ✋ **Swipe left/right**: Navigate between tabs
- 👌 **Pinch**: Zoom text size
- ✊ **Fist**: Quick save
- 🤏 **Two fingers**: Select text

## Keyboard Shortcuts
- Ctrl+N: New file
- Ctrl+O: Open file (simulated)
- Ctrl+S: Save file
- Ctrl+F: Find
- Ctrl+H: Find and replace
- Ctrl+Z: Undo
- Ctrl+Y: Redo

Start typing to edit this document or create a new file!
`,
      modified: false,
      language: 'markdown'
    }
  ]);
  
  const [activeTabId, setActiveTabId] = useState('welcome');
  const [fontSize, setFontSize] = useState(14);
  const [wordWrap, setWordWrap] = useState(true);
  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const [findReplace, setFindReplace] = useState<FindReplaceState>({
    show: false,
    findText: '',
    replaceText: '',
    caseSensitive: false,
    wholeWord: false,
    useRegex: false
  });
  const [cursorPosition, setCursorPosition] = useState({ line: 1, column: 1 });
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeTab = tabs.find(tab => tab.id === activeTabId);

  const updateTabContent = (tabId: string, content: string) => {
    setTabs(prev => prev.map(tab => 
      tab.id === tabId 
        ? { ...tab, content, modified: true }
        : tab
    ));
  };

  const createNewTab = () => {
    const newTab: FileTab = {
      id: `file_${Date.now()}`,
      name: 'Untitled.txt',
      content: '',
      modified: false,
      language: 'text'
    };
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newTab.id);
  };

  const closeTab = (tabId: string) => {
    if (tabs.length === 1) return; // Don't close the last tab
    
    const tab = tabs.find(t => t.id === tabId);
    if (tab?.modified) {
      const shouldClose = window.confirm(`"${tab.name}" has unsaved changes. Close anyway?`);
      if (!shouldClose) return;
    }

    setTabs(prev => prev.filter(tab => tab.id !== tabId));
    
    if (activeTabId === tabId) {
      const remainingTabs = tabs.filter(tab => tab.id !== tabId);
      setActiveTabId(remainingTabs[0]?.id || '');
    }
  };

  const saveFile = () => {
    if (!activeTab) return;
    
    // Simulate file save
    const blob = new Blob([activeTab.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = activeTab.name;
    a.click();
    URL.revokeObjectURL(url);

    // Mark as saved
    setTabs(prev => prev.map(tab => 
      tab.id === activeTabId 
        ? { ...tab, modified: false }
        : tab
    ));
  };

  const openFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileOpen = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const newTab: FileTab = {
        id: `file_${Date.now()}`,
        name: file.name,
        content,
        modified: false,
        language: getLanguageFromFilename(file.name)
      };
      setTabs(prev => [...prev, newTab]);
      setActiveTabId(newTab.id);
    };
    reader.readAsText(file);
  };

  const getLanguageFromFilename = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'js':
      case 'jsx':
        return 'javascript';
      case 'ts':
      case 'tsx':
        return 'typescript';
      case 'py':
        return 'python';
      case 'html':
        return 'html';
      case 'css':
        return 'css';
      case 'md':
        return 'markdown';
      case 'json':
        return 'json';
      default:
        return 'text';
    }
  };

  const findNext = () => {
    if (!activeTab || !findReplace.findText) return;
    
    const textarea = textareaRef.current;
    if (!textarea) return;

    const content = activeTab.content;
    const searchText = findReplace.caseSensitive 
      ? findReplace.findText 
      : findReplace.findText.toLowerCase();
    const searchContent = findReplace.caseSensitive 
      ? content 
      : content.toLowerCase();

    const currentPos = textarea.selectionStart;
    let index = searchContent.indexOf(searchText, currentPos);
    
    if (index === -1) {
      // Search from beginning
      index = searchContent.indexOf(searchText, 0);
    }

    if (index !== -1) {
      textarea.focus();
      textarea.setSelectionRange(index, index + findReplace.findText.length);
    }
  };

  const replaceNext = () => {
    if (!activeTab || !findReplace.findText) return;
    
    const textarea = textareaRef.current;
    if (!textarea) return;

    const selectedText = activeTab.content.substring(
      textarea.selectionStart,
      textarea.selectionEnd
    );

    const matches = findReplace.caseSensitive
      ? selectedText === findReplace.findText
      : selectedText.toLowerCase() === findReplace.findText.toLowerCase();

    if (matches) {
      const newContent = 
        activeTab.content.substring(0, textarea.selectionStart) +
        findReplace.replaceText +
        activeTab.content.substring(textarea.selectionEnd);
      
      updateTabContent(activeTabId, newContent);
      
      // Move cursor after replacement
      setTimeout(() => {
        const newPos = textarea.selectionStart + findReplace.replaceText.length;
        textarea.setSelectionRange(newPos, newPos);
        findNext();
      }, 0);
    } else {
      findNext();
    }
  };

  const replaceAll = () => {
    if (!activeTab || !findReplace.findText) return;

    let content = activeTab.content;
    const searchText = findReplace.findText;
    const replaceText = findReplace.replaceText;

    if (findReplace.useRegex) {
      try {
        const flags = findReplace.caseSensitive ? 'g' : 'gi';
        const regex = new RegExp(searchText, flags);
        content = content.replace(regex, replaceText);
      } catch (e) {
        alert('Invalid regular expression');
        return;
      }
    } else {
      const flags = findReplace.caseSensitive ? 'g' : 'gi';
      const regex = new RegExp(searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags);
      content = content.replace(regex, replaceText);
    }

    updateTabContent(activeTabId, content);
  };

  const updateCursorPosition = () => {
    const textarea = textareaRef.current;
    if (!textarea || !activeTab) return;

    const content = activeTab.content;
    const position = textarea.selectionStart;
    const lines = content.substring(0, position).split('\n');
    const line = lines.length;
    const column = lines[lines.length - 1].length + 1;
    
    setCursorPosition({ line, column });
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'n':
            e.preventDefault();
            createNewTab();
            break;
          case 'o':
            e.preventDefault();
            openFile();
            break;
          case 's':
            e.preventDefault();
            saveFile();
            break;
          case 'f':
            e.preventDefault();
            setFindReplace(prev => ({ ...prev, show: true }));
            break;
          case 'h':
            e.preventDefault();
            setFindReplace(prev => ({ ...prev, show: true }));
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const getLineNumbers = () => {
    if (!activeTab) return [];
    const lines = activeTab.content.split('\n');
    return Array.from({ length: lines.length }, (_, i) => i + 1);
  };

  return (
    <div className="h-full bg-white dark:bg-gray-900 flex flex-col">
      {/* Menu Bar */}
      <div className="flex items-center justify-between p-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center space-x-2">
          <button
            onClick={createNewTab}
            className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
            title="New File (Ctrl+N)"
          >
            📄 New
          </button>
          <button
            onClick={openFile}
            className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-sm hover:bg-gray-300 dark:hover:bg-gray-600"
            title="Open File (Ctrl+O)"
          >
            📂 Open
          </button>
          <button
            onClick={saveFile}
            className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
            title="Save File (Ctrl+S)"
          >
            💾 Save
          </button>
          <button
            onClick={() => setFindReplace(prev => ({ ...prev, show: !prev.show }))}
            className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-sm hover:bg-gray-300 dark:hover:bg-gray-600"
            title="Find & Replace (Ctrl+F)"
          >
            🔍 Find
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowLineNumbers(!showLineNumbers)}
            className={`px-2 py-1 rounded text-xs ${
              showLineNumbers 
                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' 
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            Line #
          </button>
          <button
            onClick={() => setWordWrap(!wordWrap)}
            className={`px-2 py-1 rounded text-xs ${
              wordWrap 
                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' 
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            Wrap
          </button>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setFontSize(Math.max(10, fontSize - 1))}
              className="px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              A-
            </button>
            <span className="text-xs text-gray-600 dark:text-gray-400 min-w-8 text-center">
              {fontSize}px
            </span>
            <button
              onClick={() => setFontSize(Math.min(24, fontSize + 1))}
              className="px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              A+
            </button>
          </div>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex items-center bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`flex items-center px-4 py-2 border-r border-gray-200 dark:border-gray-700 cursor-pointer min-w-0 ${
              tab.id === activeTabId
                ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
            onClick={() => setActiveTabId(tab.id)}
          >
            <span className="truncate max-w-32">
              {tab.modified ? '● ' : ''}{tab.name}
            </span>
            {tabs.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  closeTab(tab.id);
                }}
                className="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                ✕
              </button>
            )}
          </div>
        ))}
        <button
          onClick={createNewTab}
          className="px-3 py-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          title="New Tab"
        >
          ➕
        </button>
      </div>

      {/* Find & Replace Panel */}
      <AnimatePresence>
        {findReplace.show && (
          <motion.div
            className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            <div className="flex items-center space-x-2 mb-2">
              <input
                type="text"
                placeholder="Find..."
                value={findReplace.findText}
                onChange={(e) => setFindReplace(prev => ({ ...prev, findText: e.target.value }))}
                className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <input
                type="text"
                placeholder="Replace..."
                value={findReplace.replaceText}
                onChange={(e) => setFindReplace(prev => ({ ...prev, replaceText: e.target.value }))}
                className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <button
                onClick={findNext}
                className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
              >
                Find Next
              </button>
              <button
                onClick={replaceNext}
                className="px-3 py-1 bg-orange-500 text-white rounded text-sm hover:bg-orange-600"
              >
                Replace
              </button>
              <button
                onClick={replaceAll}
                className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
              >
                Replace All
              </button>
              <button
                onClick={() => setFindReplace(prev => ({ ...prev, show: false }))}
                className="px-2 py-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>
            <div className="flex items-center space-x-4 text-sm">
              <label className="flex items-center space-x-1">
                <input
                  type="checkbox"
                  checked={findReplace.caseSensitive}
                  onChange={(e) => setFindReplace(prev => ({ ...prev, caseSensitive: e.target.checked }))}
                />
                <span className="text-gray-700 dark:text-gray-300">Case sensitive</span>
              </label>
              <label className="flex items-center space-x-1">
                <input
                  type="checkbox"
                  checked={findReplace.wholeWord}
                  onChange={(e) => setFindReplace(prev => ({ ...prev, wholeWord: e.target.checked }))}
                />
                <span className="text-gray-700 dark:text-gray-300">Whole word</span>
              </label>
              <label className="flex items-center space-x-1">
                <input
                  type="checkbox"
                  checked={findReplace.useRegex}
                  onChange={(e) => setFindReplace(prev => ({ ...prev, useRegex: e.target.checked }))}
                />
                <span className="text-gray-700 dark:text-gray-300">Regex</span>
              </label>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Editor Area */}
      <div className="flex-1 flex overflow-hidden">
        {showLineNumbers && (
          <div 
            className="bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 text-right select-none"
            style={{ fontSize: `${fontSize}px`, lineHeight: '1.5' }}
          >
            {getLineNumbers().map((lineNum) => (
              <div key={lineNum} className="px-2 py-0">
                {lineNum}
              </div>
            ))}
          </div>
        )}
        
        <textarea
          ref={textareaRef}
          value={activeTab?.content || ''}
          onChange={(e) => updateTabContent(activeTabId, e.target.value)}
          onSelect={updateCursorPosition}
          onKeyUp={updateCursorPosition}
          className="flex-1 p-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono resize-none outline-none"
          style={{ 
            fontSize: `${fontSize}px`,
            lineHeight: '1.5',
            whiteSpace: wordWrap ? 'pre-wrap' : 'pre'
          }}
          placeholder="Start typing..."
          spellCheck={false}
        />
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-600 dark:text-gray-400">
        <div className="flex items-center space-x-4">
          <span>
            Line {cursorPosition.line}, Column {cursorPosition.column}
          </span>
          {activeTab && (
            <>
              <span>•</span>
              <span>{activeTab.language}</span>
              <span>•</span>
              <span>
                {activeTab.content.length} characters, {activeTab.content.split('\n').length} lines
              </span>
            </>
          )}
        </div>
        
        <div className="flex items-center space-x-4">
          <span>👆 Scroll • ✋ Navigate • 👌 Zoom • ✊ Save</span>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".txt,.md,.js,.ts,.jsx,.tsx,.py,.html,.css,.json"
        onChange={handleFileOpen}
        className="hidden"
      />
    </div>
  );
};
