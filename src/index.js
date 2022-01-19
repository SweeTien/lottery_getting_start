/* eslint-disable */
import './index.css';
import './css/animate.min.css';
import './lib/ajax';
import { NUMBER_MATRIX } from './config.js';
import * as server from './lib/server.js';

import {
  getTempData
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
  // TWEEN.update(); /// TO DO
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
        saveData().then(res => {
          resetCard().then(res => {
            // 將之前的紀錄置空
            currentLuckys = [];
          });
          exportData();
          addQipao(`數據已保存到EXCEL中。`);
        });
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
      transform(targets.table, 2000);
      break;
    default:
      btns.enter.classList.add("none");
      btns.lotteryBar.classList.remove("none");
      transform(targets.sphere, 2000);
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
      // changeCard(cardIndex, basicData.leftUsers[index]); /// TO DO
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