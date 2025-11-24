// File Manager Application - Virtual File System Browser

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { vfs, type VFSNode } from '../core/VirtualFileSystem';

interface FileManagerAppProps {
  windowId: string;
}

// Map VFSNode to local component state structure if needed, or use VFSNode directly
// For simplicity, we'll assume VFSNode is compatible enough or we'll adapt usage.
// However, the original code used `FileSystemItem` which seems to be a local interface that was missing.
// We'll define it here based on usage or adapt to use VFSNode.

// The original code used `initialFileSystem` which is also missing.
// We should fetch data from `vfs`.

type FileSystemItem = {
    id: string;
    name: string;
    type: 'file' | 'folder'; // VFS uses 'directory'
    parent?: string;
    content?: string;
    size?: number;
    modified: Date;
    icon?: string;
}

// Helper to convert VFSNode to FileSystemItem
const vfsNodeToItem = (node: VFSNode): FileSystemItem => ({
    id: node.id,
    name: node.name,
    type: node.type === 'directory' ? 'folder' : 'file',
    parent: node.parent,
    content: node.content,
    size: node.size,
    modified: node.modified,
    icon: getFileIcon(node)
});

const getFileIcon = (node: VFSNode): string => {
  if (node.type === 'directory') return '📁';
  
  const ext = node.name.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'txt': return '📄';
    case 'md': return '📝';
    case 'json': return '📋';
    case 'js':
    case 'ts': return '📜';
    case 'png':
    case 'jpg':
    case 'jpeg': return '🖼️';
    case 'zip': return '📦';
    case 'lnk': return '🔗';
    default: return '📄';
  }
};

