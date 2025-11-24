// Terminal Application - Command Line Interface

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

interface TerminalAppProps {
  windowId: string;
}

interface CommandHistory {
  id: string;
  command: string;
  output: string[];
  timestamp: Date;
  exitCode: number;
}

interface FileSystemItem {
  name: string;
  type: 'file' | 'directory';
  content?: string;
  children?: FileSystemItem[];
}

// Virtual file system for terminal
const virtualFS: FileSystemItem = {
  name: 'root',
  type: 'directory',
  children: [
    {
      name: 'home',
      type: 'directory',
      children: [
        {
          name: 'user',
          type: 'directory',
          children: [
            { name: 'documents', type: 'directory', children: [] },
            { name: 'downloads', type: 'directory', children: [] },
            { name: 'desktop', type: 'directory', children: [] },
            { name: 'welcome.txt', type: 'file', content: 'Welcome to WebOS Terminal!\nType "help" to see available commands.' },
            { name: 'readme.md', type: 'file', content: '# WebOS Terminal\n\nA virtual terminal interface for the WebOS environment.' }
          ]
        }
      ]
    },
    {
      name: 'bin',
      type: 'directory',
      children: [
        { name: 'ls', type: 'file', content: 'List directory contents' },
        { name: 'cd', type: 'file', content: 'Change directory' },
        { name: 'pwd', type: 'file', content: 'Print working directory' },
        { name: 'cat', type: 'file', content: 'Display file contents' },
        { name: 'help', type: 'file', content: 'Show help information' }
      ]
    },
    {
      name: 'etc',
      type: 'directory',
      children: [
        { name: 'version', type: 'file', content: 'WebOS Terminal v1.0.0' }
      ]
    }
  ]
};

