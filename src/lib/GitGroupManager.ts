import { Change, Repository } from "../@type/git";
import { GitGroupName_Untracked } from "../type";
import { GitTreeItemFile } from "./GitTreeItemFile";
import { GitTreeItemGroup } from "./GitTreeItemGroup";
import * as vscode from 'vscode';


export class GitGroupManager {
    private groups: GitTreeItemGroup[];
    private fileList:Record<string,GitTreeItemFile>={};
    constructor(
        groups: GitTreeItemGroup[]
    ) {
        this.groups = groups;
    }

    public getGroups(): GitTreeItemGroup[] {
        // 未跟踪的分组排最后
        return this.groups.sort((a, b) => a.label === GitGroupName_Untracked ? 1 : b.label === GitGroupName_Untracked ? -1 : 0);
    }


    /**
     * 获取指定名称的group
     * @param name group的名称
     * @returns 指定名称的group
     */
    public getGroupByName(name: string): GitTreeItemGroup | undefined {
        return this.groups.find(group => group.label === name);
    }

    /**
     * 激活指定id的group
     * @param name group的名称
     */
    public activateGroup(name: string): void {
        this.groups.forEach(group => {
            group.active = group.label === name;
        });
    }

    /**
     * 删除指定id的group
     * @param id group的id
     */
    public deleteGroup(name: string): void {
        // 判断要删除的是否为激活的group
        const group = this.groups.find(group => group.label === name);
        if(group?.files && group?.files.length>0){
            throw new Error('group is not empty');
        }

        // 先过滤掉要删除的group
        this.groups = this.groups.filter(group => group.label !== name);

        // 如果删除的是激活的group,则激活order最小的group
        if (group?.active && this.groups.length > 0) {
            const minOrderGroup = this.groups.reduce((prev, curr) =>
                prev.order < curr.order ? prev : curr
            );
            this.activateGroup(minOrderGroup.label);
        }
    }

    /**
     * 添加新的group
     * @param name group的名称
     * @returns 新添加的group的id
     */
    public addGroup(name: string, isActive: boolean = false) {
        // 生成唯一id

        const id: string = name;

        // 名字唯一
        if (this.getGroupByName(name)) {
            throw new Error(`Group ${name} already exists`);
        }


        // 获取最大的order
        const maxOrder = this.groups.reduce((max, group) =>
            group.order > max ? group.order : max,
            0
        );

        // 创建新group
        const newGroup: GitTreeItemGroup = new GitTreeItemGroup(id, name, maxOrder + 1, isActive);

        // 添加到groups中
        this.groups.push(newGroup);
    }

    public activateGroupById(name: string): void {
        this.groups.forEach(group => {
            group.active = group.label === name;
        });
    }

    public moveFile(fileList: string[], targetGroup: GitTreeItemGroup,repository:Repository) {

        for (const file of fileList) {
            const fileItem=this.fileList[file];
            if(fileItem){
                const group=fileItem.getGroup();
                
                if(group?.label==GitGroupName_Untracked){
                    // 从未跟踪到跟踪, 添加跟踪
                    repository.add([file]);
                }else{
                    // 从跟踪到未跟踪, 撤销跟踪
                    repository.revert([file]);
                }
                group.removeFile(file);
                targetGroup.addFile(fileItem);
            }
        }

    }

    /**
     * 添加文件到指定分组
     * @param groupName 分组名称
     * @param change 文件变更
     */
    public addFile(groupName:string,change:Change){
        const group=this.getGroupByName(groupName);
        if(group){
            const file=new GitTreeItemFile(change,group);
            group.addFile(file);
            this.fileList[change.uri.fsPath]=file;
        }
    }


}
