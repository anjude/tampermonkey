// ==UserScript==
// @name         B站（bilibili）小功能汇总，视频进度记录，弹幕快捷键等
// @namespace    http://tampermonkey.net/
// @version      0.6
// @icon         http://pic2.orsoon.com/2017/0118/20170118014446594.png
// @description  目前提供记录集数观看进度、弹幕开关、标记已看视频、完成分享任务等功能，更多请参考详细描述，有空就会更新~
// @author       anjude
// @match        https://*.bilibili.com/*
// @require      https://cdn.bootcss.com/jquery/3.5.0/jquery.min.js
// @require      https://cdn.jsdelivr.net/npm/js-cookie@2/src/js.cookie.min.js
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @grant        GM_addStyle
// @grant        GM_registerMenuCommand
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(function() {
  'use strict';
  // console.log(window)
  // console.log(window.location.href)
  // console.log(GM_getValue('schedule_chart'))
  /**
    * 键盘编码：https://blog.csdn.net/zhaozhbcn/article/details/38852583
    * 对应编码数值填至相应设置中就可以
    * 例子： var is_barrage = 77 为键盘 M ，把原本66改为77即可
    */
  var is_barrage = 66   // 键盘b，开关弹幕
  var search_page = {
    listener: -1,
    last_bv_id: -1
  }

  if(/message\.bilibili\.com/.test(document.location.href)){
    // console.log('page_info:', document.location.href)
    return;
  }
  if(/video\/.v([0-9a-zA-Z]*)\??/i.test(document.location.href)){
    videoPage();
    new Date().getDate() == GM_getValue('share_date') ? console.log('[B站（bilibili）小功能汇总]: 已完成分享') : doShare();
  }
  if(/search.bilibili.com/i.test(document.location.href)){
    searchPage();
    // video-list clearfix https://search.bilibili.com/all
  }
  $(document).ready(()=> {
  $(document).keydown((e)=>{
    // console.log('键盘：',e)
    switch(e.keyCode){
      case is_barrage:
        isBarrage();
        break;
    }
  })});
  // 自动完成每日分享，目前为测试阶段
  function doShare(){
    console.log('[B站（bilibili）小功能汇总]: 开始分享')
    var i = 0
    var shareListener = setInterval(()=>{
      var node = $('.van-icon-share_news_default')
      if(node.length || i >= 60){
        clearInterval(shareListener)
        node[0].click()
        document.body.lastChild.remove()
        GM_setValue('share_date', new Date().getDate())
        console.log('[B站（bilibili）小功能汇总]: 分享完成，个人页面查看有延迟')
      }
      i++;
    },1000)
  }

  // 搜索页面逻辑
  function searchPage(){
    if(!$('.video-list').length){
      return;
    }
    var node = $('.video-list')[0].childNodes
    var bili_alist = GM_getValue('bili_alist') || 'no_bv_id'
    var reg = /video\/(.v[0-9|a-z|A-Z]*)\??/i
    if(reg.exec(node[node.length - 1].innerHTML)[1] == search_page.last_bv_id){
      return 0;
    }
    search_page.last_bv_id = reg.exec(node[node.length - 1].innerHTML)[1]
    // console.log(node, bili_alist)
    for(var i = 0,len = node.length; i < len; i++){
      var bv_id = reg.exec(node[i].innerHTML)[1]
      var regx = new RegExp(`&${bv_id}` , 'i')
      var add_div = document.createElement("div");
      add_div.className = 'video-view';
      if(regx.test(bili_alist)){
        add_div.innerHTML="看过";
        add_div.style.opacity = 1;
        add_div.style.color = 'red';
      }else{
        add_div.innerHTML="未看";
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
  function listenerPages(e){
    // console.log(e.target, search_page.listener)
    var i = 0;
    search_page.listener = setInterval(()=>{
      if(searchPage() || i >= 66){
        console.log('[B站（bilibili）小功能汇总]: 开始匹配已看')
        clearInterval(search_page.listener)
        i++;
      };
    }, 1000)
  }

  // 视频页面逻辑
  function videoPage(){
    var bv_id = /video\/(.v[0-9|a-z|A-Z]*)\??/i.exec(document.location.href)[1], match_reg = new RegExp(`&${bv_id}`, 'i')
    console.log('[B站（bilibili）小功能汇总]:', bv_id)
    var schedule_chart = GM_getValue('schedule_chart') || []
    // 查询功能入口
    if(!match_reg.test(GM_getValue('bili_alist'))){
      GM_setValue('bili_alist', (GM_getValue('bili_alist') || '') + '&' + bv_id)
      console.log('record new bv_id')
    }
    GM_registerMenuCommand("查看当前视频记录", function () {
      schedule_chart = GM_getValue('schedule_chart') || []
      // bv_id part title
      var cur_dic = {}
      for (var i = 0,len = schedule_chart.length; i < len; i++){
        var regx =new RegExp(schedule_chart[i].bv_id,"i");
        if(regx.test(bv_id)){
          cur_dic = schedule_chart[i]
          break;
        }
      }
      var tip = cur_dic.bv_id ? `您已观看到 ${cur_dic.part}：${cur_dic.title}` : '本片暂无记录~'
      alert(tip)
    });

    GM_registerMenuCommand("删除所有视频集数记录", function () {
      // bv_id part title
      schedule_chart = []
      GM_deleteValue('schedule_chart')
      alert('成功删除！')
    });

    // 监听切换集数事件
    if(document.getElementsByClassName('list-box').length){
      var listen_attr = document.getElementsByClassName('list-box')[0]
      listen_attr.addEventListener('click', listener, false)
    }
  }

  // 监听函数,添加观看记录
  function listener(e){
    var schedule_chart = GM_getValue('schedule_chart') || []
    var bv_id = /video\/(.v[0-9|a-z|A-Z]*)\??/i.exec(document.location.href)[1]
    var regx = /class="s1">(.*)<\/span>(.*)/i
    var part = regx.exec(e.target.innerHTML)
    var dic = {
      bv_id: bv_id,
      part: part[1],
      title: part[2]
    }
    if(schedule_chart.length){
      for (var i = 0,len = schedule_chart.length; i < len; i++){
        console.log(schedule_chart,schedule_chart[i])
        if(schedule_chart[i].bv_id == bv_id){
          schedule_chart[i] = dic
          break;
        }else if(i == (len - 1)){
          schedule_chart.push(dic)
        }
      }
    }else{
      schedule_chart.push(dic)
      alert('首个视频观看集数进度已经记录啦，点开油猴可以查看菜单~')
    }
    // console.log(schedule_chart)
    GM_setValue('schedule_chart', schedule_chart)
  }

  // 键盘菜单
  function isBarrage(){
    var node = $('.bui-switch-input')
    for(var i = 0, len = node.length; i < len; i++){
      if($('.bui-switch-input')[i].offsetParent){
        $('.bui-switch-input')[i].click();
        break;
      }
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
    }`
  )
})();