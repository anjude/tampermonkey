// ==UserScript==
// @name         B站视频替换
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  This script was deleted from Greasy Fork, and due to its negative effects, it has been automatically removed from your browser.
// @author       none
// @grant        unsafeWindow
// @connect      bilivideo.com
// @include      *://www.bilibili.com/bangumi/play/*
// @include      *://www.bilibili.com/video/BV*
// @require      https://greasyfork.org/scripts/402897-bilibili-ass-danmaku-downloader-by-%E7%94%B0%E7%94%9F/code/bilibili%20ASS%20Danmaku%20Downloader%20by%20%E7%94%B0%E7%94%9F.js?version=802822
// ==/UserScript==
(function() {
  'use strict';
  let dloading = false
  let bangumi = /bilibili.com\/bangumi\/play\//g.test(window.location.href)
  let parentId = bangumi ? 'toolbar_module' : 'arc_toolbar_report'
  //添加样式
  let style = document.createElement("style")
  style.innerHTML = (".anjude-get-dm{float:right;}.anjude-get-dm>div{display:inline-block;}.anjude-get-dm a{font-size:15px;color:#00a1d6;margin:0 12px;line-height:28px;}.anjude-get-dm a:hover{cursor:pointer;color:#f25d8e;}")
  document.head.appendChild(style)
  if (bangumi && unsafeWindow.__PGC_USERSTATE__.area_limit != 0) Object.defineProperty(unsafeWindow, '__PGC_USERSTATE__', {
    get: () => ({
      area_limit: 0,
      gat: true
    })
  })
  //添加按钮
  let addElement = cid => {
    let name = document.title.match(/(.+?)_((.+?)_|哔哩哔哩 )/)[1]
    let title = bangumi ? unsafeWindow.__INITIAL_STATE__.mediaInfo.title : name
    let parent = document.getElementById(parentId)
    let old = document.querySelector('.anjude-get-dm')
    if (old) parent.removeChild(old)
    let ele = document.createElement("div")
    ele.className = 'anjude-get-dm'
    let iframeTmp = document.querySelector('#anjude-iframe')
    if (iframeTmp) document.querySelector('.plp-l').removeChild(iframeTmp)
    let bfq = document.getElementById('player_module')
    if (bfq) bfq.style.display = 'block'
    let jump = document.createElement("a")

    if (bangumi && (unsafeWindow.__INITIAL_STATE__.epPayMent.status != 0 || unsafeWindow.__PGC_USERSTATE__.gat)) {

      let iframe = document.createElement("iframe")
      iframe.id = 'anjude-iframe'
      // iframe.src = `https:`
      iframe.src = `https://z1.m1907.cn?jx=夏洛特烦恼`
      console.log('cid:', cid, 'title:', title, 'title.slice', title.slice(0, 13), 'window', unsafeWindow.__INITIAL_STATE__.epInfo.i + 1, 'src', iframe.src)

      // iframe.src = `https://z1.m1907.cn?jx=${cid}&wd=${title.slice(0,13)}&ep=${unsafeWindow.__INITIAL_STATE__.epInfo.i + 1}`
      // <iframe src="https://z1.m1907.cn?jx=灵笼" width="100%" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>
      
      if (document.body.className.includes('player-mode-widescreen')) {
        iframe.style.position = 'absolute'
        iframe.style.top = '0'
      }
      iframe.height = 0
      iframe.width = '100%'
      iframe.setAttribute('frameborder', 'no')
      iframe.setAttribute('border', '0')
      iframe.setAttribute('allowfullscreen', 'allowfullscreen')
      iframe.setAttribute('webkitallowfullscreen', 'webkitallowfullscreen')
      document.querySelector('.plp-l').insertBefore(iframe, bfq)

      //手动点击
      jump.textContent = "替换播放器"
      jump.onclick = e => {
        if (unsafeWindow.player) unsafeWindow.player.pause()
        if (bfq.style.display == 'none') return
        iframe.height = bfq.style.height
        window.onresize = () => {
          iframe.style.height = bfq.style.height
        }
        bfq.style.display = 'none'
      }

    }
    ele.appendChild(jump)
    parent.appendChild(ele)
    var dp = new DPlayer({
        element: document.getElementById('anjude-iframe'), // 可选，player元素
        autoplay: false, // 可选，自动播放视频，不支持移动浏览器
        theme: '#FADFA3', // 可选，主题颜色，默认: #b7daff
        loop: true, // 可选，循环播放音乐，默认：true
        lang: 'zh', // 可选，语言，`zh'用于中文，`en'用于英语，默认：Navigator 
        language
        screenshot: true, // 可选，启用截图功能，默认值：false，注意：如果设置为true， 视频和视频截图必须启用跨域
        hotkey: true, // 可选，绑定热键，包括左右键和空格，默认值：true
        preload: 'auto', // 可选，预加载的方式可以是'none''metadata''auto'，默认值： 'auto'
        video: { // 必需，视频信息
          url: 'https://shuixian.nihaozuida.com/share/4b2ae7d938d2edc52ee760535f0003e2', // 必填，视频网址
        },
        danmaku: { // 可选，显示弹幕，忽略此选项以隐藏弹幕
          id: '9E2E3368B56CDBB4', // 必需，弹幕 id，注意：它必须是唯一的，不能在你的新播放器中使用这些： `https://api.prprpr.me/dplayer/list`
          api: 'https://api.bilibili.com/x/v1/dm/list.so?oid=' + cid, // 必需，弹幕 apihttps://api.bilibili.com/x/v1/dm/list.so?oid=
          token: 'tokendemo', // 可选，api 的弹幕令牌
          maximum: 1000, // 可选，最大数量的弹幕
          addition: ['https://api.prprpr.me/dplayer/bilibili?aid=4157142'] // 可选的，额外的弹幕，参见：`Bilibili弹幕支持`
        }
      });
  }
  //添加换p事件
  let href = window.location.href
  let changeEp = () => {
    let eles = bangumi ? document.querySelectorAll('.plp-r') : document.querySelectorAll('.list-box li')
    if (!eles) return
    eles.forEach(ele => {
      ele.addEventListener('click', e => {
        setTimeout(() => {
          if (window.location.href == href) return
          href = window.location.href
          document.getElementById(parentId).removeChild(document.querySelector('.anjude-get-dm'))
          addElement(getCid())
        }, 200)
      })
    })
  }
  //获取cid
  let getCid = () => {
    if (bangumi) return unsafeWindow.__INITIAL_STATE__.epInfo.cid
    else return cid
  }
  let init = () => {
    addElement(getCid())
    changeEp()
  }
  let obs = bangumi ? document.querySelector('#toolbar_module') : document.querySelector('.ops')
  if (!obs) setTimeout(init, 500)
  else {
    new MutationObserver(function(mutations, observer) {
      observer.disconnect();
      setTimeout(init, 500)
    }).observe(obs, {
      childList: true,
      subtree: true
    });
  }
})();