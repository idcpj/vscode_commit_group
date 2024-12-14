
import * as vscode from 'vscode';
import { SdkType } from '../@type/type';


// 创建一个新的 WebviewViewProvider
export class WebviewViewManager implements vscode.WebviewViewProvider {
    private sdk: SdkType;
    public static readonly viewType = 'commit-input-view';

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

        webviewView.webview.onDidReceiveMessage(data => {
            try {

                if (data.type === "commit") {
                    let fileList = this.sdk.getTreeViewManager().getSelectedFileList();
                    if (fileList.length === 0) {
                        fileList = this.sdk.getGitGroupManager().file_getAcitveGroupFileList();
                    }

                    console.log("fileList", fileList);

                    // this.sdk.getGitManager().commitByPathList(fileList,data.message);
                }
            } catch (e: any) {
                vscode.window.showErrorMessage("提交失败:", e.message);
            }
        });
    }


    private renderHtml() {
        return `
            <!DOCTYPE html>
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
                            
                        #tips{
                            color: #888888;
                            font-size: 13px;
                            margin-top: 8px;
                        }
                    </style>
                </head>
                <body>

                    <input type="text" id="commitMessage"placeholder="输入 Git 提交信息..."  >

                    <button id="commitButton">提交</button>

                    <div id="tips">
                        1. 提交 commit  时,默认选择激活的分组<br/>
                        2. 如果选中某个分组,则提交 commit 时,提交选中的分组
                    </div>

                    <script>
                        const vscode = acquireVsCodeApi();
                        document.getElementById('commitMessage').addEventListener('keyup', (e) => {
                            if (e.key === 'Enter') {
                                vscode.postMessage({ 
                                    type: 'commit',
                                    message: e.target.value 
                                });
                                e.target.value = '';
                            }
                        });
                    </script>
                </body>
            </html>
        `
    }
}
