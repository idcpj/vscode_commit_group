import * as vscode from 'vscode';
import * as path from 'path';
import { GitFileItem } from './GitFileItem';
import { GroupItem } from './GroupItem';


// Git 文件树提供者
export class GitFileProvider implements vscode.TreeDataProvider<GroupItem | GitFileItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<GroupItem | GitFileItem | undefined | null | void> = new vscode.EventEmitter<GroupItem | GitFileItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<GroupItem | GitFileItem | undefined | null | void> = this._onDidChangeTreeData.event;
    private groups: { [key: string]: GitFileItem[] } = {
        '未提交': [],
    };

    constructor(private workspaceRoot: string | undefined) {
            // groups  从 .cscode 的 缓存中取出分组信息
            const cache = vscode.workspace.getConfiguration('commit-group');
            this.groups = cache.get('groups') || {};
    }
    

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: GroupItem | GitFileItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: GroupItem | GitFileItem): Promise<(GroupItem | GitFileItem)[]> {
        if (!this.workspaceRoot) {
            return Promise.resolve([]);
        }

        // 如果是分组项，返回该组的文件
        if (element instanceof GroupItem) {
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

                console.log(git.repositories)
                
                if (!repository) {
                    throw new Error('No repository found');
                }

                // 获取所有更改
                const changes = repository.state.workingTreeChanges.concat(repository.state.indexChanges);
                
                // 创建分组
                const groups: { [key: string]: GitFileItem[] } = {
                    '未提交': [],
                    '移至另一分支': [],
                    '延期处理': [],
                };

                // 将文件分配到相应分组
                for (const change of changes) {
                    const status = this.getStatusText(change.status);
                    const filePath = change.uri.fsPath;
                    const fileName = path.basename(filePath);
                    
                    const fileItem = new GitFileItem(
                        fileName,
                        vscode.TreeItemCollapsibleState.None,
                        status,
                        filePath
                    );

                    // 默认将所有文件放入"未提交"分组
                    groups['未提交'].push(fileItem);
                }

                // 转换为 GroupItem 数组
                return Object.entries(groups).map(([groupName, files]) => 
                    new GroupItem(
                        groupName,
                        vscode.TreeItemCollapsibleState.Expanded,
                        files
                    )
                );
            } catch (error) {
                console.error('Error getting git changes:', error);
                return [];
            }
        }
        return [];
    }

    private getStatusText(status: number): string {
        const statusMap: { [key: number]: string } = {
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
    public async addGroup(groupName: string) {
        if (groupName && !this.groups[groupName]) {
            this.groups[groupName] = [];
            this.refresh();
            return true;
        }
        return false;
    }

    // 删除分组
    public deleteGroup(groupName: string) {
        if (groupName in this.groups) {
            delete this.groups[groupName];
            this.refresh();
        }
    }

    public getGroups(groupName: string):boolean {
        return this.groups[groupName] !== undefined;
    }

    // 获取第一个项目（用于展开所有）
    public getFirstItem(): GroupItem | undefined {
        if(Object.keys(this.groups).length > 0) {
            const [groupName, files] = Object.entries(this.groups)[0];
            return new GroupItem(
                groupName,
                vscode.TreeItemCollapsibleState.Expanded,
                files
            );
        }
        return undefined;
    }

    // 获取所有分组项目
    public async getAllItems(): Promise<GroupItem[]> {
        try {
            const gitExtension = vscode.extensions.getExtension('vscode.git');
            if (!gitExtension) {
                return [];
            }

            await gitExtension.activate();
            const git = gitExtension.exports.getAPI(1);
            
            if (!git.repositories || git.repositories.length === 0) {
                return [];
            }
            
            const repository = git.repositories[0];
            if (!repository) {
                return [];
            }

            // 获取所有更改
            const changes = repository.state.workingTreeChanges.concat(repository.state.indexChanges);
            
            // 将文件转换为 GroupItems
            return Object.entries(this.groups).map(([groupName, files]) => 
                new GroupItem(
                    groupName,
                    vscode.TreeItemCollapsibleState.Expanded,
                    files
                )
            );
        } catch (error) {
            console.error('Error getting all items:', error);
            return [];
        }
    }
}