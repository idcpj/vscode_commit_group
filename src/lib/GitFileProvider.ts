import * as vscode from 'vscode';
import * as path from 'path';
import { GitFileItem } from './GitFileItem';
import { GroupItem } from './GroupItem';
import { TextEncoder } from 'node:util';
import { GitExtension } from '../@type/git';

export class GitFileProvider implements vscode.TreeDataProvider<GroupItem | GitFileItem> {
    private workspaceRoot: string;
    private _onDidChangeTreeData: vscode.EventEmitter<GroupItem | GitFileItem | undefined | null | void> = new vscode.EventEmitter<GroupItem | GitFileItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<GroupItem | GitFileItem | undefined | null | void> = this._onDidChangeTreeData.event;
    
    // 使用 Map 存储分组信息，便于管理
    private groups: Map<string, GitFileItem[]> = new Map();
    
    constructor(workspaceRoot: string) {
        this.workspaceRoot = workspaceRoot;
        this.loadGroupsFromWorkspace().then(groups=>{
            // 加载自定义分组
            if(groups) {
                groups.forEach(group => {
                    if(!this.groups.has(group)) {
                        this.groups.set(group, []);
                    }
                });
            }
        });

        // 初始化默认分组
        // this.groups.set('暂存的更改', []);
        // this.groups.set('更改', []);
        // this.groups.set('未跟踪', []);
    }
    
    // 从 .vscode 工作区获取分组信息
    private async loadGroupsFromWorkspace() {
        try {
            const configPath = path.join(this.workspaceRoot, '.vscode', 'commit-groups.json');
            const configUri = vscode.Uri.file(configPath);
            
            try {
                const groups=[];
                const content = await vscode.workspace.fs.readFile(configUri);
                const config = JSON.parse(content.toString());
                
                // 合并已保存的分组
                if (config.groups) {
                    for (const [groupName, files] of Object.entries(config.groups)) {
                        groups.push(groupName);
                    }
                }
                return groups;

            } catch (err) {
                // 如果文件不存在,使用默认分组
                console.log('No saved groups found, using defaults');
            }
        } catch (err) {
            console.error('Error loading groups:', err);
        }
    }

    // 保存分组信息到工作区
    private async saveGroupsToWorkspace(): Promise<void> {
        try {
            const configPath = path.join(this.workspaceRoot, '.vscode', 'commit-groups.json');
            const configUri = vscode.Uri.file(configPath);

            // 过滤掉默认分组,只保存自定义分组
            const groupsToSave: { [key: string]: any } = {};
            for (const [groupName, files] of this.groups.entries()) {
                if (!['暂存的更改', '更改', '未跟踪'].includes(groupName)) {
                    groupsToSave[groupName] = files;
                }
            }

            const content = JSON.stringify({ groups: groupsToSave }, null, 2);
            const encoder = new TextEncoder();
            await vscode.workspace.fs.writeFile(configUri, encoder.encode(content));
        } catch (err) {
            console.error('Error saving groups:', err);
            vscode.window.showErrorMessage('保存分组信息失败');
        }
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: GroupItem | GitFileItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: GroupItem | GitFileItem): Promise<(GroupItem | GitFileItem)[]> {
        if (!this.workspaceRoot) {
            return [];
        }

        if (element instanceof GroupItem) {
            return element.files;
        }

        if (!element) {
            try {
                const gitExtension = vscode.extensions.getExtension('vscode.git') as vscode.Extension<GitExtension>;
                if (!gitExtension) {
                    throw new Error('Git extension not found');
                }

                await gitExtension.activate();
                const git = gitExtension.exports.getAPI(1);
                const repository = git.repositories[0] ;

                if (!repository) {
                    throw new Error('No repository found');
                }

                // 清空现有分组

                // 处理暂存的更改
                for (const change of repository.state.indexChanges) {
                    const fileItem = this.createFileItem(change);
                    this.groups.get('暂存的更改')?.push(fileItem);
                }

                // 处理工作区更改
                for (const change of repository.state.workingTreeChanges) {
                    const fileItem = this.createFileItem(change);
                    if (change.status === 6) { // Untracked
                        this.groups.get('未跟踪')?.push(fileItem);
                    } else {
                        this.groups.get('更改')?.push(fileItem);
                    }
                }

                // 转换为 GroupItem 数组，只显示有文件的分组
                return Array.from(this.groups.entries())
                    .filter(([_, files]) => files.length > 0)
                    .map(([groupName, files]) => new GroupItem(
                        groupName,
                        vscode.TreeItemCollapsibleState.Expanded,
                        files,
                        this.getGroupIcon(groupName),
                        files.length
                    ));

            } catch (error) {
                console.error('Error getting git changes:', error);
                return [];
            }
        }
        return [];
    }

    private createFileItem(change: any): GitFileItem {
        const status = this.getStatusText(change.status);
        const filePath = change.uri.fsPath;
        const fileName = path.basename(filePath);
        
        return new GitFileItem(
            fileName,
            vscode.TreeItemCollapsibleState.None,
            status,
            filePath,
            this.getFileIcon(change.status)
        );
    }

    private getStatusText(status: number): string {
        const statusMap: { [key: number]: string } = {
            0: '未修改',
            1: '已修改',
            2: '已添加',
            3: '已删除',
            4: '已重命名',
            5: '已复制',
            6: '未跟踪',
            7: '已忽略',
            8: '有冲突'
        };
        return statusMap[status] || '未知';
    }

    private getFileIcon(status: number): vscode.ThemeIcon {
        switch (status) {
            case 1: // Modified
                return new vscode.ThemeIcon('edit');
            case 2: // Added
                return new vscode.ThemeIcon('diff-added');
            case 3: // Deleted
                return new vscode.ThemeIcon('diff-removed');
            case 4: // Renamed
                return new vscode.ThemeIcon('diff-renamed');
            case 6: // Untracked
                return new vscode.ThemeIcon('diff-added');
            case 8: // Conflicted
                return new vscode.ThemeIcon('warning');
            default:
                return new vscode.ThemeIcon('file');
        }
    }

    private getGroupIcon(groupName: string): vscode.ThemeIcon {
        switch (groupName) {
            case '暂存的更改':
                return new vscode.ThemeIcon('check');
            case '更改':
                return new vscode.ThemeIcon('edit');
            case '未跟踪':
                return new vscode.ThemeIcon('question');
            default:
                return new vscode.ThemeIcon('folder');
        }
    }

    // 移动文件到指定分组
    public async moveFileToGroup(file: GitFileItem, targetGroup: string) {
        // 从所有分组中移除该文件
        for (const [_, files] of this.groups) {
            const index = files.findIndex(f => f.filePath === file.filePath);
            if (index !== -1) {
                files.splice(index, 1);
            }
        }

        // 添加到目标分组
        const targetFiles = this.groups.get(targetGroup);
        if (targetFiles) {
            targetFiles.push(file);
            this.refresh();
        }
    }
    public getAllItems(): GitFileItem[] {
        return Array.from(this.groups.values()).flat();
    }

    public getGroups(groupName:string): GitFileItem[] {
        return this.groups.get(groupName) || [];
    }
    public addGroup(groupName: string) {
        this.groups.set(groupName, []);
        this.refresh();
    }
    public deleteGroup(groupName: string) {
        this.groups.delete(groupName);
        this.refresh();
    }
}