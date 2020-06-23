// ==UserScript==
// @name         常用网站去广告合集，已支持腾讯课堂、爱文库、百度网盘、大圣盘，详细见描述
// @namespace    http://tampermonkey.net/
// @version      0.9
// @description  如题，把常用网站不想看到的广告都x掉，欢迎反馈添加广告黑名单~
// @author       anjude
// @match        *://ke.qq.com/*
// @match        *://www.258wk.com/*
// @match        *://258wk.com/
// @match        *://*.pan.baidu.com/*
// @match        *://*.so.com/search/*
// @match        *://*.dashengpan.com/*
// @match        *://*.jb51.net/
// @match        *://*.jb51.net/*
// @grant        GM_addStyle
// @grant        none
// ==/UserScript==

(function () {
  'use strict';
  console.log("url:", location.href)
  console.log(document)
  // console.log(window)
  window.onload = function () {
    // 爱文库广告（无奈之举，广告遮盖了下载按钮~）
    if (location.href.match(/258wk.com/)) {
      aiWenKu();
    }
    // 腾讯课堂xx正在观看
    if (location.href.match(/ke.qq.com/)) {
      tencentCourse();
    }
    // 网盘小红点
    if (location.href.match(/pan.baidu.com/)) {
      baiduDisk();
      // find-light-icon
    }// 360广告
    if (location.href.match(/so.com\/search\//)) {
      ad360();
      // e_idea_pp
    }
    if (location.href.match(/dashengpan.com/)) {
      daShengPan();
      // .mobile-dialog-inner
    }
    if (location.href.match(/jb51.net/)) {
      $('#btn-readmore').click();
      jb51();
      // .pt10 clearfix
    }
  }
  // 为每个网站去广告单列一个方法，解耦
  function tencentCourse() {
    var minitor = setInterval(function () {
      // 腾讯课堂xxx正在观看 marquee
      var class_name = document.getElementById("marquee") ? document.getElementById("marquee").className : "marquee animation"
      if (document.getElementsByClassName("player-inject").length || document.getElementsByClassName("marquee animation").length || document.getElementById("marquee")) {
        var tencent_course = document.createElement("style");
        tencent_course.innerHTML = `a[class*="${class_name}"],txpdiv[class*="player-inject"] { display: none !important; }`;
        document.head.appendChild(tencent_course);
        // console.log(document.getElementsByClassName("bottom-bar-img--folded"))
      }
      document.getElementsByClassName("bottom-bar-img--folded").length ? document.getElementsByClassName("bottom-bar-img--folded")[0].remove() : ''
    }, 1000)
  }
  function aiWenKu() {
    if (document.getElementsByClassName("tianmao").length) {
      // document.getElementById("footer").firstElementChild.remove() // 需要网站页脚的可以解除本行注释，注释下一行
      document.getElementById("footer").remove()
      document.getElementsByClassName("tianmao")[0].remove()
    }
  }
  function baiduDisk() {
    console.log(document.getElementsByClassName("find-light-icon"))
    document.getElementsByClassName("newIcon")[0].remove()
    for (var i = 0, len = document.getElementsByClassName("find-light-icon").length; i < len; i++) {
      document.getElementsByClassName("find-light-icon")[0].remove()
    }
  }
  function ad360() {
    var monitor = setInterval(() => {
      // $("#e_idea_pp").remove();
      // $("#side").remove();
      // $("#mohe-360pic_sad--normal").remove();
      // $("#e_map_idea").remove();
      // $("#e_idea_pp_vip_bottom").remove();
      // console.log(document.getElementsByClassName("g-hd-cur"))
      // console.log(document.getElementsByClassName("inner"))
      if (document.getElementById("e_idea_pp").length) {
        document.getElementById("e_idea_pp").remove()
      }
    }, 1000)
  }
  function daShengPan() {
    var node_dsp = document.createElement("style");
    node_dsp.innerHTML = `[class*="mobile-dialog-inner"]{ display: block !important; }`;
    document.head.appendChild(node_dsp);
  }
  function jb51() {
    console.log(document.getElementsByClassName("pt10 clearfix"))
    document.getElementsByClassName("pt10 clearfix")[0].remove()
    // logo右侧的两个广告
    $(".logom.fl").remove();
    $(".logor.fr").remove();
    // 清除所有class属性值为clearfix的标签（会清除其他菜单内容）
    // $(".clearfix").remove();
    $("#slider").remove();
    // 菜单栏下面的广告
    $(".tonglan").remove();
    $(".pt10.clearfix").remove();
    $(".main.clearfix").remove();
    $(".mtb10.clearfix").remove();
    // 首页分菜单之间的广告
    $(".mainlr").remove();
    $(".dxy776").remove();
    $(".dxy370").remove();
    $(".topimg").remove();
    $(".dxy1200.clearfix").remove();
    // 搜索输入框下面的广告
    $(".da").remove();
    $(".r300.clearfix").remove();
    $(".sidebox-recomm").remove();
    var sidebar = $("#sidebar").children();
    var sidebar1 = sidebar.eq(0);
    var sidebar2 = sidebar.eq(2);
    var sidebar3 = sidebar.eq(5);
    sidebar1.remove();
    sidebar2.remove();
    sidebar3.remove();
    // $(".mt10").remove();
    // 最近更新列表下面的广告
    $(".side-box.mtb10").remove();
    // 软件下载页面的下载按钮下面的广告
    $(".softsfwtl").remove();
    // 文章页面的“大家感兴趣的内容”和“常用在线小工具”下面的广告和右下侧浮动广告
    $(".r300.clearfix.mt10").remove();
    $("#con_all").remove();
    // 右侧栏最下面的广告
    $(".mt10.rFixedBox").remove();
    // 软件下载地址右侧的广告
    $(".da-download").remove();
    // 软件下载的“相关文章下面的广告”
    $("#down4").remove();
    $("#content > div.clearfix").remove();
    // 文章页面 “你可能感兴趣的文章”下面的广告
    $(".lbd_bot.clearfix").remove();
    // 文章页面 “原文链接”下面的广告
    $("#ewm").remove();
    $(".cupage").next().remove();
    // 文章页面 tag标签下面的广告和“相关文章”里面的广告
    $(".lbd.clearfix").remove();
    // 编程语言界面广告
    $(".mtb10.lists-main").next().remove();
    $(".rFixedBox").remove();
  }
})();
