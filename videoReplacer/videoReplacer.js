// ==UserScript==
// @name         B站、芒果、爱奇艺、腾讯等视频替换小助手
// @namespace    http://tampermonkey.net/
// @version      0.0.2
// @description  一键解析，无感切换。
// @author       豆小匠coding
// @grant        unsafeWindow
// @include      *://www.bilibili.com/bangumi/play/*
// @include      *.mgtv.com/b/*
// @include      *.iqiyi.com/v_*
// @include      *.iqiyi.com/a_*
// @include      *v.qq.com/x/*
// @include      *v.youku.com/v_*
// @grant        GM_openInTab
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @grant        GM_addStyle
// @grant        GM_registerMenuCommand
// @grant        GM_unregisterMenuCommand
// @grant        GM_xmlhttpRequest
// @require      https://lf26-cdn-tos.bytecdntp.com/cdn/expire-1-M/jquery/3.2.1/jquery.min.js
// @require     https://greasyfork.org/scripts/412159-mydrag/code/MyDrag.js?version=858320
// ==/UserScript==
(function () {
  // 此脚本仅为学习之用，请使用者24小时内删除脚本，且不要传播
  'use strict';

  const RELEASE_VERSION = '0.0.2'
  let ENV = 'RELEASE'
  // ENV = 'DEBUG'

  const updateVersion = ENV === 'DEBUG' || RELEASE_VERSION !== GM_getValue('RELEASE_VERSION')

  updateVersion && GM_setValue('RELEASE_VERSION', RELEASE_VERSION)

  let scriptConfDf = {
    parseApiIndex: 0,
    installTime: null
  }

  /**
   * 默认快捷键
   * `${e.altKey}${e.ctrlKey}${e.shiftKey}${pressKey}`
   */
  let shortcutMapDf = {
    changeParseApi: '100V',
    replaceVideo: '100R'
  }

  const siteConfig = {
    isFirst: false,
    delay2s: 2000,
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
      { url: 'https://lecurl.cn/?url=', name: 'dplayer - by-le' },
      { url: 'https://vip5.jiexi.one/?url=', name: '爱爱蓝光解析' },
    ],
    playBoxLi: [
      '#player_module',
      '#mgtv-player-wrap',
      '#flashbox',
      '#mod_player',
      '#player'
    ],
    videoBox: ['video'],
  }

  let shortcutMap = GM_getValue('shortcutMap') || shortcutMapDf
  let scriptConf = GM_getValue('scriptConf') || scriptConfDf

  if (updateVersion) {
    shortcutMap = Object.assign(shortcutMapDf, GM_getValue('shortcutMap') || {})
    scriptConf = Object.assign(scriptConfDf, GM_getValue('scriptConf') || {})
    GM_setValue('shortcutMap', shortcutMap)
    GM_setValue('scriptConf', scriptConf)
  }

  if (!scriptConf.installTime) {
    scriptConf.installTime = new Date()
    GM_setValue('scriptConf', scriptConf)
    if (confirm('首次使用,前往微信小程序,随时反馈!')) {
      window.GM_openInTab(
        'https://cdn.jsdelivr.net/gh/Anjude/pubsrc@img/TW-TamperMonkey.png',
        { active: true, insert: true, setParent: true }
      )
    }
  }

  startHttpProxy()

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
      let keyMap = shortcutMap

      // console.log('键盘:', command)
      switch (command) {
        case keyMap.changeParseApi:
          return ChangeParseApi()
        case keyMap.replaceVideo:
          return ReplaceVideo()
      }
    })
  })

  const ChangeParseApi = () => {
    let curIndex = scriptConf.parseApiIndex
    scriptConf.parseApiIndex = (curIndex + 1) % siteConfig.parseApiList.length
    ReplaceVideo(scriptConf.parseApiIndex)
    GM_setValue('scriptConf', scriptConf)
    Toast(`小助手: 解析接口${scriptConf.parseApiIndex + 1} ${siteConfig.parseApiList[scriptConf.parseApiIndex].name}`)
  }

  const ReplaceVideo = (parseApiIndex = 0) => {
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

    let playerBox = getElement(siteConfig.playBoxLi)
    let videoBox = getElement(siteConfig.videoBox)

    // console.log(111, playerBox, videoBox)

    videoBox && (videoBox.muted = true) && videoBox.pause()
    playerBox.innerHTML = ''
    playerBox.append(newPlayer)
    Toast(`小助手: 解析完成`, 500)
  }

  const blockKey = (e) => {
    let isBlock = false

    // do sth if isBlock should be true

    return isBlock
  }

  const requestRes = (responseURL, result) => {
    // /\/player\/playurl/.test(responseURL)
    //   && chapListener(result);
  }

  const runScript = () => {
    let date = new Date().toLocaleDateString()
    let href = window.location.href

    if (/bilibili.com\/bangumi\/play/.test(href)) {

    } else if (/mgtv.com\/b/.test(href)) {
    } else if (/iqiyi.com\/v_/.test(href)) {
    } else if (/iqiyi.com\/a_/.test(href)) {
    } else if (/qq.com\/x/.test(href)) {
    } else if (/v.youku.com\/v_/.test(href)) {
    }

  }

  // 执行脚本
  try {
    setTimeout(() => {
      runScript()
    }, siteConfig.delay2s);
  } catch (err) {
    console.log('[小助手]:', err.name, err.message)
    if (confirm(`【小助手】: 请截图反馈 ${err}`)) {
      window.GM_openInTab('https://greasyfork.org/zh-CN/scripts/437941/feedback', { active: true, insert: true, setParent: true })
    }
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
            requestRes(responseURL, result)
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


  function resetScript() {
    GM_deleteValue('scriptConf')
    GM_deleteValue('shortcutMap')
  }

  GM_addStyle(`
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
    }`)
})();