let tempJson = {}, errorJson = [];

/**
 * 洗牌算法
 * @param {*} arr
 */
function shuffle(arr) {
  let i = arr.length;
  while (i) {
    let j = Math.floor(Math.random() * i--);
    let temp = arr[j];
    arr[j] = arr[i];
    arr[i] = temp;
  }
}

/**
 * 讀取缓存的數據内容
 */
function loadTempData() {
  let pros = [];
  pros.push(tempJson);
  pros.push(errorJson);

  return pros;
}

/**
 * 錯誤日誌文件輸出
 * @param {*} data
 */
function saveErrorDataFile(data) {
  errorJson = data;
  console.log("數據寫入成功");
}

/**
 * 寫入文件
 * @param {*} data
 */
function saveDataFile(data) {
  tempJson = data;
  console.log("數據寫入成功");
}

module.exports = {
  shuffle,
  loadTempData,
  saveErrorDataFile,
  saveDataFile
};