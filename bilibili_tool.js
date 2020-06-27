// ==UserScript==
// @name         B站（bilibili）小功能汇总，视频进度记录，弹幕快捷键等
// @namespace    http://tampermonkey.net/
// @version      0.5
// @icon         https://i2.hdslb.com/bfs/face/341b86ec2328a6dd7988be125d062942a8fb2682.png
// @description  目前提供记录集数观看进度、弹幕开关等功能，更多请参考详细描述，有空就会更新~
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
  if(/message\.bilibili\.com/.test(document.location.href)){
    console.log('page_info')
    return;
  } else if(/video\/.v([0-9|a-z|A-Z]*)\??/i.test(document.location.href)){
    videoPage();
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
  // var bili_jct = Cookies.get('bili_jct');
  // var share_date = GM_getValue('share_date')
  // var cur_date = new Date().getDate();
  // console.log('data：',bv_id,bili_jct,share_date);
  // if(share_date != cur_date){

    // GM_xmlhttpRequest({
    //     method: 'POST',
    //     credentials: 'include',
    //     url: 'https://api.bilibili.com/x/web-interface/share/add',
    //     headers: {
    //       'Content-type': 'application/x-www-form-urlencoded'
    //     },
    //     data: `aid=${bv_id}&csrf=${bili_jct}`,
    //     onload: function(e) {
    //       console.log(e.responseText)  
    //     }
    // })
  // }

  // 视频页面逻辑
  function videoPage(){
    var bv_id = /video\/(.v[0-9|a-z|A-Z]*)\??/i.exec(document.location.href)[1]
    var schedule_chart = GM_getValue('schedule_chart') || []
    // 查询功能入口
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

    GM_registerMenuCommand("删除所有记录", function () {
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
})();