export const TerminalApp: React.FC<TerminalAppProps> = ({ windowId }) => {
  const [history, setHistory] = useState<CommandHistory[]>([]);
  const [currentCommand, setCurrentCommand] = useState('');
  const [currentPath, setCurrentPath] = useState(['home', 'user']);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const getCurrentDirectory = (): FileSystemItem | null => {
    let current = virtualFS;
    for (const pathPart of currentPath) {
      const found = current.children?.find(item => item.name === pathPart && item.type === 'directory');
      if (!found) return null;
      current = found;
    }
    return current;
  };

  const resolvePath = (path: string): FileSystemItem | null => {
    if (path.startsWith('/')) {
      // Absolute path
      const parts = path.split('/').filter(p => p);
      let current = virtualFS;
      for (const part of parts) {
        if (part === '..') {
          // Go up one level (not implemented for root)
          continue;
        }
        const found = current.children?.find(item => item.name === part);
        if (!found) return null;
        current = found;
      }
      return current;
    } else {
      // Relative path
      const currentDir = getCurrentDirectory();
      if (!currentDir) return null;
      
      if (path === '.' || path === '') return currentDir;
      if (path === '..') {
        // Go up one level
        if (currentPath.length > 0) {
          const parentPath = currentPath.slice(0, -1);
          let current = virtualFS;
          for (const pathPart of parentPath) {
            const found = current.children?.find(item => item.name === pathPart && item.type === 'directory');
            if (!found) return null;
            current = found;
          }
          return current;
        }
        return virtualFS;
      }
      
      return currentDir.children?.find(item => item.name === path) || null;
    }
  };

  const executeCommand = (command: string): { output: string[]; exitCode: number } => {
    const parts = command.trim().split(/\s+/);
    const cmd = parts[0];
    const args = parts.slice(1);

    switch (cmd) {
      case 'help':
        return {
          output: [
            'Available commands:',
            '  ls [path]     - List directory contents',
            '  cd <path>     - Change directory',
            '  pwd           - Print working directory',
            '  cat <file>    - Display file contents',
            '  clear         - Clear terminal',
            '  echo <text>   - Display text',
            '  date          - Show current date and time',
            '  whoami        - Show current user',
            '  uname         - Show system information',
            '  history       - Show command history',
            '  help          - Show this help message',
            '',
            'Gesture Controls:',
            '  👆 Point up/down    - Scroll terminal',
            '  ✋ Swipe left/right - Navigate command history',
            '  👌 Pinch           - Zoom text size'
          ],
          exitCode: 0
        };

      case 'ls':
        const lsPath = args[0] || '.';
        const lsTarget = resolvePath(lsPath);
        if (!lsTarget) {
          return { output: [`ls: ${lsPath}: No such file or directory`], exitCode: 1 };
        }
        if (lsTarget.type === 'file') {
          return { output: [lsTarget.name], exitCode: 0 };
        }
        const items = lsTarget.children || [];
        const output = items.length === 0 ? ['(empty directory)'] : items.map(item => 
          item.type === 'directory' ? `📁 ${item.name}/` : `📄 ${item.name}`
        );
        return { output, exitCode: 0 };

      case 'cd':
        const cdPath = args[0];
        if (!cdPath) {
          setCurrentPath(['home', 'user']);
          return { output: [], exitCode: 0 };
        }
        
        if (cdPath === '..') {
          if (currentPath.length > 0) {
            setCurrentPath(currentPath.slice(0, -1));
          }
          return { output: [], exitCode: 0 };
        }
        
        const cdTarget = resolvePath(cdPath);
        if (!cdTarget) {
          return { output: [`cd: ${cdPath}: No such file or directory`], exitCode: 1 };
        }
        if (cdTarget.type !== 'directory') {
          return { output: [`cd: ${cdPath}: Not a directory`], exitCode: 1 };
        }
        
        if (cdPath.startsWith('/')) {
          const parts = cdPath.split('/').filter(p => p);
          setCurrentPath(parts);
        } else {
          if (cdPath === '.') {
            // Stay in current directory
          } else {
            setCurrentPath([...currentPath, cdPath]);
          }
        }
        return { output: [], exitCode: 0 };

      case 'pwd':
        return { output: [`/${currentPath.join('/')}`], exitCode: 0 };

      case 'cat':
        const catFile = args[0];
        if (!catFile) {
          return { output: ['cat: missing file operand'], exitCode: 1 };
        }
        const catTarget = resolvePath(catFile);
        if (!catTarget) {
          return { output: [`cat: ${catFile}: No such file or directory`], exitCode: 1 };
        }
        if (catTarget.type !== 'file') {
          return { output: [`cat: ${catFile}: Is a directory`], exitCode: 1 };
        }
        return { output: (catTarget.content || '').split('\n'), exitCode: 0 };

      case 'clear':
        setHistory([]);
        return { output: [], exitCode: 0 };

      case 'echo':
        return { output: [args.join(' ')], exitCode: 0 };

      case 'date':
        return { output: [new Date().toString()], exitCode: 0 };

      case 'whoami':
        return { output: ['webos-user'], exitCode: 0 };

      case 'uname':
        const flag = args[0];
        if (flag === '-a') {
          return { output: ['WebOS 1.0.0 webos-terminal x86_64 WebOS'], exitCode: 0 };
        }
        return { output: ['WebOS'], exitCode: 0 };

      case 'history':
        return { 
          output: commandHistory.map((cmd, i) => `${i + 1}  ${cmd}`), 
          exitCode: 0 
        };

      case '':
        return { output: [], exitCode: 0 };

      default:
        return { output: [`${cmd}: command not found`], exitCode: 127 };
    }
  };

  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCommand.trim()) return;

    const result = executeCommand(currentCommand);
    
    const historyEntry: CommandHistory = {
      id: Date.now().toString(),
      command: currentCommand,
      output: result.output,
      timestamp: new Date(),
      exitCode: result.exitCode
    };

    setHistory(prev => [...prev, historyEntry]);
    setCommandHistory(prev => [...prev, currentCommand]);
    setCurrentCommand('');
    setHistoryIndex(-1);

    // Scroll to bottom
    setTimeout(() => {
      if (terminalRef.current) {
        terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
      }
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyIndex < commandHistory.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setCurrentCommand(commandHistory[commandHistory.length - 1 - newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setCurrentCommand(commandHistory[commandHistory.length - 1 - newIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setCurrentCommand('');
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      // Simple tab completion for directories
      const currentDir = getCurrentDirectory();
      if (currentDir && currentCommand.trim()) {
        const matches = currentDir.children?.filter(item => 
          item.name.startsWith(currentCommand.trim())
        ) || [];
        if (matches.length === 1) {
          setCurrentCommand(matches[0].name + (matches[0].type === 'directory' ? '/' : ''));
        }
      }
    }
  };

  // Focus input when terminal is clicked
  const handleTerminalClick = () => {
    inputRef.current?.focus();
  };

  // Auto-focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const getPrompt = () => {
    return `webos-user@webos:/${currentPath.join('/')}$ `;
  };

  return (
    <div 
      className="h-full bg-black text-green-400 font-mono text-sm flex flex-col cursor-text"
      onClick={handleTerminalClick}
    >
      {/* Terminal Header */}
      <div className="flex items-center justify-between p-2 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span className="ml-2 text-white text-xs">Terminal - WebOS</span>
        </div>
        <div className="text-xs text-gray-400">
          {currentPath.length > 0 ? `/${currentPath.join('/')}` : '/'}
        </div>
      </div>

      {/* Terminal Content */}
      <div 
        ref={terminalRef}
        className="flex-1 overflow-y-auto p-4 space-y-1"
      >
        {/* Welcome Message */}
        {history.length === 0 && (
          <div className="mb-4">
            <div className="text-cyan-400">Welcome to WebOS Terminal v1.0.0</div>
            <div className="text-gray-400">Type 'help' for available commands.</div>
            <div className="text-gray-400">Use gestures for enhanced interaction!</div>
            <br />
          </div>
        )}

        {/* Command History */}
        {history.map((entry) => (
          <motion.div
            key={entry.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-1"
          >
            <div className="flex">
              <span className="text-cyan-400">{getPrompt()}</span>
              <span className="text-white">{entry.command}</span>
            </div>
            {entry.output.map((line, index) => (
              <div key={index} className={`ml-4 ${
                entry.exitCode !== 0 ? 'text-red-400' : 'text-green-400'
              }`}>
                {line}
              </div>
            ))}
          </motion.div>
        ))}

        {/* Current Command Input */}
        <form onSubmit={handleCommandSubmit} className="flex">
          <span className="text-cyan-400">{getPrompt()}</span>
          <input
            ref={inputRef}
            type="text"
            value={currentCommand}
            onChange={(e) => setCurrentCommand(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-white outline-none border-none"
            autoComplete="off"
            spellCheck={false}
          />
        </form>

        {/* Cursor */}
        <div className="flex">
          <span className="text-cyan-400">{getPrompt()}</span>
          <span className="text-white">{currentCommand}</span>
          <motion.span
            className="bg-green-400 w-2 h-5 inline-block ml-1"
            animate={{ opacity: [1, 0, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        </div>
      </div>

      {/* Gesture Hints */}
      <div className="p-2 border-t border-gray-700 bg-gray-800 text-xs text-gray-400">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span>👆 Scroll</span>
            <span>✋ History</span>
            <span>👌 Zoom</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>Commands: {commandHistory.length}</span>
            <span>•</span>
            <span>Exit Code: {history.length > 0 ? history[history.length - 1].exitCode : 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
