import * as vscode from 'vscode';
import { GitTreeItemFile } from './GitTreeItemFile';
import { GitTreeItemGroup } from './GitTreeItemGroup';
import { GitGroupManager } from './GitGroupManager';
import { GitGroupName_Untracked, GitGroupName_Working } from '../type';
import { GitExtension, Repository, Status } from '../@type/git';
import { sleep } from '../help/time';

export class GitFileProvider implements vscode.TreeDataProvider<GitTreeItemGroup | GitTreeItemFile>, vscode.TreeDragAndDropController<GitTreeItemGroup | GitTreeItemFile> {
    private workspaceRoot: string='';
    private repository:Repository|undefined;
    private _onDidChangeTreeData: vscode.EventEmitter<GitTreeItemGroup | GitTreeItemFile | undefined | null | void> = new vscode.EventEmitter<GitTreeItemGroup | GitTreeItemFile | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<GitTreeItemGroup | GitTreeItemFile | undefined | null | void> = this._onDidChangeTreeData.event;

    // 使用 Map 存储分组信息，便于管理
    private groups: GitGroupManager = new GitGroupManager([]);

    // 添加拖拽相关属性
    dropMimeTypes = ['application/vnd.code.tree.gitFileItem'];
    dragMimeTypes = ['application/vnd.code.tree.gitFileItem'];

    constructor(workspaceRoot: string,groups:GitGroupManager) {
        this.workspaceRoot = workspaceRoot;
        this.groups=groups;
        

    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: GitTreeItemGroup | GitTreeItemFile): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: GitTreeItemGroup | GitTreeItemFile) {

        try {

            if (!this.workspaceRoot) {
                return [];
            }

            if (!element) {
                await this._loadGroups();
                return this.groups.getGroups();
            }


            // 转换为 GroupItem 数组，只显示有文件的分组
            if (element instanceof GitTreeItemGroup) {
                return element.files;
            }

            if (element instanceof GitTreeItemFile) {
                throw new Error('GitFileItem is not a valid element');
            }
            return []

        } catch (error) {
            console.error('Error getting git changes:', error);
            vscode.window.showErrorMessage(`Error getting git changes: ${error}`);
            return [];
        }
    }

    private async _loadGroups() {
        if(this.groups.getGroups().length>0){
            return;
        }


        const gitExtension = vscode.extensions.getExtension('vscode.git') as vscode.Extension<GitExtension>;
        if (!gitExtension) {
            throw new Error('Git extension not found');
        }

        await gitExtension.activate();
        if(!gitExtension.isActive){
            throw new Error('Git extension not found');
        }

        const git = gitExtension.exports.getAPI(1);

        await sleep(1000);
        

        const repository = git.repositories[0];

        if (!repository) {
            throw new Error('No repository found');
        }

        this.repository=repository;

        this.groups.addGroup(GitGroupName_Working,/* isActive */true);
        this.groups.addGroup(GitGroupName_Untracked,/* isActive */false);

        // 未跟踪的文件变更
        for (const change of this.repository.state.untrackedChanges) {
            this.groups.addFile(GitGroupName_Untracked,change);
        }


        // 暂存区的文件变更
        for (const change of this.repository.state.indexChanges) {
            this.groups.addFile(GitGroupName_Working,change);
        }


        // 处理工作区更改
        for (const change of this.repository.state.workingTreeChanges) {
            
            switch(change.status){
                case Status.MODIFIED:
                case Status.DELETED:
                case Status.INTENT_TO_ADD:
                case Status.TYPE_CHANGED:
                    this.groups.addFile(GitGroupName_Working,change);
                    break;
                case Status.UNTRACKED:

                    // 忽略 .gitignore 文件
                    const ignoreFile = await repository.checkIgnore([change.uri.fsPath])
                    if(ignoreFile.size>0){
                        break;
                    }
                    this.groups.addFile(GitGroupName_Untracked,change);

                    break;
                default:
                    // nothing
                    break;
            }
        }

    }
    

    public groupIsExist(groupName: string): boolean {
        return this.groups.getGroupByName(groupName) ? true : false;
    }   

    public addGroup(groupName: string) {
        this.groups.addGroup(groupName);
        this.refresh();
    }

    public deleteGroup(groupName: string) {
        //两种类型的不能删除
        if(groupName===GitGroupName_Working||groupName===GitGroupName_Untracked){
            throw new Error('不能删除内置分组');
        }
        this.groups.deleteGroup(groupName);
        this.refresh();
    }

    // 实现拖拽开始事件
    public async handleDrag(source: readonly (GitTreeItemGroup | GitTreeItemFile)[], dataTransfer: vscode.DataTransfer): Promise<void> {
        if (source.length>0) {
            // 将文件信息序列化后传递
            const  fileList = source.map(item=>{
                return item.resourceUri?.fsPath;
            })
            dataTransfer.set('application/vnd.code.tree.gitFileItem', new vscode.DataTransferItem(fileList.join(",")));
        }
    }

    // 实现拖拽放置事件
    public async handleDrop(target: GitTreeItemGroup | GitTreeItemFile | undefined, dataTransfer: vscode.DataTransfer): Promise<void> {
        if (!target || !(target instanceof GitTreeItemGroup)) {
            return;
        }

        const fileData = dataTransfer.get('application/vnd.code.tree.gitFileItem');
        if (!fileData) {
            return;
        }
        const fileList = fileData.value.split(",");
        if(fileList.length===0){
            return;
        }

        try {
           

            this.groups.moveFile(fileList,target,this.repository as Repository);

            // 刷新视图
            this.refresh();
        } catch (error:any) {
            console.error('拖拽处理失败:', error);
            vscode.window.showErrorMessage('移动文件失败',{modal:true,detail:error.toString()});
        }
    }

}