// ==UserScript==
// @name         B站、芒果、爱奇艺、腾讯等视频替换器
// @namespace    http://tampermonkey.net/
// @version      0.3
// @description  一键解析，无感切换。
// @author       anjude
// @grant        unsafeWindow
// @include      *://www.bilibili.com/bangumi/play/*
// @include      *.mgtv.com/b/*
// @include      *.iqiyi.com/v_*
// @include      *.iqiyi.com/a_*
// @include      *v.qq.com/x/*
// @include      *v.youku.com/v_*
// @grant        GM_addStyle
// @require      https://cdn.bootcss.com/jquery/3.5.0/jquery.min.js
// ==/UserScript==
(function() {
  'use strict';
  // 播放器原因，打开开发者调试窗口（审查元素）时会卡死，请谨慎使用
  // 此脚本仅为学习之用，请使用者24小时内删除脚本，且不要传播
  var replace_video = 82 // 键盘 R 代码
  var focus = false
  var herf = window.location.href
  var iframe = document.createElement("iframe"),
    video_box = -1,
    box_parent = -1,
    title = '1917',
    video_height = 0
  console.log(herf, document.title)
  console.log(unsafeWindow)
  $(document).ready(() => {
    $(document).delegate("input, textarea",
      "focus",
      function() {
        focus = true
      });
    $(document).delegate("input, textarea",
      "blur",
      function() {
        focus = false
      });
    $(document).keydown((e) => {
      if (focus)
        return;
      switch (e.keyCode) {
        case replace_video:
          replaceVideo();
          break;
      }
    })
  });

  // data init
  window.onload = function() {
    init()
  }

  function init() {
    if (/bilibili.com\/bangumi\/play/.test(herf)) {
      title = unsafeWindow.__INITIAL_STATE__.mediaInfo.title
      video_box = document.getElementsByTagName('video')[0]
      box_parent = document.querySelectorAll('.bilibili-player-video')[0]
      video_height = $('.bilibili-player-video')[0].clientHeight
      // video_box = document.getElementById('player_module')
      // box_parent = document.querySelectorAll('.plp-l')[0]
      // video_height = video_box.style.height
      if (document.body.className.includes('player-mode-widescreen')) {
        iframe.style.position = 'absolute'
        iframe.style.top = '0'
      }
    } else if (/mgtv.com\/b/.test(herf)) {
      title = document.getElementsByClassName('poster-name')[0].innerText
      video_box = document.getElementsByTagName('video')[0]
      box_parent = document.querySelectorAll('container')[0]
      video_height = $('container')[0].clientHeight
    } else if (/iqiyi.com\/v_/.test(herf)) {
      // title = $('#widget-videotitle')[0].innerText
      title = $('.header-link')[0].innerText
      video_box = document.getElementsByTagName('video')[0]
      box_parent = document.querySelectorAll('.iqp-player')[1]
      video_height = $('.iqp-player')[1].clientHeight
    } else if (/iqiyi.com\/a_/.test(herf)) {
      title = document.title
      video_box = document.getElementsByTagName('video')[0]
      box_parent = document.querySelectorAll('.iqp-player')[1]
      video_height = $('.iqp-player')[1].clientHeight
    } else if (/qq.com\/x/.test(herf)) {
      title = $('._main_title')[0].innerText
      video_box = document.getElementsByTagName('video')[0]
      box_parent = document.querySelectorAll('.txp_video_container')[0]
      video_height = $('.txp_video_container')[0].clientHeight
    } else if (/v.youku.com\/v_/.test(herf)) {
      title = $('.title-link')[0].innerText
      video_box = document.getElementsByTagName('video')[0]
      box_parent = document.querySelectorAll('.youku-film-player')[0]
      video_height = $('.youku-film-player')[0].clientHeight
    }
    // console.log('title:', title, video_box, box_parent)
    // iframe init
    iframeInit(title);

    // add button
    var buttonTmp = document.querySelector('.anjude-btn')
    if (buttonTmp) {
      document.body.removeChild(buttonTmp)
    }
    var replace_btn = document.createElement("div")
    replace_btn.className = 'anjude-btn'
    replace_btn.textContent = "R"
    replace_btn.innerHTML = "R"
    replace_btn.setAttribute('draggable', 'true')
    document.body.appendChild(replace_btn)
    $('.anjude-btn').on("click", function() {
      replaceVideo()
    });
  }

  function replaceVideo() {
    var iframeTmp = document.querySelector('#anjude-iframe')
    if (iframeTmp) {
      box_parent.removeChild(iframeTmp)
      init()
    }
    if (!iframe.src || !video_box) {
      init()
    }
    // console.log('iframe.src:', iframe.src, 'box_parent:', box_parent, 'video_box', video_box)
    box_parent.insertBefore(iframe, video_box)
    iframe.height = video_height
    window.onresize = () => {
      iframe.style.height = video_height
    }
    video_box.pause()
    video_box.volume = 0
    video_box.style.display = 'none'
    // bilibili
    if ($('.bilibili-player-video-state').length) {
      $('.bilibili-player-video-state')[0].remove()
      $('.bilibili-player-video-control-wrap')[0].remove()
      $('.bilibili-player-video-toast-wrp')[0].remove()
      $('.bilibili-player-video-top')[0].remove()
      $('.bilibili-player-video-record').length ? $('.bilibili-player-video-record')[0].remove() : ''
    }
    // mango
    if ($('mango-control').length) {
      $('mango-control')[0].remove()
    }
    if ($('.iqp-bottom').length) {
      $('.iqp-bottom')[0].remove()
    }
    // iqy
    if ($('.black-screen').length) {
      $('.black-screen')[0].remove()
      $('.qy-player-vippay-popup').length ? $('.qy-player-vippay-popup')[0].parentNode.remove() : ''
    }
    // tx
    if ($('.txp_bottom').length) {
      $('.txp_bottom')[0].remove()
      $('.txp_gradient_bottom')[0].remove()
      $('.txp_shadow')[0].remove()
    }
    // youku
    if ($('.h5-layer-conatiner').length) {
      $('.h5-layer-conatiner')[0].remove()
      $('.h5player-dashboard')[0].remove()
    }
    // video_box.remove()
    // video_box = 'none'
  }

  function iframeInit(title = '1917') {
    iframe.id = 'anjude-iframe'
    // iframe.src = `https://baidu.com/${title}`
    iframe.src = `https://z1.m1907.cn?jx=${title}`
    iframe.height = 0
    iframe.width = '100%'
    iframe.setAttribute('frameborder', 'no')
    iframe.setAttribute('border', '0')
    iframe.setAttribute('allowfullscreen', 'allowfullscreen')
    iframe.setAttribute('webkitallowfullscreen', 'webkitallowfullscreen')
  }

  GM_addStyle(`
    .anjude-btn{
      width: 30px;
      height: 36px;
      position: fixed;
      top: 36%;
      text-align: center;
      line-height: 36px;
      overflow: hidden;
      border-radius: 5px;
      background: #DFB360;
      color: black;
      opacity: 0.6;
      z-index:9999999999999;
    }`)
})();