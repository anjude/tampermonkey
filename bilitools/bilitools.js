// ==UserScript==
// @name         【小破站必备2022】 哔哩哔哩（bilibili|B站）小助手--功能快捷键，每日任务，视频解析等
// @namespace    http://tampermonkey.net/
// @version      0.0.6
// @icon         https://raw.githubusercontent.com/Anjude/tampermonkey/master/images/bilibili_tool.png
// @description  🔥🔥🔥推荐 2022最友好的B站助手，功能纯净无冲突。自动跳转多 P 视频（UP 上传视频）上次观看进度,快捷键增强，每日任务（签到&分享），会员番剧无感解析，视频已看标签等等，具体看脚本介绍~
// @author       豆小匠Coding
// @match        https://*.bilibili.com/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @grant        GM_addStyle
// @grant        GM_registerMenuCommand
// @grant        GM_unregisterMenuCommand
// @grant        GM_xmlhttpRequest
// @original-script   https://github.com/Anjude/tampermonkey
// @require     https://greasyfork.org/scripts/412159-mydrag/code/MyDrag.js?version=858320
// @require     https://cdn.jsdelivr.net/npm/jquery@3.2.1/dist/jquery.min.js
// ==/UserScript==

(function () {
  'use strict'
  // 检查版本
  const RELEASE_VERSION = '0.0.6'
  let DEV = 'RELEASE'
  // DEV = 'DEBUG'
  let updateVersion = DEV === 'DEBUG' || RELEASE_VERSION !== GM_getValue('RELEASE_VERSION')
  updateVersion && GM_setValue('RELEASE_VERSION', RELEASE_VERSION)
  // resetScript()
  /**
   * 默认设置
   * `${e.altKey}${e.ctrlKey}${e.shiftKey}${pressKey}`
   */
  let defaultBili2sConf = {
    shortcutMap: {
      upToTop: '000U',   // 回到顶部
      takeNote: '000N',  // 打开视频笔记
      notePicShot: '101P',   // 笔记-视频截图
      noteTimePoint: '101T',   // 笔记-时间标记
      changeParseApi: '100V',   // 解锁视频
    },
    videoRecordMap: {}, // 视频记录
    multiUnceasing: true,   // 多集自动连播
    singleUncreasing: false,    // 单集自动连播
    autoUnlockVideo: false, // 是否自动解锁视频
    shareDate: '2022/1/1',
    lastClearup: new Date(),
    parseApiIndex: 0, // 解析接口选择
  }
  let bili2sConf = GM_getValue('bili2sConf') || defaultBili2sConf

  if (updateVersion) {
    bili2sConf = Object.assign(defaultBili2sConf, bili2sConf)
    bili2sConf.shortcutMap = Object.assign(defaultBili2sConf.shortcutMap, bili2sConf.shortcutMap)
    GM_setValue('bili2sConf', bili2sConf)
  }

  // 网站配置
  const siteConfig = {
    delayMs: 2000,
    scrollBtnList: [
      'div.item.back-top', // 首页
      'div.item.backup',  // up视频,
      'div.tool-item.backup.iconfont.icon-up',  // 
      '#app > div.to-top', // up主所有视频
      '#cheese_guide > div > div'  // 课堂
    ],
    noteBtnList: [
      'div.note-btn', // 普通up视频
      'span.note-btn'  // 课堂视频
    ],
    notePanelList: [
      'div.resizable-component.bili-note' // 普通up视频
    ],
    picBtnList: ['span.ql-capture-btn'],
    pointBtnList: ['span.ql-tag-btn'],
    multiPageBox: ['#multi_page > div.cur-list'],
    chapListItem: ['div.cur-list > ul > li.on'],
    shareBtnList: ['div.share-btns > div:nth-child(6)'],
    unceasingBtnList: ['span.switch-button'],
    searchResBox: [
      '#video-list > ul',
      'div.mixin-list > ul.video-list',    // 番剧
      'div.flow-loader > ul',
      'div.rcmd-box',  // 首页推荐
      'div.section.video > div',  // UP主页
      '#submit-video-list > ul.list-list',  // UP主页，更多视频
      '#reco_list > div.rec-list',  // 相关视频
    ],
    playerBox: ['#player_module'],
    parseApiList: [
      { id: 1, url: 'https://vip.parwix.com:4433/player/?url=' },
      { id: 2, url: 'https://www.mtosz.com/m3u8.php?url=' },
    ],
    bangumiLi: ['li.ep-item.cursor.badge.visited'],
    shortcutList: {
      upToTop: '回到顶部',
      takeNote: '打开/关闭笔记',
      changeParseApi: '切换视频解析接口',
      notePicShot: '笔记-视频截图',
      noteTimePoint: '笔记-时间标志'
    },  // shortcut list
    scSetting: '',
    multiPageJump: false  // 是否跳转上次观看
  }

  const startHttpProxy = () => {
    XMLHttpRequest.prototype.send = new Proxy(XMLHttpRequest.prototype.send, {
      apply: (target, thisArg, args) => {
        thisArg.addEventListener('load', event => {
          try {
            // console.log(111, event.target.responseURL)
            let { responseText, responseURL } = event.target
            if (!/^{.*}$/.test(responseText)) return
            const result = JSON.parse(responseText);
            /\/player\/playurl/.test(responseURL)
              && chapListener(result);
            (/x\/web-interface\/search/.test(responseURL)
              || /x\/web-interface\/index\/top\/rcmd/.test(responseURL)
              || /x\/space\/arc/.test(responseURL))
              && dealRead(result);
            /pgc\/view\/web\/section\/order/.test(responseURL)
              && UnlockBangumi(bili2sConf.parseApiIndex);
          } catch (err) { }
        })
        return target.apply(thisArg, args)
      }
    })
  }

  GM_addStyle(getCss())
  setCommand()
  startHttpProxy()

  const getElement = (list) => {
    let btn = document.querySelector(list[0])
    list.forEach(e => { btn = document.querySelector(e) || btn })
    return btn
  }

  const getBvid = (href) => {
    let res = /video\/([0-9|a-z|A-Z]*)/ig.exec(href || document.location.href)
    return res === null ? false : res[1]
  }

  const UpToTop = () => { // 回到顶部
    let scrollBtn = getElement(siteConfig.scrollBtnList)
    if (scrollBtn) scrollBtn.click()
  }

  const TakeNote = () => {
    let noteBtn = getElement(siteConfig.noteBtnList)
    let nodePanel = getElement(siteConfig.notePanelList)
    let res = nodePanel || (() => {
      noteBtn.click()
      return false
    })()
    if (!res) return

    nodePanel.style.display = nodePanel.style.display === 'none'
      ? '' : 'none'
  }

  const NotePicShot = () => {
    let picBtn = getElement(siteConfig.picBtnList)
    picBtn.click()
  }

  const NoteTimePoint = () => {
    let pointBtn = getElement(siteConfig.pointBtnList)
    pointBtn.click()
  }

  const keyCtrl = () => {

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
        case keyMap.upToTop:
          return UpToTop()
        case keyMap.takeNote:
          return TakeNote()
        case keyMap.notePicShot:
          return NotePicShot()
        case keyMap.noteTimePoint:
          return NoteTimePoint()
        case keyMap.changeParseApi:
          return ChangeParseApi(true)
        default:
          keyCtrl(command)  // 一些不常用的小操作，集中一个函数处理
      }
    })
  })

  const chapListener = (res) => {
    let listItem = getElement(siteConfig.chapListItem).innerHTML
    let regxList = /video\/([0-9|a-z|A-Z]*)\?p=(\d+).*title=.(.*?).><div/i.exec(listItem)
    let bvid = regxList[1]
    bili2sConf.videoRecordMap[bvid] = Object.assign(bili2sConf.videoRecordMap[bvid] || {}, {
      p: regxList[2],
      title: regxList[3],
      updateTime: new Date()
    })
    GM_setValue('bili2sConf', bili2sConf)
  }

  const multiPageJump = () => {
    let bvid = getBvid()
    let videoHis = bili2sConf.videoRecordMap[bvid]
    videoHis && (() => {
      if (siteConfig.multiPageJump) { return }
      siteConfig.multiPageJump = !siteConfig.multiPageJump
      document.querySelector(`div.cur-list > ul > li:nth-child(${videoHis.p}) > a`).click()
      Toast('小助手: 跳转上次观看集数')
    })()
  }

  const setVideoRecord = () => {
    let bvid = getBvid()
    let videoRecord = bili2sConf.videoRecordMap[bvid] || {
      docTitle: document.title,
      p: 1
    }
    videoRecord.updateTime = new Date()
    bili2sConf.videoRecordMap[bvid] = Object.assign(bili2sConf.videoRecordMap[bvid] || {}, videoRecord)
    // console.log(bili2sConf.videoRecordMap[bvid], videoRecord)
    GM_setValue('bili2sConf', bili2sConf)
  }

  const dealUnceasing = (isMultiPage) => {
    // 处理连播
    let switchCase = isMultiPage ? 'multiUnceasing' : 'singleUncreasing'
    let unceasingBtn = getElement(siteConfig.unceasingBtnList)
    let curUnceasing = /switch-button on/.test(unceasingBtn.getAttribute('class'))
    curUnceasing === bili2sConf[switchCase]
      || unceasingBtn.click()
    unceasingBtn.addEventListener("click", (e) => {
      // 过滤脚本模拟点击
      if (e.isTrusted) {
        bili2sConf[switchCase] = !/switch-button on/.test(unceasingBtn.getAttribute('class'))
        GM_setValue('bili2sConf', bili2sConf);
      }
    })
  }

  const doShare = () => {
    console.log('[B站小助手]: 开始分享!')
    let shareBtn = getElement(siteConfig.shareBtnList)
    shareBtn.click()
    document.body.lastChild.remove()
    bili2sConf.shareDate = new Date().toLocaleDateString()
    GM_setValue('bili2sConf', bili2sConf)
    console.log('[B站小助手]: 分享完成!')
    Toast('小助手: 今日分享任务达成')
  }

  const dealRead = (res) => {
    let searchResBox = getElement(siteConfig.searchResBox)
    // console.log(searchResBox.childNodes)
    let resList = searchResBox.childNodes
    resList.forEach(e => {
      if (!e.innerHTML) return
      e.style.position = 'relative'
      let bvid = getBvid(e.innerHTML)
      if (!bvid) return
      let addDiv = document.createElement("div")
      addDiv.className = 'video-view'
      if (bili2sConf.videoRecordMap[bvid]) {
        addDiv.innerHTML = "看过";
        addDiv.style.opacity = 1;
        addDiv.style.color = 'red';
      } else {
        addDiv.innerHTML = "未看";
      }
      e.prepend(addDiv);
    })
  }

  const ChangeParseApi = () => {
    let curIndex = bili2sConf.parseApiIndex
    bili2sConf.parseApiIndex = (curIndex + 1) % siteConfig.parseApiList.length
    UnlockBangumi(bili2sConf.parseApiIndex)
    GM_setValue('bili2sConf', bili2sConf)
    Toast(`B站小助手: 切换解析接口成功!`)
  }

  const UnlockBangumi = (parseApiIndex = 0, setAutoUnlock) => {
    if (setAutoUnlock) {
      let set = !bili2sConf.autoUnlockVideo
      bili2sConf.autoUnlockVideo = set
      GM_setValue('bili2sConf', bili2sConf)
      Toast(`B站小助手:${set ? '开启' : '关闭'}自动解锁!`)
    }
    let videoInfo = getElement(siteConfig.bangumiLi)?.innerHTML
    if (!bili2sConf.autoUnlockVideo
      || videoInfo && !/>(会员|付费)<\/div>/.test(videoInfo)
      || !videoInfo
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
    playerBox.innerHTML = ''
    playerBox.append(newPlayer)
    // Toast(`B站小助手: 解析完成`, 500)
  }

  const runScript = () => {
    let date = new Date().toLocaleDateString()
    let href = window.location.href
    let isMultiPage = getElement(siteConfig.multiPageBox)
    if (isMultiPage) {
      setTimeout(() => { multiPageJump() }, siteConfig.delayMs)
    }
    if (/\/video\//.test(href)) {
      setTimeout(() => {
        setVideoRecord()
        dealUnceasing(isMultiPage)
        dealRead()
        date === bili2sConf.shareDate || doShare()
      }, siteConfig.delayMs);
    }
    if (/search.bilibili.com/.test(href)) {
      setTimeout(() => {
        dealRead()
      }, siteConfig.delayMs)
    }
  }

  // 执行脚本
  try {
    runScript()
    clearupStore()
    // console.log('[B站小助手]:', bili2sConf)
  } catch (err) {
    console.log('[B站小助手]:', err)
  }

  function resetScript() {
    GM_deleteValue('bili2sConf')
  }

  function clearupStore() {
    const getDayDiff = (d) => {
      return (new Date() - new Date(d)) / (1000 * 60 * 60 * 24)
    }
    let dayDiff = getDayDiff(bili2sConf.lastClearup)
    if (dayDiff < 30) return    // 每月清理一次数据
    console.log('[B站小助手]:开始清理!')

    let recordMapKeys = Object.keys(bili2sConf.videoRecordMap)
    recordMapKeys.forEach(e => {
      let updateTime = bili2sConf.videoRecordMap[e].updateTime
      if (getDayDiff(updateTime) > 365 * 2) {
        delete bili2sConf.videoRecordMap[e]
      }
    })
    bili2sConf.lastClearup = new Date()
    GM_setValue('bili2sConf', bili2sConf)
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
    GM_registerMenuCommand('设置快捷键', () => {
      document.querySelector('#sc-box').style.display = ''
    })
    GM_registerMenuCommand('重置脚本', () => {
      resetScript()
    })
  }

  function initSettingPanel() {
    let SCL = siteConfig.shortcutList
    siteConfig.scm = bili2sConf.shortcutMap
    let scItem = ''
    Object.keys(SCL).forEach(e => {
      scItem += `<div id="${e}">设置${SCL[e]}快捷键: ${getShortCut(siteConfig.scm[e])}</div>`
    })
    let boxHtml = $(`
<div id="sc-box" style="display:none;width:300px;">
<div id="sc-title" style="width: 100%;height: 20px;
text-align: center;font-size: 16px;padding: 20px;">
快捷键设置(点击选中设置)
</div>
<div style="display:flex; font-size: 15px;">
<label>自动解锁视频 <input type="checkbox" id="auto-unlockvideo" ${bili2sConf.autoUnlockVideo ? 'checked' : ''} /></label>
</div>
<div style="font-size: 15px;">
${scItem}
</div>
<div style="justify-content:center; display: flex;">
<button id="anjude-scok-btn">设置完成</button>
</div>
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
    document.querySelector('#auto-unlockvideo').addEventListener('click', function (e) {
      UnlockBangumi(bili2sConf.parseApiIndex, true)
    })
  }

  function getCss() {
    return `
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
