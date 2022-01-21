/* eslint-disable */
import './index.css';
import './css/animate.min.css';
import './lib/ajax';
import { NUMBER_MATRIX } from './config.js';
import * as server from './lib/server.js';

import {
  getTempData,
  serverReset,
  serverSaveData,
  serverErrorData,
  serverExport
} from "./lib/server.js";

import {
  addQipao,
  setPrizes,
  showPrizeList,
  setPrizeData,
  resetPrize
} from "./prizeList";

import gsap from "gsap";
import * as THREE from 'three';
import {TrackballControls} from 'three/examples/jsm/controls/TrackballControls';
import { CSS3DRenderer, CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer.js';

const ROTATE_TIME = 3000;
const BASE_HEIGHT = 1080;

let TOTAL_CARDS,
  btns = {
    enter: document.querySelector("#enter"),
    lotteryBar: document.querySelector("#lotteryBar")
  },
  prizes,
  EACH_COUNT,
  ROW_COUNT = 7,
  COLUMN_COUNT = 17,
  COMPANY,
  HIGHLIGHT_CELL = [],
  // 當前的比例
  Resolution = 1;

let camera,
  scene,
  renderer,
  controls,
  threeDCards = [],
  targets = {
    table: [],
    sphere: []
  };

let selectedCardIndex = [],
  rotate = false,
  basicData = {
    prizes: [], //獎品信息
    users: [], //所有人員
    luckyUsers: {}, //已中獎人員
    leftUsers: [] //未中獎人員
  },
  interval,
  // 當前抽的獎項，從最低獎開始抽，直到抽到大獎
  currentPrizeIndex,
  currentPrize,
  // 正在抽獎
  isLotting = false,
  currentLuckys = [];

initAll();

function initAll() {
  serverGetTempData(server.getTempData());
  serverGetUsers(server.curData.users);

  // document.cookie = "username=John Doe";
  // console.log(document.cookie);
}

function serverGetTempData(data) {
  prizes = data["cfgData"].prizes;
  EACH_COUNT = data["cfgData"].EACH_COUNT;
  COMPANY = data["cfgData"].COMPANY;
  HIGHLIGHT_CELL = createHighlight();
  basicData.prizes = prizes;
  setPrizes(prizes);

  TOTAL_CARDS = ROW_COUNT * COLUMN_COUNT;

  // 讀取當前已設置的抽獎结果
  basicData.leftUsers = data["leftUsers"];
  basicData.luckyUsers = data["luckyData"];

  let prizeIndex = basicData.prizes.length - 1;
  for (; prizeIndex > -1; prizeIndex--) {
    if (
      data["luckyData"][prizeIndex] &&
      data["luckyData"][prizeIndex].length >=
        basicData.prizes[prizeIndex].count
    ) {
      continue;
    }
    currentPrizeIndex = prizeIndex;
    currentPrize = basicData.prizes[currentPrizeIndex];
    break;
  }

  showPrizeList(currentPrizeIndex);
  let curLucks = basicData.luckyUsers[currentPrize.type];
  setPrizeData(currentPrizeIndex, curLucks ? curLucks.length : 0, true);
}

function createHighlight() {
  let year = new Date().getFullYear() + "";
  let step = 4,
    xoffset = 1,
    yoffset = 1,
    highlight = [];

  year.split("").forEach(n => {
    highlight = highlight.concat(
      NUMBER_MATRIX[n].map(item => {
        return `${item[0] + xoffset}-${item[1] + yoffset}`;
      })
    );
    xoffset += step;
  });

  return highlight;
}

function serverGetUsers(data) {
  console.log(data);
  console.log(document.cookie);
  basicData.users = data;

  initCards();
  animate();
  shineCard();
}

function initCards() {
  let member = basicData.users,
    showCards = [],
    length = member.length;

  let isBold = false,
    showTable = basicData.leftUsers.length === basicData.users.length,
    index = 0,
    totalMember = member.length,
    position = {
      x: (140 * COLUMN_COUNT - 20) / 2,
      y: (180 * ROW_COUNT - 20) / 2
    };

  camera = new THREE.PerspectiveCamera(
    40,
    window.innerWidth / window.innerHeight,
    1,
    10000
  );
  camera.position.z = 3000;

  scene = new THREE.Scene();

  for (let i = 0; i < ROW_COUNT; i++) {
    for (let j = 0; j < COLUMN_COUNT; j++) {
      isBold = HIGHLIGHT_CELL.includes(j + "-" + i);
      var element = createCard(
        member[index % length],
        isBold,
        index,
        showTable
      );

      var object = new CSS3DObject(element);
      object.position.x = Math.random() * 4000 - 2000;
      object.position.y = Math.random() * 4000 - 2000;
      object.position.z = Math.random() * 4000 - 2000;
      scene.add(object);
      threeDCards.push(object);
      //

      var object = new THREE.Object3D();
      object.position.x = j * 140 - position.x;
      object.position.y = -(i * 180) + position.y;
      targets.table.push(object);
      index++;
    }
  }
  // sphere

  var vector = new THREE.Vector3();

  for (var i = 0, l = threeDCards.length; i < l; i++) {
    var phi = Math.acos(-1 + (2 * i) / l);
    var theta = Math.sqrt(l * Math.PI) * phi;
    var object = new THREE.Object3D();
    object.position.setFromSphericalCoords(800 * Resolution, phi, theta);
    vector.copy(object.position).multiplyScalar(2);
    object.lookAt(vector);
    targets.sphere.push(object);
  }

  renderer = new CSS3DRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.getElementById("container").appendChild(renderer.domElement);

  //

  controls = new TrackballControls(camera, renderer.domElement);
  controls.rotateSpeed = 0.5;
  controls.minDistance = 500;
  controls.maxDistance = 6000;
  controls.addEventListener("change", render);

  bindEvent();

  if (showTable) {
    switchScreen("enter");
  } else {
    switchScreen("lottery");
  }
}

function animate() {
  // 讓場景通過x軸或者y軸旋轉
  // rotate && (scene.rotation.y += 0.088);

  requestAnimationFrame(animate);
  // gsap.play(); /// TO DO
  controls.update();

  // 渲染循環
  // render();
}

function setLotteryStatus(status = false) {
  isLotting = status;
}

/**
 * 事件绑定
 */
 function bindEvent() {
  document.querySelector("#menu").addEventListener("click", function (e) {
    e.stopPropagation();
    // 如果正在抽獎，則禁止一切操作
    if (isLotting) {
      addQipao("抽慢一點點～～");
      return false;
    }

    let target = e.target.id;
    switch (target) {
      // 顯示數字牆
      case "welcome":
        switchScreen("enter");
        rotate = false;
        break;
      // 進入抽獎
      case "enter":
        removeHighlight();
        addQipao(`馬上抽取[${currentPrize.title}],不要走開。`);
        // rotate = !rotate;
        rotate = true;
        switchScreen("lottery");
        break;
      // 重置
      case "reset":
        let doREset = window.confirm(
          "是否確認重置數據，重置後，當前已抽的獎項全部清空？"
        );
        if (!doREset) {
          return;
        }
        addQipao("重置所有數據，重新抽獎");
        addHighlight();
        resetCard();
        // 重置所有數據
        currentLuckys = [];
        basicData.leftUsers = Object.assign([], basicData.users);
        basicData.luckyUsers = {};
        currentPrizeIndex = basicData.prizes.length - 1;
        currentPrize = basicData.prizes[currentPrizeIndex];

        resetPrize(currentPrizeIndex);
        reset();
        switchScreen("enter");
        break;
      // 抽獎
      case "lottery":
        console.log("lottery");
        setLotteryStatus(true);
        // 每次抽獎前先保存上一次的抽獎數據
        saveData();
        //更新剩餘抽獎數目的數據顯示
        changePrize();
        resetCard().then(res => {
          // 抽獎
          lottery();
        });
        addQipao(`正在抽取[${currentPrize.title}],調整好姿勢`);
        break;
      // 重新抽獎
      case "reLottery":
        if (currentLuckys.length === 0) {
          addQipao(`當前還沒有抽獎，無法重新抽取喔~~`);
          return;
        }
        setErrorData(currentLuckys);
        addQipao(`重新抽取[${currentPrize.title}],做好準備`);
        setLotteryStatus(true);
        // 重新抽獎則直接進行抽取，不對上一次的抽獎數據進行保存
        // 抽獎
        resetCard().then(res => {
          // 抽獎
          lottery();
        });
        break;
      // 導出抽獎结果
      case "save":
        saveData();
        resetCard().then(res => {
          // 將之前的紀錄置空
          currentLuckys = [];
        });
        exportData();
        addQipao(`數據已保存到EXCEL中。`);
        break;
    }
  });

  window.addEventListener("resize", onWindowResize, false);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  render();
}

function switchScreen(type) {
  switch (type) {
    case "enter":
      btns.enter.classList.remove("none");
      btns.lotteryBar.classList.add("none");
      transform(targets.table, 2);
      break;
    default:
      btns.enter.classList.add("none");
      btns.lotteryBar.classList.remove("none");
      transform(targets.sphere, 2);
      break;
  }
}

/**
 * 渲染地球等
 */
 function transform(targets, duration) {
  for (var i = 0; i < threeDCards.length; i++) {
    var object = threeDCards[i];
    var target = targets[i];

    gsap.to(object.position, 
      { 
        x: target.position.x, 
        y: target.position.y, 
        z: target.position.z,
        duration: Math.random() * duration + duration,
        ease: "expo.inOut"
      }
    );

    gsap.to(object.rotation, 
      { 
        x: target.rotation.x, 
        y: target.rotation.y, 
        z: target.rotation.z,
        duration: Math.random() * duration + duration,
        ease: "expo.inOut",
      }
    );
  }

  gsap.to(this, 
    { 
      duration: duration * 2,
      onUpdate: render,
    }
  );
}

/**
 * 創建元素
 */
 function createElement(css, text) {
  let dom = document.createElement("div");
  dom.className = css || "";
  dom.innerHTML = text || "";
  return dom;
}

/**
 * 創建名牌
 */
 function createCard(user, isBold, id, showTable) {
  var element = createElement();
  element.id = "card-" + id;

  if (isBold) {
    element.className = "element lightitem";
    if (showTable) {
      element.classList.add("highlight");
    }
  } else {
    element.className = "element";
    element.style.backgroundColor =
      "rgba(0,127,127," + (Math.random() * 0.7 + 0.25) + ")";
  }
  //添加公司標示
  element.appendChild(createElement("company", COMPANY));

  element.appendChild(createElement("name", user[1]));

  element.appendChild(createElement("details", user[0] + "<br/>" + user[2]));
  return element;
}

function render() {
  renderer.render(scene, camera);
}

/**
 * 隨機切换背景和人員信息
 */
 function shineCard() {
  let maxCard = 10,
    maxUser;
  let shineCard = 10 + random(maxCard);

  setInterval(() => {
    // 正在抽獎停止閃爍
    if (isLotting) {
      return;
    }
    maxUser = basicData.leftUsers.length;
    for (let i = 0; i < shineCard; i++) {
      let index = random(maxUser),
        cardIndex = random(TOTAL_CARDS);
      // 當前顯示的已抽中名單不進行隨機切換
      if (selectedCardIndex.includes(cardIndex)) {
        continue;
      }
      shine(cardIndex);
      changeCard(cardIndex, basicData.leftUsers[index]);
    }
  }, 500);
}

/**
 * 隨機抽獎
 */
 function random(num) {
  // Math.floor取到0-num-1之間數字的概率是相等的
  return Math.floor(Math.random() * num);
}

/**
 * 切換名牌背景
 */
function shine(cardIndex, color) {
  let card = threeDCards[cardIndex].element;
  card.style.backgroundColor =
    color || "rgba(0,127,127," + (Math.random() * 0.7 + 0.25) + ")";
}

/**
 * 切換名牌人員信息
 */
 function changeCard(cardIndex, user) {
  let card = threeDCards[cardIndex].element;

  card.innerHTML = `<div class="company">${COMPANY}</div><div class="name">${
    user[1]
  }</div><div class="details">${user[0]}<br/>${user[2] || "PSST"}</div>`;
}

function removeHighlight() {
  document.querySelectorAll(".highlight").forEach(node => {
    node.classList.remove("highlight");
  });
}

function addHighlight() {
  document.querySelectorAll(".lightitem").forEach(node => {
    node.classList.add("highlight");
  });
}

/**
 * 重置抽奖牌内容
 */
function resetCard(duration = 500) {
  if (currentLuckys.length === 0) {
    return Promise.resolve();
  }

  selectedCardIndex.forEach(index => {
    let object = threeDCards[index],
      target = targets.sphere[index];

    gsap.to(object.position, 
      { 
        x: target.position.x, 
        y: target.position.y, 
        z: target.position.z,
        duration: Math.random() * duration + duration,
        ease: "expo.inOut",
      }
    );

    gsap.to(object.rotation, 
      { 
        x: target.rotation.x, 
        y: target.rotation.y, 
        z: target.rotation.z,
        duration: Math.random() * duration + duration,
        ease: "expo.inOut",
      }
    );
  });

  return new Promise((resolve) => {
    gsap.to(this, 
      { 
        duration: duration * 2,
        onUpdate: render,
        onComplete: () => {
          selectedCardIndex.forEach(index => {
            let object = threeDCards[index];
            object.element.classList.remove("prize");
          });
          resolve();
        }
      }
    );
  });
}

function reset() {
  serverReset();
  console.log("重置成功");
}

/**
 * 保存上一次的抽獎结果
 */
function saveData() {
  if (!currentPrize) {
    //若獎品抽完，則不再紀錄數據，但是還是可以進行抽獎
    return;
  }

  let type = currentPrize.type,
    curLucky = basicData.luckyUsers[type] || [];

  curLucky = curLucky.concat(currentLuckys);

  basicData.luckyUsers[type] = curLucky;

  if (currentPrize.count <= curLucky.length) {
    currentPrizeIndex--;
    if (currentPrizeIndex <= -1) {
      currentPrizeIndex = 0;
    }
    currentPrize = basicData.prizes[currentPrizeIndex];
  }

  if (currentLuckys.length > 0) {
    // todo by xc 添加數據保存機制，以免服務器掛掉數據丢失
    setData(type, currentLuckys);
  }
}

function setData(type, data) {
  serverSaveData(type, data);
}

function changePrize() {
  let luckys = basicData.luckyUsers[currentPrize.type];
  let luckyCount = (luckys ? luckys.length : 0) + EACH_COUNT[currentPrizeIndex];
  // 修改左側prize的數目和百分比
  setPrizeData(currentPrizeIndex, luckyCount);
}

function setErrorData(data) {
  serverErrorData(data);
}

function exportData() {
  let url = serverExport();
  location.href = url;
}

/**
 * 抽獎
 */
function lottery() {
  rotateBall().then(() => {
    // 將之前的紀錄置空
    currentLuckys = [];
    selectedCardIndex = [];
    // 當前同時抽取的數目,當前獎品抽完還可以繼續抽，但是不紀錄數據
    let perCount = EACH_COUNT[currentPrizeIndex],
      luckyData = basicData.luckyUsers[currentPrize.type],
      leftCount = basicData.leftUsers.length,
      leftPrizeCount = currentPrize.count - (luckyData ? luckyData.length : 0);

    if (leftCount === 0) {
      addQipao("人員已抽完，現在重新設置所有人員可以進行二次抽獎！");
      basicData.leftUsers = basicData.users;
      leftCount = basicData.leftUsers.length;
    }

    for (let i = 0; i < perCount; i++) {
      let luckyId = random(leftCount);
      currentLuckys.push(basicData.leftUsers.splice(luckyId, 1)[0]);
      leftCount--;
      leftPrizeCount--;

      let cardIndex = random(TOTAL_CARDS);
      while (selectedCardIndex.includes(cardIndex)) {
        cardIndex = random(TOTAL_CARDS);
      }
      selectedCardIndex.push(cardIndex);

      if (leftPrizeCount === 0) {
        break;
      }
    }

    // console.log(currentLuckys);
    selectCard();
  });
}

function rotateBall() {
  return new Promise((resolve) => {
    scene.rotation.y = 0;
    gsap.to(scene.rotation, 
      { 
        y: Math.PI * 8,
        duration: ROTATE_TIME,
        ease: "expo.inOut",
        onUpdate: render,
        onComplete: resolve,
      }
    );
  });
}

function selectCard(duration = 600) {
  rotate = false;
  let width = 140,
    tag = -(currentLuckys.length - 1) / 2,
    locates = [];

  // 計算位置信息, 大於5個分兩排顯示
  if (currentLuckys.length > 5) {
    let yPosition = [-87, 87],
      l = selectedCardIndex.length,
      mid = Math.ceil(l / 2);
    tag = -(mid - 1) / 2;
    for (let i = 0; i < mid; i++) {
      locates.push({
        x: tag * width * Resolution,
        y: yPosition[0] * Resolution
      });
      tag++;
    }

    tag = -(l - mid - 1) / 2;
    for (let i = mid; i < l; i++) {
      locates.push({
        x: tag * width * Resolution,
        y: yPosition[1] * Resolution
      });
      tag++;
    }
  } else {
    for (let i = selectedCardIndex.length; i > 0; i--) {
      locates.push({
        x: tag * width * Resolution,
        y: 0 * Resolution
      });
      tag++;
    }
  }

  let text = currentLuckys.map(item => item[1]);
  addQipao(
    `恭喜${text.join("、")}獲得${currentPrize.title}, 新的一年必定旺旺旺。`
  );

  selectedCardIndex.forEach((cardIndex, index) => {
    changeCard(cardIndex, currentLuckys[index]);  //TODO fix this function
    var object = threeDCards[cardIndex];

    gsap.to(object.position, 
      { 
        x: locates[index].x,
        y: locates[index].y * Resolution,
        z: 2200,
        duration: Math.random() * duration + duration,
        ease: "expo.inOut",
      }
    );

    gsap.to(object.rotation, 
      { 
        x: 0,
        y: 0,
        z: 0,
        duration: Math.random() * duration + duration,
        ease: "expo.inOut",
      }
    );

    object.element.classList.add("prize");
    tag++;
  });

  gsap.to(this, 
    { 
      duration: duration * 2,
      onUpdate: render,
      onComplete: () => {
        // 动画结束后可以操作
        setLotteryStatus();
      },
    }
  );
}


