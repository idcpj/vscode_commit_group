import * as path from "path";

import { runTests } from '@vscode/test-electron';

async function main() {
  try {

	const extensionDevelopmentPath = path.resolve(__dirname, '../../');
    const extensionTestsPath = path.resolve(__dirname, './suite1/');
    // Download VS Code, unzip it and run the integration test
    await runTests({ 
        extensionDevelopmentPath, 
        extensionTestsPath });

    // 存在多个时,在运行 runTest

    // const extensionTestsPath2 = path.resolve(__dirname, './suite2/');
    // // Download VS Code, unzip it and run the integration test
    // await runTests({ 
    //     extensionDevelopmentPath, 
    //     extensionTestsPath2 });

  } catch (err) {
    console.error("Failed to run tests");
    process.exit(1);
  }
}

main();
