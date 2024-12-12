import { GitFileItem } from "./GitFileItem";
import { GroupItem } from "./GroupItem";
import * as vscode from 'vscode';


export class GitGroupManager {
    private groups: GroupItem[];
    constructor(
        groups: GroupItem[]
    ) {
        this.groups = groups;
    }

    public getGroups(): GroupItem[] {
        return this.groups;
    }
 

    /**
     * 获取指定名称的group
     * @param name group的名称
     * @returns 指定名称的group
     */
    public getGroupByName(name:string):GroupItem|undefined{
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
        const isActiveGroup = this.groups.find(group => group.label === name)?.active;
        
        // 先过滤掉要删除的group
        this.groups = this.groups.filter(group => group.label !== name);

        // 如果删除的是激活的group,则激活order最小的group
        if (isActiveGroup && this.groups.length > 0) {
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
    public addGroup(name: string,isActive:boolean=false) {
        // 生成唯一id
        
        const id:string=name;

        // 名字唯一
        if(this.getGroupByName(name)){
            throw new Error(`Group ${name} already exists`);
        }
     
        
        // 获取最大的order
        const maxOrder = this.groups.reduce((max, group) => 
            group.order > max ? group.order : max, 
            0
        );

        // 创建新group
        const newGroup: GroupItem = new GroupItem(id, name, maxOrder + 1,isActive);

        // 添加到groups中
        this.groups.push(newGroup);
    }

    public activateGroupById(name:string):void{
        this.groups.forEach(group => {
            group.active = group.label === name;
        });
    }

    public moveFile(file:GitFileItem,targetGroup:GroupItem):void{
        // 从源分组移除
        const sourceGroup = this.groups.find(group => group.files.includes(file));
        if (sourceGroup) {
            sourceGroup.removeFile(file);
        }
        // 添加到目标分组
        targetGroup.addFile(file);
    }


}

