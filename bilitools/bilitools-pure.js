// ==UserScript==
// @name         B站大会员视频自动解析 -- 纯净版
// @namespace    http://tampermonkey.net/
// @version      0.0.1
// @icon         https://gitee.com/anjude/public-resource/raw/md-img/1.png
// @description  浸入式虚拟会员体验，功能智能自动化。
// @author       豆小匠Coding
// @match        https://*.bilibili.com/*
// @grant        GM_openInTab
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @grant        GM_addStyle
// @grant        GM_registerMenuCommand
// @grant        GM_unregisterMenuCommand
// @grant        GM_xmlhttpRequest
// @original-script   https://github.com/Anjude/tampermonkey
// @require      https://lf26-cdn-tos.bytecdntp.com/cdn/expire-1-M/jquery/3.2.1/jquery.min.js
// @require     https://greasyfork.org/scripts/412159-mydrag/code/MyDrag.js?version=858320
// ==/UserScript==

(function () {
  'use strict'
  // @require     https://cdn.jsdelivr.net/npm/jquery@3.2.1/dist/jquery.min.js
  // 检查版本
  const RELEASE_VERSION = '0.0.13'
  let ENV = 'RELEASE'
  // ENV = 'DEBUG'
  const updateVersion = ENV === 'DEBUG' || RELEASE_VERSION !== GM_getValue('RELEASE_VERSION')
  updateVersion && GM_setValue('RELEASE_VERSION', RELEASE_VERSION)
  startHttpProxy()
  /**
   * 默认设置
   * `${e.altKey}${e.ctrlKey}${e.shiftKey}${pressKey}`
   */
  let defaultBili2sConf = {
    shortcutMap: {
      changeParseApi: '100V',   // 解锁视频
    },
    parseApiIndex: 0, // 解析接口选择
    installTime: null
  }

  // 网站配置
  const siteConfig = {
    delay2s: 2000,
    playerBox: ['#player_module'],
    videoBox: ['video'],
    vipAdClose: ['div.twp-mask > div > i'],
    parseApiList: [ // 解析链接均收集自网络，经过简单测试
      { url: 'https://vip.parwix.com:4433/player/?url=', name: 'Parwix解析系统' },
      { url: 'https://www.yemu.xyz/?url=', name: '夜幕解析' },
      { url: 'https://vip.bljiex.cc/?v=', name: 'BL解析' },
      { url: 'https://www.1717yun.com/jx/ty.php?url=', name: '1717云解析' },
      { url: 'https://jx.rdhk.net/?v=', name: '4080视频解析' },
      { url: 'https://go.yh0523.cn/y.cy?url=', name: '盘古云解析' },
      { url: 'https://yparse.jn1.cc/index.php?url=', name: '云解析' },
      { url: 'https://vip.mmkv.cn/tv.php?url=', name: 'mmkv' },
      { url: 'https://z1.m1907.cn/?jx=', name: 'm1907' },
      { url: 'https://17kyun.com/api.php?url=', name: '17kyun' },
      // { url: 'https://www.mtosz.com/m3u8.php?url=', name: 'mtosz' },
      { url: 'https://lecurl.cn/?url=', name: 'dplayer - by-le' },
      { url: 'https://vip5.jiexi.one/?url=', name: '爱爱蓝光解析' },
    ],
    bangumiLi: ['li.ep-item.cursor.badge.visited'],
    shortcutList: {
      changeParseApi: '切换视频解析接口',
    },  // shortcut list
    scSetting: ''
  }

  let bili2sConf = GM_getValue('bili2sConf') || defaultBili2sConf

  if (updateVersion) {
    let shortcutMap = Object.assign({}, defaultBili2sConf.shortcutMap)
    bili2sConf = Object.assign(defaultBili2sConf, bili2sConf)
    bili2sConf.shortcutMap = Object.assign(shortcutMap, bili2sConf.shortcutMap)
    console.log(shortcutMap, defaultBili2sConf.shortcutMap, bili2sConf.shortcutMap)
    GM_setValue('bili2sConf', bili2sConf)
    Toast('脚本已更新')
  }

  if (!bili2sConf.installTime) {
    bili2sConf.installTime = new Date()
    GM_setValue('bili2sConf', bili2sConf)
    if (confirm('首次使用,前往微信小程序,随时反馈!')) {
      window.GM_openInTab(
        'https://gitee.com/anjude/public-resource/raw/md-img/TW-TamperMonkey.png',
        { active: true, insert: true, setParent: true }
      )
    }
  }

  const delayExecute = (execution, delayMs) => {
    setTimeout(() => {
      execution()
    }, delayMs || siteConfig.delay2s);
  }

  const getElement = (list) => {
    if (typeof list === 'string') return document.querySelector(list)
    let btn = document.querySelector(list[0])
    list.forEach(e => { btn = document.querySelector(e) || btn })
    return btn
  }

  const getBvid = (href) => {
    let res = /video\/([0-9|a-z|A-Z]*)/ig.exec(href || document.location.href)
    return res === null ? false : res[1]
  }

  const blockKey = (e) => {
    let isBlock = false

    // do sth if isBlock should be true

    return isBlock
  }

  const setShortcut = (command) => {
    let commandString = getShortCut(command)
    let scSetting = siteConfig.scSetting
    let innerTextList = document.querySelector(`#${scSetting}`).innerHTML.split(':')
    document.querySelector(`#${scSetting}`).innerHTML = innerTextList[0] + ': ' + commandString
    siteConfig.scm[scSetting] = command
  }

  let focus = false   // 输入中
  $(document).ready(() => {
    $(document).delegate('input, textarea',
      'focus', () => { focus = true })
    $(document).delegate('input, textarea',
      'blur', () => { focus = false })
    $(document).keydown((e) => {
      // 如果正在打字或者特殊情况，屏蔽快捷键
      if (!e.altKey && !e.shiftKey && !e.ctrlKey
        && (focus || blockKey(e))) {
        return
      }
      const k = (key) => key ? 1 : 0
      let pressKey = String.fromCharCode(e.keyCode)
      let command = `${k(e.altKey)}${k(e.ctrlKey)}${k(e.shiftKey)}${pressKey}`
      let keyMap = bili2sConf.shortcutMap

      // console.log('键盘:', command, siteConfig.scSetting)
      if (siteConfig.scSetting) { return setShortcut(command) }
      switch (command) {
        case keyMap.changeParseApi:
          return ChangeParseApi()
      }
    })
  })

  const ChangeParseApi = () => {
    let curIndex = bili2sConf.parseApiIndex
    bili2sConf.parseApiIndex = (curIndex + 1) % siteConfig.parseApiList.length
    UnlockBangumi(bili2sConf.parseApiIndex, false, true)
    GM_setValue('bili2sConf', bili2sConf)
    Toast(`B站小助手: 解析接口${bili2sConf.parseApiIndex + 1} ${siteConfig.parseApiList[bili2sConf.parseApiIndex].name}`)
  }

  const UnlockBangumi = (parseApiIndex = 0, setAutoUnlock, forceUnlock) => {
    if (setAutoUnlock) {
      let set = !bili2sConf.autoUnlockVideo
      bili2sConf.autoUnlockVideo = set
      GM_setValue('bili2sConf', bili2sConf)
      Toast(`B站小助手:${set ? '开启' : '关闭'}自动解锁!`)
    }
    let videoInfo = getElement(siteConfig.bangumiLi)?.innerHTML
    if (!forceUnlock && (videoInfo && !/>(会员|付费|受限)<\/div>/.test(videoInfo)
      || !videoInfo)
    ) { return $('#anjude-iframe').length && location.reload() }

    let parseApi = siteConfig.parseApiList[parseApiIndex]
    let newPlayer = document.createElement('iframe')
    newPlayer.id = 'anjude-iframe'
    newPlayer.height = '100%'
    newPlayer.width = '100%'
    newPlayer.src = parseApi.url + window.location.href
    newPlayer.setAttribute('allow', 'autoplay')
    newPlayer.setAttribute('frameborder', 'no')
    newPlayer.setAttribute('border', '0')
    newPlayer.setAttribute('allowfullscreen', 'true')
    newPlayer.setAttribute('webkitallowfullscreen', 'webkitallowfullscreen')

    let playerBox = getElement(siteConfig.playerBox)
    let videoBox = getElement(siteConfig.videoBox)

    if (videoBox) {
      videoBox.muted = true
      videoBox.pause()
    }

    playerBox.innerHTML = ''
    playerBox.append(newPlayer)

    let monitorTimes = 0
    let vipAdMonitor = setInterval(() => {
      monitorTimes++
      let closeAd = getElement(siteConfig.vipAdClose)
      if (closeAd || monitorTimes >= (5 * 60 * 1000 / 200)) {
        closeAd.click()
        clearInterval(vipAdMonitor)
      }
    }, 200)
    Toast(`B站小助手: 解析完成`, 500)
  }

  const executeByUri = (responseURL, result) => {
    (/pgc\/view\/web\/section\/order/.test(responseURL)
      || /pgc\/season\/episode\/web\/info/.test(responseURL))
      && UnlockBangumi(bili2sConf.parseApiIndex);
  }

  // 执行脚本
  try {
    // console.log('[B站小助手]:', bili2sConf)
    GM_addStyle(getCss())
    setCommand()
  } catch (err) {
    console.log('[B站小助手]:', err.name, err.message)
    if (confirm(`【B站小助手】: 请截图(到 我的 - 客服 处)反馈 ${err}`)) {
      window.GM_openInTab(
        'https://gitee.com/anjude/public-resource/raw/md-img/TW-TamperMonkey.png',
        { active: true, insert: true, setParent: true }
      )
    }
  }

  function resetScript() {
    GM_deleteValue('bili2sConf')
  }

  function helper() {
    let str = ``
    let list = str.match(/https?:\/\/[0-9a-zA-Z./?_-]*=/ig)
    list.forEach((e, i) => {
      setTimeout(() => {
        console.log(i, i === list.length - 1);
        window.open(`${e}https://www.bilibili.com/bangumi/play/ep457778?spm_id_from=333.999.0.0`, 'target')
      }, i * 15000)
    })
  }

  function startHttpProxy() {
    XMLHttpRequest.prototype.send = new Proxy(XMLHttpRequest.prototype.send, {
      apply: (target, thisArg, args) => {
        thisArg.addEventListener('load', event => {
          try {
            // console.log(111, event.target.responseURL)
            let { responseText, responseURL } = event.target
            if (!/^{.*}$/.test(responseText)) return
            const result = JSON.parse(responseText);
            executeByUri(responseURL, result)
          } catch (err) { }
        })
        return target.apply(thisArg, args)
      }
    })
  }

  function Toast(message = "已完成", time = 2000) {
    /*设置信息框停留的默认时间*/
    let el = document.createElement("div")
    el.setAttribute("class", "web-toast")
    el.innerHTML = message
    document.body.appendChild(el);
    el.classList.add("fadeIn");
    setTimeout(() => {
      el.classList.remove("fadeIn")
      el.classList.add("fadeOut")
      /*监听动画结束，移除提示信息元素*/
      el.addEventListener("animationend", () => {
        document.body.removeChild(el)
      })
      el.addEventListener("webkitAnimationEnd", () => {
        document.body.removeChild(el)
      })
    }, time)
  }

  function getShortCut(command) {
    // console.log(command);
    let res = ''
    if (parseInt(command[0])) res += 'Alt+'
    if (parseInt(command[1])) res += 'Ctrl+'
    if (parseInt(command[2])) res += 'Shift+'
    res += command[3]
    return res
  }

  function clearCommandStatus(SL) {
    SL.forEach(e => { document.querySelector(`#${e}`).style.color = '' })
  }

  function setCommand() {
    initSettingPanel()
    GM_registerMenuCommand('设置脚本', () => {
      document.querySelector('#sc-box').style.display = ''
    })
    GM_registerMenuCommand('重置脚本', () => {
      if (confirm('重置后观看记录、快捷键修改等数据将清空!')) {
        resetScript()
      }
    })
  }

  function initSettingPanel() {
    let SCL = siteConfig.shortcutList
    siteConfig.scm = bili2sConf.shortcutMap
    let scItem = ''
    Object.keys(SCL).forEach(e => {
      scItem += `<div id="${e}">${SCL[e]}快捷键: ${getShortCut(siteConfig.scm[e])}</div>`
    })
    let boxHtml = $(`
<div id="sc-box" style="display:none;width:300px;">
<div id="sc-title" style="width: 100%;height: 20px;
text-align: center;font-size: 16px;padding: 20px;">
快捷键设置(点击选中设置)
</div>
<div style="font-size: 15px;">
${scItem}
</div>
<div style="justify-content:center; display: flex; padding: 10px;">
<button id="anjude-scok-btn" style="color: white; font-size:16px; border-radius: 2px;
background: green;padding: 3px;">设置完成</button>
</div>
<a style="font-size: 12px; color: blue;" target="_blank" href="https://greasyfork.org/zh-CN/scripts/437941/feedback">好用的话，去给个好评咯~</a>
<a id="badguy" style="font-size: 12px; color: red;margin-left: 10px;">烂脚本,我要差评!</a>
<img id="miniprogram" style="display: none;" src="https://gitee.com/anjude/public-resource/raw/md-img/TW-TamperMonkey.png">
</div>
    `)
    $(document.body).append(boxHtml)
    new MyDrag($('#sc-box')[0], { handle: $('#sc-title')[0] })
    Object.keys(SCL).forEach(v => {
      document.querySelector(`#${v}`).addEventListener('click', function (e) {
        siteConfig.scSetting = this.id
        clearCommandStatus(Object.keys(SCL))
        this.style.color = 'green'
      })
    })
    document.querySelector('#anjude-scok-btn').addEventListener('click', function (e) {
      // 设置快捷键,缓存数据
      siteConfig.scSetting = ''
      bili2sConf.shortcutMap = siteConfig.scm
      GM_setValue('bili2sConf', bili2sConf)
      document.querySelector('#sc-box').style.display = 'none'
    })
    document.querySelector('#badguy').addEventListener('click', function (e) {
      let cur = document.querySelector('#miniprogram').style.display
      document.querySelector('#miniprogram').style.display = cur ? '' : 'none'
    })
    updateVersion && (document.querySelector('#sc-box').style.display = '')
  }

  function getCss() {
    return `
    a{text-decoration:none;}
    #pretend-vip,
    #auto-unlockvideo{
      background-color: initial;
	    cursor: default;
	    appearance: checkbox;
	    box-sizing: border-box;
	    padding: initial;
	    border: initial;
    }
    #sc-box{
        padding: 10px;border-radius: 5px; 
        background: #F6F6F6;border: #44b549 2px solid;
    }
    .video-view{
      display:inline-block;
      position:absolute;
      left:0px; top:0px;
      background:#FFF; color:#666;
      opacity: 0.8; padding:1px 5px;
      z-index:999;
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
    `}
})();
