var electronInstaller = require('electron-winstaller');


resultPromise = electronInstaller.createWindowsInstaller({
    appDirectory: './../easyscrapy',
    outputDirectory: './intallerpath',
    authors: '123',
    exe: '爬虫.exe'
  });

resultPromise.then(() => console.log("It worked!"), (e) => console.log(`No dice: ${e.message}`));