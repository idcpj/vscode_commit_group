
import * as vscode from 'vscode';
import { SdkType } from '../@type/type';


// 创建一个新的 WebviewViewProvider
export class WebviewViewManager implements vscode.WebviewViewProvider {
    private sdk: SdkType;
    private webviewView: vscode.WebviewView | undefined;

    constructor(sdk: SdkType) {
        this.sdk = sdk;
    }

    resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {

        webviewView.webview.options = {
            enableScripts: true
        };


        webviewView.webview.html = this.renderHtml();

        webviewView.webview.onDidReceiveMessage(async data => {
            try {

                if (data.type === "commit") {
                    let fileList: string[] = [];

                    // 如果选中分组,则只检测分组,没选中则使用默认
                    if (this.sdk.getTreeViewManager().isSelectGroup() || this.sdk.getTreeViewManager().isSelectFile()) {
                        fileList = this.sdk.getTreeViewManager().getSelectedFileList();
                    } else {
                        fileList = this.sdk.getGitGroupManager().file_getAcitveGroupFileList();
                    }

                    if (fileList.length == 0) {
                        throw new Error("没有选中文件");
                    }

                    // 添加确认框
                    // const confirm = await vscode.window.showInformationMessage("确认提交吗?", "确定", "取消");
                    // if (confirm == "取消") {
                    //     return;
                    // }

                    console.log("fileList", fileList);

                    this.sdk.getGitManager().commitByPathList(fileList,data.message);
                    this.sdk.refresh();
                }
            } catch (e: any) {
                vscode.window.showErrorMessage("提交失败:" + e.message, "确定");
            }
        });

        this.webviewView = webviewView;

    }

    public setDescription(description: string) {
        if (this.webviewView) {
            this.webviewView.description = description;
        }
    }


    private renderHtml() {
        return `<!DOCTYPE html>
            <html>
                <head>
                    <style>
                        #commitMessage{
                            width: 99%;
                            height: 24px;
                            background: #3C3C3C;
                            color: #CCCCCC;
                            border: 1px solid #3C3C3C;
                            margin-bottom: 8px;
                            outline: none;
                        }

                        #commitButton{
                            background: #0E639C;
                            color: white;
                            border: none;
                            cursor: pointer;
                            font-size: 13px;
                            width: 100%;
                            height: 24px;
                        }
                        #commitButton:hover{
                            background: #026ec1;
                        }
                            
                        .tips{
                            color: #888888;
                            font-size: 13px;
                            margin-top: 8px;
                            margin:
                        }
                    </style>
                </head>
                <body>
                    
                    <input type="text" id="commitMessage" placeholder="输入 Git 提交信息..."  >

                    <button id="commitButton">提交</button>

                    <div class="tips">
                        1. 提交 commit  时,默认选择激活的分组<br/>
                        2. 如果选中某个分组,则提交 commit 时,提交选中的分组
                    </div>

                    <script>
                        const vscode = acquireVsCodeApi();
                        console.log("vscode",vscode);
                        
                        document.getElementById('commitMessage').addEventListener('keyup', (e) => {
                            if (e.key === 'Enter') {
                                vscode.postMessage({ 
                                    type: 'commit',
                                    message: e.target.value 
                                });
                                e.target.value = '';
                            }
                        });
                        
                        document.getElementById('commitButton').addEventListener('click', (e) => {
                            const message = document.getElementById('commitMessage');
                            if(!message){
                                return;
                            }
                            vscode.postMessage({ 
                                type: 'commit',
                                message: message.value
                            });
                           message.value = '';
                        });
                    </script>
                </body>
            </html>
        `
    }
}
