// ==UserScript==
// @name         B站（bilibili）小功能汇总
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  目前提供记录集数观看进度功能，注意：目前还有少部分视频不支持记录，目前只有点击pxx切换p的时候才会记录进度，有时间就会更新~
// @author       anjude
// @match        https://*.bilibili.com/*
// @require      https://cdn.bootcss.com/jquery/3.5.0/jquery.min.js
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @grant        GM_registerMenuCommand
// ==/UserScript==

(function() {
  'use strict';
  console.log(document.location.href)
  console.log(GM_getValue('schedule_chart'))
  var bv_id = -1
  if(/bv(.*)\?/i.exec(document.location.href)){
    bv_id = /bv(.*)\?/i.exec(document.location.href)[1]
  }
  var schedule_chart = GM_getValue('schedule_chart') || []

  // 查询功能入口
  GM_registerMenuCommand("查看当前视频记录", function () {
    schedule_chart = GM_getValue('schedule_chart') || []
    // bv_id part title
    var cur_dic = {}
    for (var i = 0,len = schedule_chart.length; i < len; i++){
      console.log(schedule_chart,schedule_chart[i])
      if(schedule_chart[i].bv_id == bv_id){
        cur_dic = schedule_chart[i]
        break;
      }
    }
    console.log()
    var tip = cur_dic.bv_id ? `您已观看到${cur_dic.part}：${cur_dic.title}` : '本片暂无记录~'
    alert(tip)
  });
  GM_registerMenuCommand("删除所有记录", function () {
    // bv_id part title
    schedule_chart = []
    GM_deleteValue('schedule_chart')
    alert('成功删除！')
    console.log(GM_getValue('schedule_chart'))
  });

  // 监听切换集数事件
  if(document.getElementsByClassName('list-box').length){
    var listen_attr = document.getElementsByClassName('list-box')[0]
    listen_attr.addEventListener('click', listener, false)
  }

  // 监听函数
  function listener(e){
    schedule_chart = GM_getValue('schedule_chart') || []
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
    console.log(schedule_chart)
    GM_setValue('schedule_chart', schedule_chart)
  }
})();