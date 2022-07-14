// ==UserScript==
// @name         B站大会员视频自动解析 -- 纯净版
// @namespace    http://tampermonkey.net/
// @version      0.0.7
// @icon         https://cdn.jsdelivr.net/gh/Anjude/pubsrc@img/1.png
// @description  浸入式虚拟会员体验，功能智能自动化。（兼容移动端）
// @author       anjude
// @match        https://*.bilibili.com/*
// @grant        GM_openInTab
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @original-script   https://github.com/Anjude/tampermonkey
// @require      https://lf26-cdn-tos.bytecdntp.com/cdn/expire-1-M/jquery/3.2.1/jquery.min.js
// @require     https://greasyfork.org/scripts/412159-mydrag/code/MyDrag.js?version=858320
// ==/UserScript==

(function () {
  "use strict";
  // resetScript()
  // console.log(GM_getValue('bili2sConf'));
  // return
  let bili2sConf = GM_getValue("bili2sConf");
  // 检查版本
  const RELEASE_VERSION = "0.0.7";
  let ENV = "RELEASE";
  // ENV = 'DEBUG'
  const updateVersion =
    ENV === "DEBUG" || RELEASE_VERSION !== GM_getValue("RELEASE_VERSION");
  updateVersion && GM_setValue("RELEASE_VERSION", RELEASE_VERSION);
  startHttpProxy();
  /**
   * 默认设置
   */
  let defaultBili2sConf = {
    parseApiIndex: 0, // 解析接口选择
    installTime: null,
  };

  // 网站配置
  const siteConfig = {
    delay2s: 2000,
    playerBox: ["#player_module"],
    videoBox: ["video"],
    vipAdClose: ["div.twp-mask > div > i"],
    parseApiList: [
      // 解析链接均收集自网络，经过简单测试
      // https://jx.bozrc.com:4433/player/?url=
      // {
      //   url: "https://vip.parwix.com:4433/player/?url=",
      //   name: "Parwix解析系统",
      // },
      { url: "https://jx.bozrc.com:4433/player/?url=", name: "夜幕解析" },
      { url: "https://z1.m1907.cn/?jx=", name: "m1907" },
      { url: "https://yparse.jn1.cc/index.php?url=", name: "云解析" },
      // { url: "https://www.yemu.xyz/?url=", name: "夜幕解析" },
      // { url: "https://vip.bljiex.cc/?v=", name: "BL解析" },
      // { url: "https://vip.mmkv.cn/tv.php?url=", name: "mmkv" },
      // { url: "https://vip5.jiexi.one/?url=", name: "爱爱蓝光解析" },
      // { url: 'https://www.1717yun.com/jx/ty.php?url=', name: '1717云解析' },
      // { url: 'https://jx.rdhk.net/?v=', name: '4080视频解析' },
      // { url: 'https://go.yh0523.cn/y.cy?url=', name: '盘古云解析' },
      // { url: 'https://17kyun.com/api.php?url=', name: '17kyun' },
      // { url: 'https://lecurl.cn/?url=', name: 'dplayer - by-le' },
    ],
    bangumiLi: ["li.ep-item.cursor.badge.visited"],
  };

  bili2sConf = GM_getValue("bili2sConf") || defaultBili2sConf;

  if (updateVersion) {
    let shortcutMap = Object.assign({}, defaultBili2sConf.shortcutMap);
    bili2sConf = Object.assign(defaultBili2sConf, bili2sConf);
    bili2sConf.shortcutMap = Object.assign(shortcutMap, bili2sConf.shortcutMap);
    console.log(
      shortcutMap,
      defaultBili2sConf.shortcutMap,
      bili2sConf.shortcutMap
    );
    GM_setValue("bili2sConf", bili2sConf);
    Toast("脚本已更新");
  }

  const delayExecute = (execution, delayMs) => {
    setTimeout(() => {
      execution();
    }, delayMs || siteConfig.delay2s);
  };

  const getElement = (list) => {
    if (typeof list === "string") return document.querySelector(list);
    let btn = document.querySelector(list[0]);
    list.forEach((e) => {
      btn = document.querySelector(e) || btn;
    });
    return btn;
  };

  if (!bili2sConf.installTime) {
    bili2sConf.installTime = new Date().toLocaleString();
    GM_setValue("bili2sConf", bili2sConf);
    alert("首次使用,前往微信小程序,随时反馈!");
    window.GM_openInTab(
      "https://cdn.jsdelivr.net/gh/Anjude/pubsrc@img/TW-TamperMonkey.png",
      { active: true, insert: true, setParent: true }
    );
  }

  const ChangeParseApi = () => {
    let curIndex = bili2sConf.parseApiIndex;
    bili2sConf.parseApiIndex = (curIndex + 1) % siteConfig.parseApiList.length;
    UnlockBangumi(bili2sConf.parseApiIndex, true);
    GM_setValue("bili2sConf", bili2sConf);
    Toast(
      `B站小助手: 解析接口${bili2sConf.parseApiIndex + 1} ${
        siteConfig.parseApiList[bili2sConf.parseApiIndex].name
      }`
    );
  };

  const UnlockBangumi = (parseApiIndex = 0, forceUnlock) => {
    let videoInfo = getElement(siteConfig.bangumiLi)?.innerHTML;
    parseApiIndex %= siteConfig.parseApiList.length;
    if (!forceUnlock) {
      if (
        !videoInfo ||
        (videoInfo && !/>(会员|付费|受限)<\/div>/.test(videoInfo))
      ) {
        return $("#anjude-iframe").length && location.reload();
      }
    }

    let parseApi = siteConfig.parseApiList[parseApiIndex];
    let newPlayer = document.createElement("iframe");
    newPlayer.id = "anjude-iframe";
    newPlayer.height = "100%";
    newPlayer.width = "100%";
    newPlayer.src = parseApi.url + window.location.href;
    newPlayer.setAttribute("allow", "autoplay");
    newPlayer.setAttribute("frameborder", "no");
    newPlayer.setAttribute("border", "0");
    newPlayer.setAttribute("allowfullscreen", "true");
    newPlayer.setAttribute("webkitallowfullscreen", "webkitallowfullscreen");

    let playerBox = getElement(siteConfig.playerBox);
    let videoBox = getElement(siteConfig.videoBox);

    if (videoBox) {
      videoBox.muted = true;
      videoBox.pause();
    }

    playerBox.innerHTML = "";
    playerBox.append(newPlayer);

    let monitorTimes = 0;
    let vipAdMonitor = setInterval(() => {
      monitorTimes++;
      let closeAd = getElement(siteConfig.vipAdClose);
      if (closeAd || monitorTimes >= (5 * 60 * 1000) / 200) {
        closeAd.click();
        clearInterval(vipAdMonitor);
      }
    }, 200);
    Toast(`B站小助手: 解析完成`, 500);
  };

  const executeByUri = (responseURL, result) => {
    (/pgc\/view\/web\/section\/order/.test(responseURL) ||
      /pgc\/season\/episode\/web\/info/.test(responseURL)) &&
      UnlockBangumi(bili2sConf.parseApiIndex);
  };

  // 执行脚本
  try {
    console.log("[B站小助手]:", bili2sConf);
    setTimeout(() => {
      GM_addStyle(getCss());
      // setCommand();
      addParseBtn();
    }, siteConfig.delay2s);
  } catch (err) {
    console.log("[B站小助手]:", err.name, err.message);
    if (confirm(`【B站小助手】: 请截图(到 我的 - 客服 处)反馈 ${err}`)) {
      window.GM_openInTab(
        "https://cdn.jsdelivr.net/gh/Anjude/pubsrc@img/TW-TamperMonkey.png",
        { active: true, insert: true, setParent: true }
      );
    }
  }

  function addParseBtn() {
    let ele = $(`
    <div id="anjude-parse" class="mobile-info">
    <i class="iconfont icon-play"></i>
    <span>解析</span>
    </div>
    `);
    $("#toolbar_module").append(ele);
    document
      .querySelector("#anjude-parse")
      .addEventListener("click", ChangeParseApi);
  }

  function setCommand() {
    // GM_registerMenuCommand("重置脚本", () => {
    //   if (confirm("重置后脚本数据将清空!")) {
    //     resetScript();
    //   }
    // });
  }

  function resetScript() {
    GM_deleteValue("bili2sConf");
  }

  function startHttpProxy() {
    XMLHttpRequest.prototype.send = new Proxy(XMLHttpRequest.prototype.send, {
      apply: (target, thisArg, args) => {
        thisArg.addEventListener("load", (event) => {
          try {
            // console.log(111, event.target.responseURL)
            let { responseText, responseURL } = event.target;
            if (/^{.*}$/.test(responseText)) {
              const result = JSON.parse(responseText);
              executeByUri(responseURL, result);
            }
          } catch (err) {}
        });
        return target.apply(thisArg, args);
      },
    });
  }

  function Toast(message = "已完成", time = 2000) {
    /*设置信息框停留的默认时间*/
    let el = document.createElement("div");
    el.setAttribute("class", "web-toast");
    el.innerHTML = message;
    document.body.appendChild(el);
    el.classList.add("fadeIn");
    setTimeout(() => {
      el.classList.remove("fadeIn");
      el.classList.add("fadeOut");
      /*监听动画结束，移除提示信息元素*/
      el.addEventListener("animationend", () => {
        document.body.removeChild(el);
      });
      el.addEventListener("webkitAnimationEnd", () => {
        document.body.removeChild(el);
      });
    }, time);
  }

  function getCss() {
    return `
    #anjude-parse{
      color: orange;
      margin-left: 20px;
    }
    @keyframes fadeIn {
    0%    {opacity: 0}
        100%  {opacity: 1}
    }
    @keyframes fadeOut {
        0%    {opacity: 1}
        100%  {opacity: 0}
    }
    .web-toast{
        position: fixed;
        background: rgba(0, 0, 0, 0.7);
        color: #fff;
        font-size: 14px;
        line-height: 1;
        padding:10px;
        border-radius: 3px;
        left: 50%;
        top: 50%;
        transform: translate(-50%,-50%);
        z-index: 9999;
        white-space: nowrap;
    }
    .fadeOut{
        animation: fadeOut .5s;
    }
    .fadeIn{
        animation:fadeIn .5s;
    }
    `;
  }

  // 兼容移动端，缓存使用原生 api
  function GM_setValue(key, value) {
    if (typeof value === "object") {
      value = JSON.stringify(value);
    }
    localStorage.setItem(key, value);
  }
  function GM_getValue(key) {
    let value = localStorage.getItem(key);
    if (value && value.startsWith("{")) {
      value = JSON.parse(value);
    }
    return value;
  }
  function GM_deleteValue(key) {
    localStorage.removeItem(key);
  }
})();
