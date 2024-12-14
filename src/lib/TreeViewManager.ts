import { SdkType } from "../@type/type";
import { GitTreeItemFile } from "./data/GitTreeItemFile";
import * as vscode from 'vscode';
import { GitTreeItemGroup } from "./data/GitTreeItemGroup";

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

    public async reveal(element: GitTreeItemGroup|GitTreeItemFile): Promise<void> {
        await this.treeView.reveal(element, {
            select: true,
            focus: true,
            expand: true
        });
    }

    public setTag(groupCount: number) {
        this.treeView.badge = <vscode.ViewBadge>{
            tooltip: `${groupCount}个分组`,
            value: groupCount
        }

    }

    // 获取选中的群租或部门
    public getSelectedFileList():string[]{
        const fileList:string[] = [];

        let selectGroupCount = 0;
        // 获取选中的群租或部门
        this.treeView.selection.map((item:GitTreeItemGroup|GitTreeItemFile)=>{
            if(item instanceof GitTreeItemGroup){
                selectGroupCount++;
                if(selectGroupCount>1){
                    throw new Error("只能选择一个分组");
                }
                fileList.push(...item.getFileList().map(file=>file.getFilePath()));
            }else if(item instanceof GitTreeItemFile){
                fileList.push(item.getFilePath());
            }
        });

        return fileList;
    }
}