export const FileManagerApp: React.FC<FileManagerAppProps> = ({ windowId }) => {
  // Use VFS to get initial state
  const [fileSystem, setFileSystem] = useState<FileSystemItem[]>([]);

  // Load initial data from VFS
  useEffect(() => {
    // This is a simplification. Ideally we'd traverse the whole VFS or just the current directory.
    // Since the original code expected a flat list of all items, we'll try to replicate that or adapt.
    // But `vfs` doesn't expose a "get all nodes" easily.
    // Let's assume we just want to show the root to start.

    // Actually, `vfs` is a singleton and has internal state. The original code was using a local state `fileSystem`.
    // Let's try to sync with VFS.

    // For now, let's just use what we have in VFS stats or similar?
    // Wait, the original code had `initialFileSystem` which was missing.
    // I will mock it for now to fix the build, but hooking it up to real VFS is better.

    // Let's create a fake initial file system based on VFS structure if possible,
    // or just defined here to fix the "Cannot find name 'initialFileSystem'" error.

    // Let's try to actually pull from VFS recursively to populate the view
    // This is a bit of a hack to adapt VFS to the existing flat-list-state component structure
    const allItems: FileSystemItem[] = [];
    const traverse = (path: string) => {
        const nodes = vfs.listDirectory(path);
        for (const node of nodes) {
            allItems.push(vfsNodeToItem(node));
            if (node.type === 'directory') {
                const nodePath = path === '/' ? `/${node.name}` : `${path}/${node.name}`;
                traverse(nodePath);
            }
        }
    }

    traverse('/');
    setFileSystem(allItems);

  }, []);

  const [currentPath, setCurrentPath] = useState<string[]>([]); // Array of IDs
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [showPreview, setShowPreview] = useState(false);
  const [previewItem, setPreviewItem] = useState<FileSystemItem | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; item?: FileSystemItem } | null>(null);

  const currentFolderId = currentPath.length > 0 ? currentPath[currentPath.length - 1] : undefined; // undefined for root if using flat list logic
  
  // If currentPath is empty, we are at root.
  // The original code used `!item.parent` for root items.
  // In VFS, root items (under /) have parent as root node ID probably?
  // Let's check VFS implementation.
  // VFS: createNode('/', 'directory', undefined, ''); -> Root node has NO parent.
  // VFS: createNode('home', 'directory', root.id, ''); -> Home has root.id as parent.

  // So if `currentFolderId` is null/undefined, we want items with parent = root.id?
  // Or items with parent = undefined?
  // The VFS root node has parent undefined. But we probably don't show the root node itself, but its children.
  // The children of root have parent = root.id.

  // We need to know the ID of the root node to find its children if we are at "root" path.
  // VFS doesn't expose root ID easily publicly, but `vfs.listDirectory('/')` works.

  // Let's rely on `vfs.listDirectory` logic instead of filtering a flat list `fileSystem` state?
  // That would be a bigger refactor.

  // Let's stick to fixing the compilation errors by defining the missing types and variables.

  const currentItems = fileSystem.filter(item => {
      if (currentFolderId) {
          return item.parent === currentFolderId;
      }
      // If no current folder (root), we want items that are children of the root directory.
      // In our `traverse` above, we added all items.
      // The items at root of VFS have parent = rootNode.id.
      // We don't have rootNode.id easily.
      // But wait, `vfs.listDirectory('/')` returns the nodes.
      // Let's assume we want to show items that don't have a parent in our *local* state view?
      // Or we can just fetch current items from VFS dynamically?

      // Let's change `currentItems` to be derived from VFS directly if possible, or just fix the filter.
      // If we use the flat list from `traverse`, we need to know the parent ID.
      // The items at the top level of `traverse('/')` have parent set to the ID of the root node.

      // Let's just fix the types for now and allow the logic to be a bit broken if it's too complex,
      // OR fix it properly.

      // The simplest fix for "Cannot find name 'initialFileSystem'" is to define it.
      return item.parent === currentFolderId || (!currentFolderId && !fileSystem.find(p => p.id === item.parent));
  });

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const navigateToFolder = (folderId: string) => {
    const folder = fileSystem.find(item => item.id === folderId);
    if (folder && folder.type === 'folder') {
      setCurrentPath([...currentPath, folderId]);
      setSelectedItems(new Set());
    }
  };

  const navigateUp = () => {
    if (currentPath.length > 0) {
      setCurrentPath(currentPath.slice(0, -1));
      setSelectedItems(new Set());
    }
  };

  const navigateToPath = (index: number) => {
    setCurrentPath(currentPath.slice(0, index + 1));
    setSelectedItems(new Set());
  };

  const handleItemClick = (item: FileSystemItem, event: React.MouseEvent) => {
    if (event.ctrlKey || event.metaKey) {
      // Multi-select
      const newSelected = new Set(selectedItems);
      if (newSelected.has(item.id)) {
        newSelected.delete(item.id);
      } else {
        newSelected.add(item.id);
      }
      setSelectedItems(newSelected);
    } else {
      // Single select or navigate
      if (item.type === 'folder') {
        navigateToFolder(item.id);
      } else {
        setSelectedItems(new Set([item.id]));
        setPreviewItem(item);
        setShowPreview(true);
      }
    }
  };

  const handleContextMenu = (event: React.MouseEvent, item?: FileSystemItem) => {
    event.preventDefault();
    setContextMenu({ x: event.clientX, y: event.clientY, item });
  };

  const createNewFolder = () => {
    const newFolder: FileSystemItem = {
      id: `folder_${Date.now()}`,
      name: 'New Folder',
      type: 'folder',
      modified: new Date(),
      parent: currentFolderId || undefined,
      icon: '📁'
    };
    setFileSystem([...fileSystem, newFolder]);
    setContextMenu(null);
  };

  const createNewFile = () => {
    const newFile: FileSystemItem = {
      id: `file_${Date.now()}`,
      name: 'New File.txt',
      type: 'file',
      size: 0,
      modified: new Date(),
      parent: currentFolderId || undefined,
      content: '',
      icon: '📄'
    };
    setFileSystem([...fileSystem, newFile]);
    setContextMenu(null);
  };

  const deleteItems = () => {
    const itemsToDelete = Array.from(selectedItems);
    setFileSystem(fileSystem.filter(item => !itemsToDelete.includes(item.id)));
    setSelectedItems(new Set());
    setContextMenu(null);
  };

  const renameItem = (itemId: string, newName: string) => {
    setFileSystem(fileSystem.map(item => 
      item.id === itemId ? { ...item, name: newName } : item
    ));
  };

  // Close context menu when clicking elsewhere
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  return (
    <div className="h-full bg-white dark:bg-gray-900 flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center space-x-2">
          <button
            onClick={navigateUp}
            disabled={currentPath.length === 0}
            className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Go up"
          >
            ⬆️
          </button>
          
          {/* Breadcrumb */}
          <div className="flex items-center space-x-1 text-sm">
            <button
              onClick={() => setCurrentPath([])}
              className="px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
            >
              Home
            </button>
            {currentPath.map((folderId, index) => {
              const folder = fileSystem.find(item => item.id === folderId);
              return (
                <React.Fragment key={folderId}>
                  <span className="text-gray-400">/</span>
                  <button
                    onClick={() => navigateToPath(index)}
                    className="px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                  >
                    {folder?.name}
                  </button>
                </React.Fragment>
              );
            })}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
            className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
            title={`Switch to ${viewMode === 'list' ? 'grid' : 'list'} view`}
          >
            {viewMode === 'list' ? '⊞' : '☰'}
          </button>
          
          <button
            onClick={(e) => handleContextMenu(e)}
            className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
            title="New"
          >
            ➕
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Main Content */}
        <div 
          className="flex-1 overflow-auto p-4"
          onContextMenu={(e) => handleContextMenu(e)}
        >
          {currentItems.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
              <div className="text-center">
                <div className="text-6xl mb-4">📁</div>
                <p>This folder is empty</p>
                <p className="text-sm mt-2">Right-click to create new files or folders</p>
              </div>
            </div>
          ) : (
            <div className={viewMode === 'grid' ? 'grid grid-cols-4 gap-4' : 'space-y-1'}>
              {currentItems.map((item) => (
                <motion.div
                  key={item.id}
                  className={`${
                    viewMode === 'grid' 
                      ? 'p-3 rounded-lg text-center' 
                      : 'flex items-center space-x-3 p-2 rounded'
                  } cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 ${
                    selectedItems.has(item.id) ? 'bg-blue-100 dark:bg-blue-900' : ''
                  }`}
                  onClick={(e) => handleItemClick(item, e)}
                  onContextMenu={(e) => handleContextMenu(e, item)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {viewMode === 'grid' ? (
                    <>
                      <div className="text-4xl mb-2">{item.icon}</div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {item.name}
                      </div>
                      {item.type === 'file' && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {formatFileSize(item.size)}
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="text-2xl">{item.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 dark:text-white truncate">
                          {item.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(item.modified)}
                        </div>
                      </div>
                      {item.type === 'file' && (
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {formatFileSize(item.size)}
                        </div>
                      )}
                    </>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Preview Panel */}
        <AnimatePresence>
          {showPreview && previewItem && (
            <motion.div
              className="w-80 border-l border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-4"
              initial={{ x: 320 }}
              animate={{ x: 0 }}
              exit={{ x: 320 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 dark:text-white">Preview</h3>
                <button
                  onClick={() => setShowPreview(false)}
                  className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-6xl mb-2">{previewItem.icon}</div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {previewItem.name}
                  </div>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Type:</span>
                    <span className="text-gray-900 dark:text-white capitalize">{previewItem.type}</span>
                  </div>
                  {previewItem.size && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Size:</span>
                      <span className="text-gray-900 dark:text-white">{formatFileSize(previewItem.size)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Modified:</span>
                    <span className="text-gray-900 dark:text-white">{formatDate(previewItem.modified)}</span>
                  </div>
                </div>
                
                {previewItem.content && (
                  <div>
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Content:</div>
                    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded p-3 text-sm text-gray-900 dark:text-white max-h-40 overflow-auto">
                      <pre className="whitespace-pre-wrap">{previewItem.content}</pre>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Context Menu */}
      <AnimatePresence>
        {contextMenu && (
          <motion.div
            className="fixed bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-2 z-50"
            style={{ left: contextMenu.x, top: contextMenu.y }}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            {!contextMenu.item ? (
              // Background context menu
              <>
                <button
                  onClick={createNewFolder}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white"
                >
                  📁 New Folder
                </button>
                <button
                  onClick={createNewFile}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white"
                >
                  📄 New File
                </button>
              </>
            ) : (
              // Item context menu
              <>
                <button
                  onClick={() => {
                    if (contextMenu.item?.type === 'folder') {
                      navigateToFolder(contextMenu.item.id);
                    } else if (contextMenu.item) {
                      setPreviewItem(contextMenu.item);
                      setShowPreview(true);
                    }
                    setContextMenu(null);
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {contextMenu.item.type === 'folder' ? '📂 Open' : '👁️ Preview'}
                </button>
                <button
                  onClick={() => {
                    const newName = prompt('Enter new name:', contextMenu.item?.name);
                    if (newName && contextMenu.item) {
                      renameItem(contextMenu.item.id, newName);
                    }
                    setContextMenu(null);
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white"
                >
                  ✏️ Rename
                </button>
                <div className="border-t border-gray-200 dark:border-gray-600 my-1"></div>
                <button
                  onClick={() => {
                    if (contextMenu.item) {
                      setSelectedItems(new Set([contextMenu.item.id]));
                      deleteItems();
                    }
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-red-100 dark:hover:bg-red-900 text-red-600 dark:text-red-400"
                >
                  🗑️ Delete
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Status Bar */}
      <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-600 dark:text-gray-400">
        {selectedItems.size > 0 ? (
          `${selectedItems.size} item${selectedItems.size > 1 ? 's' : ''} selected`
        ) : (
          `${currentItems.length} item${currentItems.length !== 1 ? 's' : ''}`
        )}
      </div>
    </div>
  );
};
