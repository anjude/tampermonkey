// ==UserScript==
// @name         【2022最新】网页工具合集，不一样的浏览器体验
// @namespace    http://tampermonkey.net/
// @version      0.0.3
// @icon         https://raw.githubusercontent.com/Anjude/tampermonkey/master/images/weindex-icon.png
// @description  按 alt + j 跳转聚合导航页面，选择相应搜索引擎，即可跳转你需要的资源，后面会不断筛选最强力的搜索引擎~
// @author       anjude
// @match        *
// @include      *
// @require      https://cdn.bootcss.com/jquery/3.5.0/jquery.min.js
// @require      https://cdn.jsdelivr.net/npm/js-cookie@2/src/js.cookie.min.js
// @grant        GM_openInTab
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @grant        GM_addStyle
// @grant        GM_registerMenuCommand
// @grant        GM_unregisterMenuCommand
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(function () {
  'use strict';

  /**
   * 默认设置
   * `${e.ctrlKey}${e.shiftKey}${e.altKey}${pressKey}`
   */
  let defaultConf = {
    shortcutMap: {
      toSite: '001J'
    }
  }

  let allSiteInfo = {
    'zhihu': {

    }
  }

  let siteInfo = {}
  let scriptConf = GM_getValue('scriptConf') || defaultConf

  if (/zhihu.com/.test(document.location.href)) {
    siteInfo = allSiteInfo['zhihu']
  }


  const blockKey = (e) => {
    let isBlock = false

    // do sth if isBlock should be true

    return isBlock
  }


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
      let command = `${k(e.ctrlKey)}${k(e.shiftKey)}${k(e.altKey)}${pressKey}`
      let keyMap = scriptConf.shortcutMap

      // console.log('键盘:', command)
      switch (command) {
        case keyMap.toSite:
          window.GM_openInTab('http://anjude.xyz', { active: true, insert: true, setParent: true })
      }
    })
  })


})();
function startHttpProxy() {
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
        } catch (err) { }
      })
      return target.apply(thisArg, args)
    }
  })
}
