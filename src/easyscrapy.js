let https = require('https');
let fs = require('fs');
let fse = require('fs-extra');
let path = require('path');
let lineReader = require('line-by-line');

let rName = './output.csv';
let inputCsvName = "";
function getInfoStr(d, u){
  let htmlContent = d.toString();
  let resultStr = [];
  try {
    if (htmlContent.includes("过于频繁")){
      resultStr = [u, "频繁","频繁"];
    }
    else if (htmlContent.includes("本条微博已被删除!")){
      resultStr = [u, "已删除","已删除"];
    } else{
      let p = /"url":\s*"(.+)?"/g;
      let urlArray = htmlContent.match(p);
      let picStr;
      if (urlArray){
        let picArr = [...new Set(urlArray.map(v => v.split(": ")[1].replace(/[\s"]/g, '')))];
        picStr = picArr.filter(v => v.indexOf("large") < 0 && v.indexOf("thumbnail") < 0).map(v => v.substring(v.lastIndexOf('/')+1)).join(';');
      } 
      else{
        picStr = "无内容";
      }
      let otherr = /"stream_url":\s*"(.*)"/g;
      let streamArray = htmlContent.match(otherr);
      let streamStr;
      if (streamArray){
        streamStr = streamArray.map(v => v.split(": ")[1].replace(/[\s"]/g, ''));
      } 
      else{
        streamStr = "无内容";
      }
      resultStr.push(u);
      resultStr.push(picStr);
      resultStr.push(streamStr);
    }

    let writeDownRe = resultStr.join(",") + "\r\n";
    writeFileContent(rName, writeDownRe);
  } catch (error) {
    let a = error;
  }

  lr.resume();
}

function writeFileContent(rName, writeDownRe){
    if (fs.existsSync(rName)){
      fs.appendFileSync(rName, writeDownRe);
    } else{
      fs.writeFileSync(rName, writeDownRe);
    }
}

let getPage = function(furl){
  let url = furl;
  let path = url.substring(url.lastIndexOf("/") + 1);
  let req = https.get({
    host: 'm.weibo.cn',
    path: `/status/${path}`,
    headers: {
      'User-Agent': 'spider'
    }
  }, res => {
    let pageContent = '';
    res.on('data', function(d){
      pageContent += d.toString();
    });

    res.on('end', () => {
      getInfoStr(pageContent, url);
    })
  })
  req.end();
}

let lr;
let first = true;
let noBusy = false;
let dialog;
let sevent;


export default function Runscrapy(inputFileName, dialogService, event){
  if (!dialog){
    dialog = dialogService;
    sevent = event;
  }
  inputCsvName = inputFileName;
  fs.access('./tempfile', checkError);
}

function checkError(e){
  if(e){
      fs.mkdir('./tempfile');
  }
  fs.access(path.join('./tempfile', 'input.csv'), e => {
    // 因为除第一次之外tempfile文件夹的输入文件都是程序复制进去的所以就不用清空之前的残留文件了
    if (first){
      if(!e){
        fs.unlinkSync('./tempfile/input.csv');
      }
      fse.copySync(inputCsvName, './tempfile/input.csv')
    }  
    doFile();
  });
}

function doFile(){
  lr = new lineReader(inputCsvName);
  lr.on('line', line => {
    if(first){
      setTimeout(getPage, 500, line.split(",")[0]);
      lr.pause();
    } else{
      if (line.includes("频繁") || line.includes("繁忙")) {
        setTimeout(getPage, 500, line.split(",")[0]);
        noBusy = false;
        lr.pause();
      } else{
        writeFileContent(rName, line + "\r\n" );
      }
    }
  })

  lr.on('end', function(){
    try{
      first = false;
      noBusy = true;
      if(!noBusy){
        fs.unlinkSync('./tempfile/input.csv');
        fs.link('./output.csv', path.join('./tempfile', 'input.csv'), e => {});
        console.log("delete old input")
        fs.unlinkSync('./output.csv');
        console.log("rename finish")
        Runscrapy('./tempfile/input.csv')
      } else {
        sevent.emit('sraend');
      }
    } catch(e){
      dialog.showErrorBox("爬虫执行错误", e);
    }
  });
}