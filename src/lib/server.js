import userData from '../data/data.json';
import * as cfg from '../data/config.js';

const {
  shuffle,
  loadTempData
} = require("./help");

let curData = {},
  luckyData = {},
  errorData = [];
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
  return {"cfgData": cfg, "leftUsers": curData.leftUsers, "luckyData": luckyData};
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

export {
  curData
};