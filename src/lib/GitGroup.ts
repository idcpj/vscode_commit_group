export type GroupType = {
    order: number;
    id: string;
    name: string;
    active: boolean;
}

export class GitGroup {
    private groups: GroupType[];
    constructor(
        groups: GroupType[]
    ) {
        this.groups = groups;
    }
    /**
     * 激活指定id的group
     * @param id group的id
     */
    public activateGroup(id: string): void {
        this.groups = this.groups.map(group => {
            return {
                ...group,
                active: group.id === id
            };
        });
    }
    
    /**
     * 删除指定id的group
     * @param id group的id
     */
    public deleteGroup(id: string): void {
        // 判断要删除的是否为激活的group
        const isActiveGroup = this.groups.find(group => group.id === id)?.active;
        
        // 先过滤掉要删除的group
        this.groups = this.groups.filter(group => group.id !== id);

        // 如果删除的是激活的group,则激活order最小的group
        if (isActiveGroup && this.groups.length > 0) {
            const minOrderGroup = this.groups.reduce((prev, curr) => 
                prev.order < curr.order ? prev : curr
            );
            this.activateGroup(minOrderGroup.id);
        }
    }
    
    /**
     * 添加新的group
     * @param name group的名称
     * @returns 新添加的group的id
     */
    public addGroup(name: string): string {
        // 生成唯一id
        const id = Date.now().toString();
        
        // 获取最大的order
        const maxOrder = this.groups.reduce((max, group) => 
            group.order > max ? group.order : max, 
            0
        );

        // 创建新group
        const newGroup: GroupType = {
            id,
            name,
            order: maxOrder + 1,
            active: false
        };

        // 添加到groups中
        this.groups.push(newGroup);

        // 如果是第一个group,则激活它
        if (this.groups.length === 1) {
            this.activateGroup(id);
        }

        return id;
    }
}

