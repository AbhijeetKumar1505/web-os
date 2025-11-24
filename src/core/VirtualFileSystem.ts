// Virtual File System - Shared storage for WebOS applications

export interface VFSNode {
  id: string;
  name: string;
  type: 'file' | 'directory';
  parent?: string;
  content?: string;
  size: number;
  created: Date;
  modified: Date;
  permissions: {
    read: boolean;
    write: boolean;
    execute: boolean;
  };
  metadata: Record<string, any>;
}

export interface VFSEvent {
  type: 'created' | 'modified' | 'deleted' | 'moved';
  path: string;
  node: VFSNode;
  timestamp: Date;
}

export class VirtualFileSystem {
  private nodes: Map<string, VFSNode> = new Map();
  private pathIndex: Map<string, string> = new Map(); // path -> nodeId
  private listeners: ((event: VFSEvent) => void)[] = [];
  private nextId = 1;

  constructor() {
    this.initializeDefaultStructure();
  }

  private initializeDefaultStructure(): void {
    // Create root directory
    const root = this.createNode('/', 'directory', undefined, '');
    
    // Create standard directories
    const home = this.createNode('home', 'directory', root.id, '');
    const user = this.createNode('user', 'directory', home.id, '');
    const documents = this.createNode('Documents', 'directory', user.id, '');
    const downloads = this.createNode('Downloads', 'directory', user.id, '');
    const desktop = this.createNode('Desktop', 'directory', user.id, '');
    const pictures = this.createNode('Pictures', 'directory', user.id, '');
    
    // Create system directories
    const bin = this.createNode('bin', 'directory', root.id, '');
    const etc = this.createNode('etc', 'directory', root.id, '');
    const tmp = this.createNode('tmp', 'directory', root.id, '');
    
    // Create some sample files
    this.createNode('welcome.txt', 'file', documents.id, 
      'Welcome to WebOS!\n\nThis is a shared file system that all applications can access.\nFiles created in one app can be opened in another.');
    
    this.createNode('readme.md', 'file', documents.id,
      '# WebOS File System\n\nThis virtual file system allows applications to:\n- Share data between apps\n- Persist user files\n- Maintain a consistent directory structure\n\n## Features\n- Real-time file watching\n- Permissions system\n- Metadata support\n- Event notifications');
    
    this.createNode('settings.json', 'file', etc.id,
      JSON.stringify({
        theme: 'auto',
        handTracking: {
          enabled: true,
          sensitivity: 0.8
        },
        apps: {
          autoSave: true,
          defaultEditor: 'texteditor'
        }
      }, null, 2));
  }

  private createNode(name: string, type: 'file' | 'directory', parentId?: string, content: string = ''): VFSNode {
    const node: VFSNode = {
      id: `node_${this.nextId++}`,
      name,
      type,
      parent: parentId,
      content,
      size: type === 'file' ? content.length : 0,
      created: new Date(),
      modified: new Date(),
      permissions: {
        read: true,
        write: true,
        execute: type === 'directory'
      },
      metadata: {}
    };

    this.nodes.set(node.id, node);
    
    // Update path index
    const path = this.getNodePath(node);
    this.pathIndex.set(path, node.id);

    this.emitEvent('created', path, node);
    return node;
  }

  private getNodePath(node: VFSNode): string {
    if (!node.parent) return node.name === '/' ? '/' : `/${node.name}`;
    
    const parent = this.nodes.get(node.parent);
    if (!parent) return `/${node.name}`;
    
    const parentPath = this.getNodePath(parent);
    return parentPath === '/' ? `/${node.name}` : `${parentPath}/${node.name}`;
  }

