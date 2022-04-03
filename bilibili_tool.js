// ==UserScript==
// @name         【看网课必备】 哔哩哔哩（bilibili|B站）小助手--功能快捷键，视频集数进度记录，每日任务等
// @namespace    http://tampermonkey.net/
// @version      0.6.22
// @icon         https://cdn.jsdelivr.net/gh/Anjude/pubsrc@img/1.png
// @description  算是收藏比例比较高的一个宝藏脚本，一站式提供各种好用的功能，目前提供记录集数观看进度（看UP上传的分p视频必备）、弹幕按键开关、搜索页面标记已看视频、完成每日任务（除投币任务）、视频全屏等功能，更多请参考详细描述，有空就会更新~
// @author       anjude
// @match        https://*.bilibili.com/*
// @require      https://cdn.bootcss.com/jquery/3.5.0/jquery.min.js
// @require      https://cdn.jsdelivr.net/npm/js-cookie@2/src/js.cookie.min.js
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
  // console.log(window)
  // console.log(window.location.href)
  // console.log(GM_getValue('schedule_chart'))
  /**
   * 键盘编码：https://blog.csdn.net/zhaozhbcn/article/details/38852583
   * 对应编码数值填至相应设置中就可以
   * 例子： var is_barrage = 77 为键盘 M ，把原本66改为77即可
   * 如果不需要该快捷键，把快捷键编码值设置为1000即可~
   * 
   * 最新版本，直接修改自定义字母即可，如 "B" 改成 "C"（必须为大写字母）
   * 注意不要冲突，可以删掉一些快捷键
   */

  var menu_map = {}

  var is_barrage = "B" // 键盘B，开关弹幕
  var is_fullscreen = "F" // 键盘F，开关全屏
  var his_chap = "H" // 键盘H，查看历史观看集数
  var jump_chap = "J" // 键盘J，跳转上次观看集数
  var is_lightoff = "L" //键盘L，切换关灯模式
  var take_note = "N" // 键盘N，记笔记

  // 需要按住 Alt + CTRL + SHIFT
  var take_note_photo = "P" // 键盘P，笔记截屏幕
  var take_note_time = "C" // 键盘C，笔记截屏幕

  var search_page = {
    listener: -1,
    last_bv_id: -1
  }
  var focus = false

  window.onload = function () {
    if (/message\.bilibili\.com/.test(document.location.href)) {
      // console.log('page_info:', document.location.href)
      return;
    }
    if (/video\/.v([0-9a-zA-Z]*)\??/i.test(document.location.href)) {
      videoPage();
      new Date().getDate() == GM_getValue('share_date') ? console.log('[B站（bilibili）小功能汇总]: 今日已完成分享') : doShare();
    }
    if (/search.bilibili.com/i.test(document.location.href)) {
      searchPage();
      // video-list clearfix https://search.bilibili.com/all
    }
    if (/space.bilibili.com/i.test(document.location.href)) {
      spacePage();
      // fav-video-list clearfix content https://space.bilibili.com/416030291/favlist
    }
  }

  $(document).ready(() => {
    $(document).delegate("input, textarea",
      "focus",
      function () {
        focus = true
        console.log('onfocus')
      });
    $(document).delegate("input, textarea",
      "blur",
      function () {
        console.log('onblur')
        focus = false
      });
    // if(typeof pressKey == "string"){
    //     pressKey = pressKey.charCodeAt()
    // }
    $(document).keydown((e) => {
      // 如果正在打字或者特殊情况，屏蔽快捷键
      if (!e.altKey && (focus || _blockKey(e))) {
        return;
      }
      // console.log('键盘：',e.keyCode)
      let pressKey = String.fromCharCode(e.keyCode)
      switch (pressKey) {
        case is_barrage:
          if (e.altKey) {
            isBarrage();
          }
          break;
        case is_lightoff:
          isLightOff();
          break;
        case is_fullscreen:
          if (!e.ctrlKey) {
            isFullscreen();
          }
          break;
        case his_chap:
          hisChap();
          break;
        case jump_chap:
          if (!e.altKey) {
            jumpChap();
          } else {
            window.open("https://www.myindex.ga")
          }
          break;
        case take_note:
          if (e.altKey) {
            offNote();
            return;
          }
          takeNote();
          break;
        default:
          // 一些不常用的小操作，集中一个函数处理
          _keyCtrl(e);
      }
    })
  });

  let installTime = GM_getValue('installTime')
  if (!installTime) {
    GM_setValue('installTime', new Date())
    if (confirm('首次使用,前往微信小程序,随时反馈!')) {
      window.GM_openInTab(
        'https://cdn.jsdelivr.net/gh/Anjude/pubsrc@img/TW-TamperMonkey.png',
        { active: true, insert: true, setParent: true }
      )
    }
  }

  // 个人空间页面
  function spacePage() {

  }
  // 自动完成每日分享，亲测可用
  function doShare() {
    console.log('[B站（bilibili）小功能汇总]: 开始分享')
    var i = 0
    var shareListener = setInterval(() => {
      var node = $('.van-icon-share_news_default')
      if (node.length || i >= 60) {
        node[0].click()
        document.body.lastChild.remove()
        clearInterval(shareListener)
        if (i < 60) {
          GM_setValue('share_date', new Date().getDate())
          console.log('[B站（bilibili）小功能汇总]: 分享完成')
          _toast({
            message: "分享完成",
            time: 2000
          })
        } else {
          console.log('[B站（bilibili）小功能汇总]: 分享失败，换个视频试试呢~')
        }
      }
      i++;
    }, 1000)
  }

  // 搜索页面逻辑
  function searchPage() {
    if (!$('.video-list').length) {
      return;
    }
    var node = $('.video-list')[0].childNodes
    var bili_alist = GM_getValue('bili_alist') || 'no_bv_id'
    var reg = /video\/(.v[0-9|a-z|A-Z]*)\??/i
    if (reg.exec(node[node.length - 1].innerHTML)[1] == search_page.last_bv_id) {
      return 0;
    }
    search_page.last_bv_id = reg.exec(node[node.length - 1].innerHTML)[1]
    // console.log(node, bili_alist)
    for (var i = 0, len = node.length; i < len; i++) {
      var bv_id = reg.exec(node[i].innerHTML)[1]
      var regx = new RegExp(`&${bv_id}`, 'i')
      var add_div = document.createElement("div");
      add_div.className = 'video-view';
      if (regx.test(bili_alist)) {
        add_div.innerHTML = "看过";
        add_div.style.opacity = 1;
        add_div.style.color = 'red';
      } else {
        add_div.innerHTML = "未看";
      }
      node[i].prepend(add_div);
    }
    // console.log($('.bili-search'))
    $('.bili-search')[0].addEventListener('click', listenerPages, false)
    GM_registerMenuCommand("重置视频看过记录", function () {
      // bv_id part title
      bili_alist = ''
      GM_deleteValue('bili_alist')
      alert('成功删除！')
    });
    return 1;
  }
  // 监听函数,监听切换下一页更新数据
  function listenerPages(e) {
    // console.log(e.target, search_page.listener)
    var i = 0;
    search_page.listener = setInterval(() => {
      if (searchPage() || i >= 66) {
        console.log('[B站（bilibili）小功能汇总]: 开始匹配已看')
        clearInterval(search_page.listener)
        i++;
      };
    }, 1000)
  }

  // 视频页面逻辑
  function videoPage() {
    var bv_id = /video\/(.v[0-9|a-z|A-Z]*)\??/i.exec(document.location.href)[1],
      match_reg = new RegExp(`&${bv_id}`, 'i')
    // console.log('[B站（bilibili）小功能汇总]:', bv_id)
    var schedule_chart = GM_getValue('schedule_chart') || []
    // 查询功能入口
    if (!match_reg.test(GM_getValue('bili_alist'))) {
      GM_setValue('bili_alist', (GM_getValue('bili_alist') || '') + '&' + bv_id)
      // console.log('record new bv_id')
    }
    GM_registerMenuCommand("查看当前视频记录", function () {
      hisChap()
    });

    GM_registerMenuCommand("删除所有视频集数记录", function () {
      // bv_id part title
      schedule_chart = []
      GM_deleteValue('schedule_chart')
      alert('成功删除！')
    });

    // 设置连播
    setTimeout(dealEpisodic, 2000)

    // <a href="/video/BV1pt41147eM?p=1" class="" title="01"><i class="van-icon-
    // console.log('监测当前集数', $('.on'))
    // console.log('监测当前集数', document.getElementsByClassName('on'))
    // 监听切换集数事件
    if (document.getElementsByClassName('list-box').length) {
      // var listen_chap = document.getElementsByClassName('on')
      var listen_attr = document.getElementsByClassName('list-box')[0]
      listen_attr.addEventListener('click', listener, false)

      XMLHttpRequest.prototype.send = new Proxy(XMLHttpRequest.prototype.send, {
        "apply": (target, thisArg, args) => {
          thisArg.addEventListener(
            "load", event => {
              try {
                if (!/^{.*}$/.test(event.target.responseText)) {
                  return;
                }
                const result = JSON.parse(event.target.responseText);
                if (!result.data.accept_description.length) {
                  return;
                }
                // console.log("this:", result)
                listener();
              } catch (err) {

              }
            })
          return target.apply(thisArg, args);
        }
      })
    }
  }
  // 监听函数,添加观看记录
  function listener(e) {
    // console.log(document.getElementsByClassName('on'))
    var schedule_chart = GM_getValue('schedule_chart') || []
    var info = []
    var node = document.getElementsByClassName('on')
    for (var i = 0, len = node.length; i < len; i++) {
      if (/video\/(.v[0-9|a-z|A-Z]*)\??/i.test(node[i].innerHTML)) {
        var regx = /video\/(.V[0-9a-zA-Z]*)\?p=(\d+).*title="(.*?)"><div/i
        info = regx.exec(node[i].innerHTML)
        break;
      }
    }
    // console.log(info)
    var dic = {
      bv_id: info[1],
      part: `P${info[2]}`,
      title: info[3]
    }
    // console.log(schedule_chart)
    if (schedule_chart.length) {
      for (i = 0, len = schedule_chart.length; i < len; i++) {
        // console.log(schedule_chart, schedule_chart[i])
        if (schedule_chart[i].bv_id == info[1]) {
          schedule_chart[i] = dic
          break;
        } else if (i == (len - 1)) {
          schedule_chart.push(dic)
        }
      }
    } else {
      schedule_chart.push(dic)
      alert('首个视频观看集数进度已经记录啦，点开油猴可以查看菜单~')
    }
    // console.log(schedule_chart)
    GM_setValue('schedule_chart', schedule_chart)
  }

  function dealEpisodic() {
    var btn = document.querySelector("#reco_list > div.next-play > p > span > span.switch-button");
    var btn_multi = document.querySelector("#multi_page > div.head-con > div.head-right > span > span.switch-button");
    if (btn_multi) {
      // 兼容多p视频
      let cur_status = /switch-button on/.test(btn_multi.getAttribute('class'));
      var multi_episodic = GM_getValue("multi_episodic") == undefined ? cur_status : GM_getValue("multi_episodic");
      if (multi_episodic == undefined) {
        GM_setValue("multi_episodic", cur_status);
      }
      if (multi_episodic != cur_status) {
        btn_multi.click();
      }
      btn_multi.addEventListener("click", function (e) {
        var cur_status = /switch-button on/.test(this.getAttribute('class'));
        // 过滤脚本模拟点击
        if (e.isTrusted) {
          GM_setValue("multi_episodic", !cur_status);
        }
      })
    }
    if (!btn) { return; }

    // 初始，根据缓存决定是否禁用连播
    var cur_status = /switch-button on/.test(btn.getAttribute('class'));
    var is_episodic = GM_getValue("is_episodic") == undefined ? cur_status : GM_getValue("is_episodic")
    if (GM_getValue("is_episodic") == undefined) {
      GM_setValue("is_episodic", cur_status);
    }
    if (cur_status != is_episodic) {
      btn.click();
      cur_status = !cur_status;
      console.log(`[B站（bilibili）小功能汇总]: ${cur_status ? "开启" : "关闭"}非多p视频连播`);
    }
    menu_map.episodic = GM_registerMenuCommand(`${cur_status ? "关闭" : "开启"}非多p视频连播`, isEpisodic);
    btn.addEventListener("click", function (e) {
      // 过滤脚本模拟点击
      if (e.isTrusted) {
        isEpisodic(false);
      }
    });
  }

  // 键盘菜单
  // 开关弹幕
  function isBarrage() {
    let node = document.querySelector("div.bilibili-player-video-danmaku-switch.bui.bui-danmaku-switch > input")
      || document.querySelector("div.bpx-player-dm-switch.bui.bui-switch > div > input")
    node.click()
  }

  //宽屏并关灯模式
  function isLightOff() {
    if (window.location.href.match('bangumi')) {
      document.getElementsByClassName('squirtle-single-setting-other-choice squirtle-lightoff ')[0].click()
      document.getElementsByClassName('squirtle-video-widescreen squirtle-video-item ')[0].click()
      window.scrollTo(0, 50) //打开关灯模式后滚动到合适位置
    } else {
      var checkbox = document.getElementsByClassName('bui-checkbox-input')
      var setting = document.getElementsByClassName('bilibili-player-video-btn-setting')[0]
      var event_over = document.createEvent('MouseEvent') //关灯模式为懒加载
      var event_out = document.createEvent('MouseEvent')
      event_over.initMouseEvent('mouseover', true, true)
      event_out.initMouseEvent('mouseout', true, true)
      setting.dispatchEvent(event_over)
      setting.dispatchEvent(event_out)
      if (document.getElementsByClassName('bilibili-player-iconfont-widescreen-off').length) {
        document.getElementsByClassName('bilibili-player-iconfont-widescreen-off')[0].click()
      } else {
        document.getElementsByClassName('bilibili-player-iconfont-widescreen-off')[0].click()
      }
      for (var i = 0, len = checkbox.length; i < len; i++) {
        if ('关灯模式' == checkbox[i].ariaLabel) {
          checkbox[i].click();
          break;
        }
      }
      window.scrollTo(0, 130)
    }
  }

  // 开关全屏
  function isFullscreen() {
    if (window.location.href.match('bangumi')) {
      document.getElementsByClassName('squirtle-video-fullscreen squirtle-video-item')[0].click()
    }
    else {
      // console.log(document.getElementsByClassName('video-state-fullscreen-off'))
      if (document.getElementsByClassName('video-state-fullscreen-off').length) {
        document.getElementsByClassName('bilibili-player-iconfont-fullscreen-off')[0].click()
      } else {
        document.getElementsByClassName('bilibili-player-iconfont-fullscreen-on')[0].click()
      }
    }
  }

  function hisChap() {
    var cur_dic = _getChapDic() || {}
    var tip = cur_dic.bv_id ? `您已观看到 ${cur_dic.part}：${cur_dic.title}` : '本片暂无记录~'
    alert(tip)
  }

  function jumpChap() {
    var dic = _getChapDic()
    if (!dic) {
      _toast({
        message: '本片暂无记录',
        time: 2000
      })
      return;
    }
    var part = /P(\d+)/.exec(dic.part)[1]
    $('.list-box')[0].children[part - 1].getElementsByTagName('a')[0].click()
    _toast({
      message: "跳转上次播放集数",
      time: 2000
    })
  }

  // 开关非多p视频连播
  function isEpisodic(click = true) {
    var btn = document.querySelector("#reco_list > div.next-play > p > span > span.switch-button")
    if (!btn) {
      return;
    }
    var cur_status = /switch-button on/.test(btn.getAttribute('class'))
    if (click) {
      btn.click()
    }
    cur_status = !cur_status
    GM_setValue("is_episodic", cur_status)
    console.log(`[B站（bilibili）小功能汇总]: ${cur_status ? "开启" : "关闭"}非多p视频连播`);

    // 重新设置title
    GM_unregisterMenuCommand(menu_map.episodic);
    menu_map.episodic = GM_registerMenuCommand(`${cur_status ? "关闭" : "开启"}非多p视频连播`, isEpisodic);
  }

  function takeNote() {
    console.log("[B站（bilibili）小功能汇总]: 开启笔记");
    // 兼容 cheese课堂区和普通视频区的笔记按钮
    let note_btn = document.querySelector("#arc_toolbar_report > div.rigth-btn > div:nth-child(2) > div") ||
      document.querySelector("#app > div > div.l-con > div.video-toolbar > div.ops > span.note-btn")
    note_btn.click()
  }

  function offNote() {
    console.log("[B站（bilibili）小功能汇总]: 关闭笔记");
    // 兼容 cheese课堂区和普通视频区的笔记按钮
    let note_off_btn = document.querySelector("#app > div.resizable-component.bili-note.active-note > div.note-drag-bar.drag-el > div.operation-btns > div.close-btn") ||
      document.querySelector("#app > div.resizable-component.bili-note > div.note-drag-bar.drag-el > div.operation-btns > div > i")
    note_off_btn.click()
  }

  function _getChapDic() {
    if (!/video\/(.v[0-9|a-z|A-Z]*)\??/i.exec(document.location.href)) {
      return 0;
    }
    var cur_dic = {}
    var schedule_chart = GM_getValue('schedule_chart') || []
    var bv_id = /video\/(.v[0-9|a-z|A-Z]*)\??/i.exec(document.location.href)[1]
    // bv_id part title
    // console.log(schedule_chart)
    for (var i = 0, len = schedule_chart.length; i < len; i++) {
      if (!schedule_chart[i].bv_id) {
        continue;
      }
      var regx = new RegExp(schedule_chart[i].bv_id, "i");
      // console.log(regx, regx.test(bv_id))
      if (regx.test(bv_id)) {
        cur_dic = schedule_chart[i]
        break;
      }
    }
    return cur_dic
  }

  function _toast(params = { message: "已完成", time: 2000 }) {
    /*设置信息框停留的默认时间*/
    var time = params.time || 2000;
    var el = document.createElement("div");
    el.setAttribute("class", "web-toast");
    el.innerHTML = params.message || "已完成";
    document.body.appendChild(el);
    el.classList.add("fadeIn");
    setTimeout(function () {
      el.classList.remove("fadeIn");
      el.classList.add("fadeOut");
      /*监听动画结束，移除提示信息元素*/
      el.addEventListener("animationend", function () {
        document.body.removeChild(el);
      });
      el.addEventListener("webkitAnimationEnd", function () {
        document.body.removeChild(el);
      });
    }, time);
  }

  // 处理需要屏蔽快捷键
  function _blockKey(e) {
    let is_block = false;
    // 笔记框出现屏蔽快捷键
    let note_btn = $(".resizable-component.bili-note");
    if (note_btn.length && note_btn[0].style.display != "none") {
      is_block = true;
    }
    return is_block;
  }

  // 处理一些个性化的小快捷键功能
  function _keyCtrl(e) {
    // console.log(e)
    let pressKey = String.fromCharCode(e.keyCode)
    if (e.altKey && e.ctrlKey && e.shiftKey && pressKey == take_note_photo) {
      let take_screen_shot = document.querySelector("#web-toolbar > div > span.ql-capture-btn.ql-bar > i");
      take_screen_shot.click()
    }
    if (e.altKey && e.ctrlKey && e.shiftKey && pressKey == take_note_time) {
      let take_flag = document.querySelector("#web-toolbar > div > span.ql-tag-btn.ql-bar-btn > i")
      take_flag.click()
    }
  }

  GM_addStyle(`
    .video-view{
      display:inline-block;
      position:absolute;
      left:0px;
      top:0px;
      background:#FFF;
      color:#666;
      opacity: 0.8;
      padding:1px 5px;
      z-index:999;
    }
    @keyframes fadeIn {
    0%    {opacity: 0}
        100%  {opacity: 1}
    }
    @-webkit-keyframes fadeIn {
        0%    {opacity: 0}
        100%  {opacity: 1}
    }
    @-moz-keyframes fadeIn {
        0%    {opacity: 0}
        100%  {opacity: 1}
    }
    @-o-keyframes fadeIn {
        0%    {opacity: 0}
        100%  {opacity: 1}
    }
    @-ms-keyframes fadeIn {
        0%    {opacity: 0}
        100%  {opacity: 1}
    }
    @keyframes fadeOut {
        0%    {opacity: 1}
        100%  {opacity: 0}
    }
    @-webkit-keyframes fadeOut {
        0%    {opacity: 1}
        100%  {opacity: 0}
    }
    @-moz-keyframes fadeOut {
        0%    {opacity: 1}
        100%  {opacity: 0}
    }
    @-o-keyframes fadeOut {
        0%    {opacity: 1}
        100%  {opacity: 0}
    }
    @-ms-keyframes fadeOut {
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
        -webkit-transform: translate(-50%,-50%);
        -moz-transform: translate(-50%,-50%);
        -o-transform: translate(-50%,-50%);
        -ms-transform: translate(-50%,-50%);
        z-index: 9999;
        white-space: nowrap;
    }
    .fadeOut{
        animation: fadeOut .5s;
    }
    .fadeIn{
        animation:fadeIn .5s;
    }
    `)
})();
