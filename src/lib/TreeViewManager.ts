import { SdkType } from "../@type/type";
import { GitTreeItemFile } from "./data/GitTreeItemFile";
import * as vscode from 'vscode';
import { GitTreeItemGroup } from "./data/GitTreeItemGroup";
import { GitGroupName_Untracked } from "../const";

export class TreeViewManager{

    private sdk: SdkType;
    private treeView: vscode.TreeView<GitTreeItemGroup|GitTreeItemFile>;

    constructor(sdk: SdkType){
        this.sdk = sdk;
        this.treeView = vscode.window.createTreeView<GitTreeItemGroup|GitTreeItemFile>('commit-group-view', <vscode.TreeViewOptions<GitTreeItemGroup|GitTreeItemFile>>{
            treeDataProvider: this.sdk.getGitFileProvider(),
            dragAndDropController: this.sdk.getGitFileTreeDrop(),
            canSelectMany: true,
            showCollapseAll: true,
        });

        

    }

    public run(){
        // 监听复选框状态变化
        // this.treeView.onDidChangeCheckboxState(event => {
        //     // event.items 包含了状态发生变化的项目数组
        //     // 每一项是一个元组 [item, state]
        //     event.items.forEach(([item, state]) => {
        //         console.log(`Item ${item.label} checkbox state changed to: ${state}`);
                
        //         if(state === vscode.TreeItemCheckboxState.Checked) {
        //             // 处理选中状态
        //         } else {
        //             // 处理未选中状态  
        //         }
        //     });
        // });

        this.treeView.onDidChangeSelection(event => {

            let fileCount = 0;
            let groupName='';
            // 是否存在未跟踪的分组
            let isUnTracked = false;
            event.selection.forEach(item=>{
                if(item instanceof GitTreeItemGroup){
                    fileCount += item.files.length;
                    groupName = item.getLabel();
                    if(isUnTracked===false){
                        isUnTracked = item.getType()==GitGroupName_Untracked;
                    }
                }else if(item instanceof GitTreeItemFile){
                    fileCount += 1;
                    groupName='';
                    
                    if(isUnTracked===false){
                        isUnTracked = item.getGroup().getType()==GitGroupName_Untracked;
                    }
                }
            });

            if(isUnTracked){
                this.sdk.getWebviewViewManager().setDescription("");
                return ;
            }

            const groupDesc = groupName ? vscode.l10n.t('Selected [{0}] Group,', groupName) : '';

            this.sdk.getWebviewViewManager().setDescription(vscode.l10n.t('{0} Selected Files {1}', groupDesc, fileCount));
        });
    }

    public async reveal(element: GitTreeItemGroup|GitTreeItemFile): Promise<void> {
        await this.treeView.reveal(element, {
            select: true,
            focus: true,
            expand: true
        });
    }

    public setTag(groupCount: number) {
        this.treeView.badge = <vscode.ViewBadge>{
            tooltip: groupCount>0?vscode.l10n.t('Total {0} Groups', groupCount):'',
            value: groupCount
        }

    }

    public selectIsUnTracked():boolean{
         return this.treeView.selection.some(item=>item instanceof GitTreeItemGroup && item.getType()==GitGroupName_Untracked);
    }

    public isSelectGroup():boolean{
        return this.treeView.selection.some(item=>item instanceof GitTreeItemGroup);
    }
    public isSelectFile():boolean{
        return this.treeView.selection.some(item=>item instanceof GitTreeItemFile);
    }

    // 获取选中的群租或部门,但是不能再都个分组中
    public getSelectedFileList():string[]{
        const fileList:string[] = [];

        let selectGroupName = '';

        // 获取选中的群租或部门
        this.treeView.selection.map((item:GitTreeItemGroup|GitTreeItemFile)=>{
            if(item instanceof GitTreeItemGroup){
                
                if(selectGroupName==''){
                    selectGroupName = item.getLabel();
                }else if(selectGroupName!=item.getLabel()){
                    throw new Error(vscode.l10n.t('Cannot Select Multiple Groups'));
                }

                fileList.push(...item.getFileList().map(file=>file.getFilePath()));
            }else if(item instanceof GitTreeItemFile){

                // 不能是未跟踪的分组的文件
                if(item.getGroup().getType()==GitGroupName_Untracked){
                    throw new Error(vscode.l10n.t('Cannot Select Untracked Group File'));
                }


                if(selectGroupName==''){
                    selectGroupName = item.getGroup().getLabel();
                }else if(selectGroupName!=item.getGroup().getLabel()){
                    throw new Error(vscode.l10n.t('Cannot Select Multiple Groups'));
                }
                fileList.push(item.getFilePath());
            }
        });

        return fileList;
    }

    // 获取选中的文件列表,可以多个分组中
    public getSelectedFileListMultiGroup():string[]{
        const fileList:string[] = [];
        this.treeView.selection.map(item=>{
            if(item instanceof GitTreeItemFile){
                fileList.push(item.getFilePath());
            }
        });
        return fileList;
    }

}