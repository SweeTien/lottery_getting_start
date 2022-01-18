import userData from '../data/data.json';
const {
  shuffle
} = require("./help");

let curData = {},
  luckyData = {},
  errorData = [];
loadData();
function loadData() {
  console.log("加载EXCEL数据文件");
  let cfgData = {};
  curData.users = userData;
  // 重新洗牌
  shuffle(curData.users);

  // 读取已经抽取的结果
  // loadTempData()
  //   .then(data => {
  //     luckyData = data[0];
  //     errorData = data[1];
  //   })
  //   .catch(data => {
  //     curData.leftUsers = Object.assign([], curData.users);
  //   });
}

export {
  curData
};