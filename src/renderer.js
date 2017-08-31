// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
import scra from './easyscrapy'
import { remote } from 'electron'
import EventEmitter from 'events'

let e = new EventEmitter();

e.on('sraend', ()=>{
    remote.dialog.showMessageBox({
        buttons:["OK"],
        title:"结束",
        message: "成功"
    })
    document.getElementById("start").disabled = false;
    document.getElementById("info").style.display = 'none';
})

let path = "";

export function setCsvPath(e){
    path = e.files[0].path;
    document.getElementById('filepath').value = path;
}

export function scrapy(){
    if (path === "") {
        remote.dialog.showErrorBox("错误", "URL文件路径不能为空");
        return;
    };
    document.getElementById("start").disabled = true;
    document.getElementById("info").style.display = 'block';
    scra(path, remote.dialog, e);
}
