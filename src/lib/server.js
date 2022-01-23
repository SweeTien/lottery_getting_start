import userData from '../data/data.json';
import * as cfg from '../data/config.js';

const {
  shuffle,
  loadTempData,
  saveErrorDataFile,
  saveDataFile,
  writeXML
} = require("./help");

let curData = {},
  luckyData = {},
  errorData = [],
  defaultType = cfg.prizes[0]["type"],
  defaultPage = `default data`;;
loadData();

function loadData() {
  console.log("加載EXCEL數據文件");
  let cfgData = {};
  curData.users = userData;
  // 重新洗牌
  shuffle(curData.users);

  // 讀取已經抽取的结果
  let tempData = loadTempData()
  luckyData = tempData[0];
  errorData = tempData[1];
    // .catch(data => {
    //   curData.leftUsers = Object.assign([], curData.users);
    // });
}

export function getTempData() {
  getLeftUsers();
  return {"cfgData": JSON.parse(JSON.stringify(cfg)),
          "leftUsers": JSON.parse(JSON.stringify(curData.leftUsers)),
          "luckyData": JSON.parse(JSON.stringify(luckyData))};
}

function getLeftUsers() {
  //  紀錄當前已抽取的用户
  let lotteredUser = {};
  for (let key in luckyData) {
    let luckys = luckyData[key];
    luckys.forEach(item => {
      lotteredUser[item[0]] = true;
    });
  }
  // 紀錄當前已抽取但是不在線人員
  errorData.forEach(item => {
    lotteredUser[item[0]] = true;
  });

  let leftUsers = Object.assign([], curData.users);
  leftUsers = leftUsers.filter(user => {
    return !lotteredUser[user[0]];
  });
  curData.leftUsers = leftUsers;
}

export function serverReset() {
  luckyData = {};
  errorData = [];
  log(`重置數據成功`);
  saveErrorDataFile(errorData);
  saveDataFile(luckyData);
}

export function serverSaveData(type, data) {
  setLucky(type, data);
  log(`保存獎品數據成功`);
}

function setLucky(type, data) {
  if (luckyData[type]) {
    luckyData[type] = luckyData[type].concat(data);
  } else {
    luckyData[type] = Array.isArray(data) ? data : [data];
  }

  saveDataFile(luckyData);
}

// 保存抽獎數據
export function serverErrorData(data) {
  setErrorData(data);
  log(`保存沒来人員數據成功`);
}

function setErrorData(data) {
  errorData = errorData.concat(data);
  saveErrorDataFile(errorData);
}

// 保存數據到excel中去
export function serverExport() {
  let type = [1, 2, 3, 4, 5, defaultType],
      outData = [["\n"],["工號", "姓名", "部門\n"]];
  cfg.prizes.forEach(item => {
    let thisPrizeLucky = [];
    outData.push([item.text,item.title]+"\n");

    if (luckyData[item.type] !== undefined) {
      luckyData[item.type].forEach(item => {
        thisPrizeLucky.push(item+"\n");
      });
    }
    
    outData = outData.concat(thisPrizeLucky);
  });
  console.log(outData);
  let url = "抽獎结果.xlsx"

  var blobData = new Blob([outData], { type: 'application/vnd.ms-excel' });
  url = (window.URL ? URL : webkitURL).createObjectURL(blobData);
  log(`導出數據成功！:`+url);
  return url;
}

function log(text) {
  global.console.log(text);
  global.console.log("-----------------------------------------------");
}

export {
  curData
};