  private emitEvent(type: VFSEvent['type'], path: string, node: VFSNode): void {
    const event: VFSEvent = {
      type,
      path,
      node: { ...node }, // Clone to prevent mutations
      timestamp: new Date()
    };
    
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('VFS event listener error:', error);
      }
    });
  }

  // Public API
  
  readFile(path: string): string | null {
    const nodeId = this.pathIndex.get(path);
    if (!nodeId) return null;
    
    const node = this.nodes.get(nodeId);
    if (!node || node.type !== 'file' || !node.permissions.read) return null;
    
    return node.content || '';
  }

  writeFile(path: string, content: string): boolean {
    const nodeId = this.pathIndex.get(path);
    
    if (nodeId) {
      // Update existing file
      const node = this.nodes.get(nodeId);
      if (!node || node.type !== 'file' || !node.permissions.write) return false;
      
      node.content = content;
      node.size = content.length;
      node.modified = new Date();
      
      this.emitEvent('modified', path, node);
      return true;
    } else {
      // Create new file
      const pathParts = path.split('/').filter(p => p);
      const fileName = pathParts.pop();
      const dirPath = pathParts.length > 0 ? `/${pathParts.join('/')}` : '/';
      
      const parentId = this.pathIndex.get(dirPath);
      if (!parentId || !fileName) return false;
      
      const parent = this.nodes.get(parentId);
      if (!parent || parent.type !== 'directory') return false;
      
      this.createNode(fileName, 'file', parentId, content);
      return true;
    }
  }

  deleteFile(path: string): boolean {
    const nodeId = this.pathIndex.get(path);
    if (!nodeId) return false;
    
    const node = this.nodes.get(nodeId);
    if (!node || !node.permissions.write) return false;
    
    // Remove from indexes
    this.nodes.delete(nodeId);
    this.pathIndex.delete(path);
    
    // Remove children if directory
    if (node.type === 'directory') {
      this.removeChildrenRecursive(nodeId);
    }
    
    this.emitEvent('deleted', path, node);
    return true;
  }

  private removeChildrenRecursive(parentId: string): void {
    for (const [path, nodeId] of this.pathIndex.entries()) {
      const node = this.nodes.get(nodeId);
      if (node && node.parent === parentId) {
        this.nodes.delete(nodeId);
        this.pathIndex.delete(path);
        
        if (node.type === 'directory') {
          this.removeChildrenRecursive(nodeId);
        }
      }
    }
  }

  createDirectory(path: string): boolean {
    const pathParts = path.split('/').filter(p => p);
    const dirName = pathParts.pop();
    const parentPath = pathParts.length > 0 ? `/${pathParts.join('/')}` : '/';
    
    const parentId = this.pathIndex.get(parentPath);
    if (!parentId || !dirName) return false;
    
    const parent = this.nodes.get(parentId);
    if (!parent || parent.type !== 'directory') return false;
    
    // Check if already exists
    if (this.pathIndex.has(path)) return false;
    
    this.createNode(dirName, 'directory', parentId);
    return true;
  }

  listDirectory(path: string): VFSNode[] {
    const nodeId = this.pathIndex.get(path);
    if (!nodeId) return [];
    
    const node = this.nodes.get(nodeId);
    if (!node || node.type !== 'directory' || !node.permissions.read) return [];
    
    const children: VFSNode[] = [];
    for (const child of this.nodes.values()) {
      if (child.parent === nodeId) {
        children.push({ ...child }); // Clone to prevent mutations
      }
    }
    
    return children.sort((a, b) => {
      // Directories first, then files, alphabetically
      if (a.type !== b.type) {
        return a.type === 'directory' ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
  }

  exists(path: string): boolean {
    return this.pathIndex.has(path);
  }

  getNode(path: string): VFSNode | null {
    const nodeId = this.pathIndex.get(path);
    if (!nodeId) return null;
    
    const node = this.nodes.get(nodeId);
    return node ? { ...node } : null; // Clone to prevent mutations
  }

  moveNode(fromPath: string, toPath: string): boolean {
    const nodeId = this.pathIndex.get(fromPath);
    if (!nodeId) return false;
    
    const node = this.nodes.get(nodeId);
    if (!node || !node.permissions.write) return false;
    
    // Check if destination already exists
    if (this.pathIndex.has(toPath)) return false;
    
    // Update path index
    this.pathIndex.delete(fromPath);
    this.pathIndex.set(toPath, nodeId);
    
    // Update node name and parent if necessary
    const pathParts = toPath.split('/').filter(p => p);
    const newName = pathParts.pop();
    const newParentPath = pathParts.length > 0 ? `/${pathParts.join('/')}` : '/';
    const newParentId = this.pathIndex.get(newParentPath);
    
    if (newName && newParentId) {
      node.name = newName;
      node.parent = newParentId;
      node.modified = new Date();
    }
    
    this.emitEvent('moved', toPath, node);
    return true;
  }

  // Event system
  
  onFileSystemChange(listener: (event: VFSEvent) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // Utility methods
  
  getFileExtension(path: string): string {
    const parts = path.split('.');
    return parts.length > 1 ? parts.pop()?.toLowerCase() || '' : '';
  }

  getFileName(path: string): string {
    return path.split('/').pop() || '';
  }

  getDirectoryPath(path: string): string {
    const parts = path.split('/');
    parts.pop();
    return parts.join('/') || '/';
  }

  // Statistics
  
  getStats(): {
    totalNodes: number;
    totalFiles: number;
    totalDirectories: number;
    totalSize: number;
  } {
    let totalFiles = 0;
    let totalDirectories = 0;
    let totalSize = 0;
    
    for (const node of this.nodes.values()) {
      if (node.type === 'file') {
        totalFiles++;
        totalSize += node.size;
      } else {
        totalDirectories++;
      }
    }
    
    return {
      totalNodes: this.nodes.size,
      totalFiles,
      totalDirectories,
      totalSize
    };
  }

  // Import/Export
  
  exportData(): any {
    return {
      nodes: Array.from(this.nodes.entries()),
      pathIndex: Array.from(this.pathIndex.entries()),
      nextId: this.nextId
    };
  }

  importData(data: any): void {
    this.nodes = new Map(data.nodes);
    this.pathIndex = new Map(data.pathIndex);
    this.nextId = data.nextId;
  }
}

// Singleton instance
export const vfs = new VirtualFileSystem();
