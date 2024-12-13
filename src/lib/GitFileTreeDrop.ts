import { SdkType } from "../@type/type";
import { GitTreeItemGroup } from "./data/GitTreeItemGroup";
import { GitTreeItemFile } from "./data/GitTreeItemFile";
import * as vscode from 'vscode';
import { Repository } from "../@type/git";

export class GitFileTreeDrop implements vscode.TreeDragAndDropController<GitTreeItemGroup | GitTreeItemFile>{
    private sdk:SdkType;

    
    // 添加拖拽相关属性
    dropMimeTypes = ['application/vnd.code.tree.gitFileItem'];
    dragMimeTypes = ['application/vnd.code.tree.gitFileItem'];

    constructor(sdk:SdkType){
        this.sdk=sdk;
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

            await this.sdk.getGitGroupManager().moveFile(fileList,target);

            // 刷新视图
            this.sdk.refresh();
            
        } catch (error:any) {
            console.error('拖拽处理失败:', error);
            vscode.window.showErrorMessage('移动文件失败',{modal:true,detail:error.toString()});
        }
    }
}