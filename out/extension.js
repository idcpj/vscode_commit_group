/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ([
/* 0 */,
/* 1 */
/***/ ((module) => {

module.exports = require("vscode");

/***/ }),
/* 2 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.GitFileProvider = void 0;
const vscode = __webpack_require__(1);
const path = __webpack_require__(3);
const GitFileItem_1 = __webpack_require__(4);
const GroupItem_1 = __webpack_require__(5);
// Git 文件树提供者
class GitFileProvider {
    constructor(workspaceRoot) {
        this.workspaceRoot = workspaceRoot;
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this.groups = {
            '未提交': [],
            '移至另一分支': [],
            '延期处理': []
        };
    }
    refresh() {
        this._onDidChangeTreeData.fire();
    }
    getTreeItem(element) {
        return element;
    }
    async getChildren(element) {
        if (!this.workspaceRoot) {
            return Promise.resolve([]);
        }
        // 如果是分组项，返回该组的文件
        if (element instanceof GroupItem_1.GroupItem) {
            return element.files;
        }
        // 根节点：显示分组
        if (!element) {
            try {
                const gitExtension = vscode.extensions.getExtension('vscode.git');
                if (!gitExtension) {
                    throw new Error('Git extension not found');
                }
                await gitExtension.activate();
                const git = gitExtension.exports.getAPI(1);
                // 确保存在仓库
                if (!git.repositories || git.repositories.length === 0) {
                    vscode.window.showWarningMessage('当前工作区没有找到 Git 仓库，请确保当前目录已初始化 Git');
                    return [];
                }
                const repository = git.repositories[0];
                console.log(git.repositories);
                if (!repository) {
                    throw new Error('No repository found');
                }
                // 获取所有更改
                const changes = repository.state.workingTreeChanges.concat(repository.state.indexChanges);
                // 创建分组
                const groups = {
                    '未提交': [],
                    '移至另一分支': [],
                    '延期处理': [],
                };
                // 将文件分配到相应分组
                for (const change of changes) {
                    const status = this.getStatusText(change.status);
                    const filePath = change.uri.fsPath;
                    const fileName = path.basename(filePath);
                    const fileItem = new GitFileItem_1.GitFileItem(fileName, vscode.TreeItemCollapsibleState.None, status, filePath);
                    // 默认将所有文件放入"未提交"分组
                    groups['未提交'].push(fileItem);
                }
                // 转换为 GroupItem 数组
                return Object.entries(groups).map(([groupName, files]) => new GroupItem_1.GroupItem(groupName, vscode.TreeItemCollapsibleState.Expanded, files));
            }
            catch (error) {
                console.error('Error getting git changes:', error);
                return [];
            }
        }
        return [];
    }
    getStatusText(status) {
        const statusMap = {
            0: 'Unmodified',
            1: 'Modified',
            2: 'Added',
            3: 'Deleted',
            4: 'Renamed',
            5: 'Copied',
            6: 'Untracked',
            7: 'Ignored',
            8: 'Conflicted'
        };
        return statusMap[status] || 'Unknown';
    }
    // 添加分组
    async addGroup(groupName) {
        if (groupName && !this.groups[groupName]) {
            this.groups[groupName] = [];
            this.refresh();
            return true;
        }
        return false;
    }
    // 删除分组
    deleteGroup(groupName) {
        if (groupName in this.groups) {
            delete this.groups[groupName];
            this.refresh();
        }
    }
    getGroups(groupName) {
        return this.groups[groupName] !== undefined;
    }
    // 获取第一个项目（用于展开所有）
    getFirstItem() {
        if (Object.keys(this.groups).length > 0) {
            const [groupName, files] = Object.entries(this.groups)[0];
            return new GroupItem_1.GroupItem(groupName, vscode.TreeItemCollapsibleState.Expanded, files);
        }
        return undefined;
    }
}
exports.GitFileProvider = GitFileProvider;


/***/ }),
/* 3 */
/***/ ((module) => {

module.exports = require("path");

/***/ }),
/* 4 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.GitFileItem = void 0;
const vscode = __webpack_require__(1);
class GitFileItem extends vscode.TreeItem {
    constructor(label, collapsibleState, status, filePath) {
        super(label, collapsibleState);
        this.label = label;
        this.collapsibleState = collapsibleState;
        this.status = status;
        this.filePath = filePath;
        this.tooltip = `${status}: ${filePath}`;
        this.description = status;
        this.command = {
            command: 'vscode.open',
            title: 'Open File',
            arguments: [vscode.Uri.file(filePath)]
        };
        // 根据文件后缀设置不同图标
        const ext = this.label.split('.').pop()?.toLowerCase() || '';
        switch (ext) {
            case 'js':
            case 'ts':
            case 'jsx':
            case 'tsx':
                this.iconPath = new vscode.ThemeIcon('symbol-method');
                break;
            case 'json':
                this.iconPath = new vscode.ThemeIcon('symbol-object');
                break;
            case 'html':
            case 'htm':
                this.iconPath = new vscode.ThemeIcon('symbol-structure');
                break;
            case 'css':
            case 'scss':
            case 'less':
                this.iconPath = new vscode.ThemeIcon('symbol-color');
                break;
            case 'md':
                this.iconPath = new vscode.ThemeIcon('markdown');
                break;
            case 'jpg':
            case 'jpeg':
            case 'png':
            case 'gif':
            case 'svg':
                this.iconPath = new vscode.ThemeIcon('symbol-file');
                break;
            default:
                this.iconPath = new vscode.ThemeIcon('file');
        }
    }
}
exports.GitFileItem = GitFileItem;


/***/ }),
/* 5 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.GroupItem = void 0;
const vscode = __webpack_require__(1);
class GroupItem extends vscode.TreeItem {
    constructor(label, collapsibleState, files) {
        super(label, collapsibleState);
        this.label = label;
        this.collapsibleState = collapsibleState;
        this.files = files;
        this.contextValue = 'group';
        this.iconPath = new vscode.ThemeIcon('folder');
    }
}
exports.GroupItem = GroupItem;


/***/ })
/******/ 	]);
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it needs to be isolated against other modules in the chunk.
(() => {
var exports = __webpack_exports__;

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.activate = void 0;
const vscode = __webpack_require__(1);
const GitFileProvider_1 = __webpack_require__(2);
function activate(context) {
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
    const gitFileProvider = new GitFileProvider_1.GitFileProvider(workspaceRoot);
    // 注册视图
    const treeView = vscode.window.createTreeView('commit-group-view', {
        treeDataProvider: gitFileProvider
    });
    // 注册命令
    context.subscriptions.push(
    // 刷新命令
    vscode.commands.registerCommand('commit-group.refresh', () => {
        gitFileProvider.refresh();
    }), 
    // 展开所有命令
    vscode.commands.registerCommand('commit-group.expandAll', () => {
        const firstItem = gitFileProvider.getFirstItem();
        if (firstItem) {
            treeView.reveal(firstItem, {
                expand: true,
                select: false
            });
        }
    }), 
    // 折叠所有命令
    vscode.commands.registerCommand('commit-group.collapseAll', () => {
        vscode.commands.executeCommand('workbench.actions.treeView.commit-group-view.collapseAll');
    }), 
    // 新建分组命令
    vscode.commands.registerCommand('commit-group.addGroup', async () => {
        const groupName = await vscode.window.showInputBox({
            title: '新建更改列表',
            placeHolder: '输入分组名称',
            prompt: '请输入新的分组名称',
            ignoreFocusOut: true,
            validateInput: (value) => {
                if (!value)
                    return '名称不能为空';
                if (gitFileProvider.getGroups(value))
                    return '分组名称已存在';
                return null;
            }
        });
        console.log("groupName:", groupName);
        if (groupName) {
            await gitFileProvider.addGroup(groupName);
            vscode.window.showInformationMessage(`分组 "${groupName}" 创建成功`);
        }
    }), 
    // 删除分组命令
    vscode.commands.registerCommand('commit-group.deleteGroup', (item) => {
        console.log("delte group item:", item);
        gitFileProvider.deleteGroup(item.label);
    }));
    // 增强 Git 变化监听
    const gitExtension = vscode.extensions.getExtension('vscode.git');
    if (gitExtension) {
        gitExtension.activate().then(git => {
            const api = git.getAPI(1);
            // 监听仓库状态变化
            api.onDidChangeState(() => {
                gitFileProvider.refresh();
            });
            // 监听具体仓库
            if (api.repositories[0]) {
                const repository = api.repositories[0];
                // 监听工作区变化
                repository.state.onDidChange(() => {
                    gitFileProvider.refresh();
                });
                // 监听索引变化
                // repository.state.onDidChangeIndex(() => {
                //     gitFileProvider.refresh();
                // });
            }
        });
    }
    // 监听文件系统变化
    const fileSystemWatcher = vscode.workspace.createFileSystemWatcher('**/*');
    fileSystemWatcher.onDidChange(() => gitFileProvider.refresh());
    fileSystemWatcher.onDidCreate(() => gitFileProvider.refresh());
    fileSystemWatcher.onDidDelete(() => gitFileProvider.refresh());
    context.subscriptions.push(treeView, fileSystemWatcher);
}
exports.activate = activate;

})();

module.exports = __webpack_exports__;
/******/ })()
;
//# sourceMappingURL=extension.js.map