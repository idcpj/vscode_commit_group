import { Change, GitExtension, Repository, Status, Status } from "../@type/git";
import { sleep } from "../help/time";
import { GitGroupName_Untracked, GitGroupName_Working } from "../const";
import { GitTreeItemFile } from "./data/GitTreeItemFile";
import { GitTreeItemGroup } from "./data/GitTreeItemGroup";
import * as vscode from 'vscode';
import { GitTreeItemFileJson, GitTreeItemGroupJson, SdkType } from "../@type/type";


export class GitGroupManager {
    private groups: GitTreeItemGroup[]=[];
    private fileList: Record<string, GitTreeItemFile> = {};
    private sdk: SdkType;

    constructor(
        sdk: SdkType,
    ) {

        this.sdk = sdk;
    }

    public group_lists(): GitTreeItemGroup[] {
        // 未跟踪的分组排最后,激活的分组排最前
        return this.groups.sort((a, b) => a.label === GitGroupName_Untracked ? 1 : b.label === GitGroupName_Untracked ? -1 : a.active ? -1 : b.active ? 1 : 0);
    }


    /**
     * 获取指定名称的group
     * @param name group的名称
     * @returns 指定名称的group
     */
    public group_groupNamebyName(name: string): GitTreeItemGroup | undefined {
        return this.groups.find(group => group.label === name);
    }


    /**
     * 激活指定id的group
     * @param name group的名称
     */
    public group_setActive(name: string): void {
        this.groups.forEach(group => {
            if (group.label === name) {
                group.checkActive();
            } else {
                group.uncheckActive();
            }
        });

        this.cache_set_groups();
    }

    public group_getActive(): GitTreeItemGroup | undefined {
        return this.groups.find(group => group.active);
    }

    public group_isExist(groupName: string): boolean {
        return this.group_groupNamebyName(groupName) ? true : false;
    }

    /**
     * 删除指定id的group
     * @param id group的id
     */
    public group_deleteByName(name: string): void {
        //两种类型的不能删除
        if (name === GitGroupName_Working || name === GitGroupName_Untracked) {
            throw new Error('不能删除内置分组');
        }

        // 判断要删除的是否为激活的group
        const group = this.groups.find(group => group.label === name);
        if (group?.files && group?.files.length > 0) {
            throw new Error('group is not empty');
        }

        // 先过滤掉要删除的group
        this.groups = this.groups.filter(group => group.label !== name);

        // 如果删除的是激活的group,则激活order最小的group
        if (group?.active && this.groups.length > 0) {
            this.group_setActive(this.groups[0].label);
        }

        this.cache_set_groups();
    }

    /**
     * 添加新的group
     * @param name group的名称
     * @returns 新添加的group的id
     */
    public group_add(name: string, isActive: boolean = false) {

        // 名字唯一
        if (this.group_isExist(name)) {
            throw new Error(`Group ${name} already exists`);
        }


        // 创建新group
        const newGroup: GitTreeItemGroup = new GitTreeItemGroup(name, isActive);

        // 添加到groups中
        this.groups.push(newGroup);

        this.cache_set_groups();

    }

    public file_lists(): GitTreeItemFile[]{
        return Object.values(this.fileList);
    }

    public async file_move(fileList: string[], targetGroup: GitTreeItemGroup) {

        const repository = await this.sdk.getGitManager().getRepository();


        for (const file of fileList) {
            const fileItem = this.fileList[file];
            if (fileItem) {
                const group = fileItem.getGroup();

                // 源是没版本管理,目标是版本管理
                if(group?.label==GitGroupName_Untracked && targetGroup.label!=GitGroupName_Untracked){
                    await repository.add([file]);
                }else if(group?.label!=GitGroupName_Untracked && targetGroup.label==GitGroupName_Untracked){
                    await repository.revert([file]);
                }

                group.removeFile(file);
                targetGroup.addFile(fileItem);

            }
        }

        this.cache_set_groups();
        this.cache_set_fileList();

    }



    public file_isExist(filePath: string): boolean {
        return this.fileList[filePath] ? true : false;
    }

    public file_getByPath(filePath: string): GitTreeItemFile | undefined {
        return this.fileList[filePath];
    }

    public file_moveByPath(filePath: string): void {
        const group = this.group_groupNamebyName(filePath);
        if (group) {
            group.removeFile(filePath);
        }

        delete this.fileList[filePath];

        this.cache_set_fileList();
        this.cache_set_groups();
    }

    /**
     * 添加文件到指定分组
     * @param groupName 分组名称
     * @param change 文件变更
     */
    public file_add(groupName: string, change: Change) {
        const group = this.group_groupNamebyName(groupName) as GitTreeItemGroup;
        if (!group) {
            console.error("group is null",groupName);
            return;
        }

        const file = new GitTreeItemFile(change.uri.fsPath, group, change);
        group.addFile(file);
        this.fileList[change.uri.fsPath] = file;

        this.cache_set_fileList();
        this.cache_set_groups();
    }


    /**
     * 在激活的group中添加文件
     * @param filePath 文件路径
     */
    public async file_addInActiveGroup(filePath: string,change?:Change) {
        const activeGroup = this.group_getActive();
        if (!activeGroup) {
            throw new Error("activeGroup is null");
        }

        if(change){
            this.file_add(activeGroup.label, change);
            return 
        }

        const file = await this.sdk.getGitManager().getChangeByFilePath(filePath);
        if (file) {
            this.file_add(activeGroup.label, file);
        }
     

    }


    // 加载缓存数据,或创建数据
    public relaod() {
        // 调试用
        // this.cache_clear();

        this.groups = this.cache_get_groups();
        if(this.groups.length==0){
            this.group_add(GitGroupName_Working,/* isActive */true);
            this.group_add(GitGroupName_Untracked,/* isActive */false);
        }

        // 加载文件列表
        this.cache_get_fileList()?.forEach((file: GitTreeItemFile) => {
            this.fileList[file.getFilePath()] = file;
            this.groups.find(group=>group.label==file.getGroup()?.label)?.addFile(file);
        });


    }

    public cache_get_groups():GitTreeItemGroup[]{
        const groups = this.sdk.getContext().workspaceState.get<string>('commit-group.groups');
        if(groups){
            return JSON.parse(groups).map((item:GitTreeItemGroupJson)=>{
                return new GitTreeItemGroup(item.label,item.active);
            });
        }


        return []
    }

    public cache_get_fileList():GitTreeItemFile[]{
        const fileList = this.sdk.getContext().workspaceState.get<string>('commit-group.fileList');
        if(fileList){
            return JSON.parse(fileList).map((item:GitTreeItemFileJson)=>{
                const group = this.group_groupNamebyName(item.groupLabel);
                if(!group){
                    console.error(`group ${item.groupLabel} not found`);
                    return;
                }

                return new GitTreeItemFile(item.filepath,group);
            });
        }

        return []
    }

    public cache_set_groups(){
        this.sdk.getContext().workspaceState.update('commit-group.groups', JSON.stringify(this.groups.map(group=>group.toJson())));
    }

    public cache_set_fileList(){
        this.sdk.getContext().workspaceState.update('commit-group.fileList', JSON.stringify(Object.values(this.fileList).map(file=>file.toJson())));
    }

    public cache_clear(){
        this.sdk.getContext().workspaceState.update('commit-group.groups', '');
        this.sdk.getContext().workspaceState.update('commit-group.fileList', '');
    }
 
}
