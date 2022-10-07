// ==UserScript==
// @name         bplus
// @namespace    http://tampermonkey.net/
// @version      0.0.1
// @icon         https://cdn.jsdelivr.net/gh/Anjude/pubsrc@img/1.png
// @description  bplus，刷B站推荐视频的时候，提供点击查看上一批按钮，避免换一换后错过想看的视频，却无法返回的尴尬情况...
// @author       anjude
// @match        https://*.bilibili.com/*
// @grant        GM_xmlhttpRequest
// @original-script   https://github.com/Anjude/tampermonkey
// @require      https://lf26-cdn-tos.bytecdntp.com/cdn/expire-1-M/jquery/3.2.1/jquery.min.js
// ==/UserScript==

class FeedQueue {
  constructor() {
    this.feed_items = []
    this.curr = -1
  }

  // 入队
  enqueue(e){
    this.feed_items.push(e)
    this.curr++
  }

  // 重置
  empty(){
    this.feed_items = []
    this.curr = -1
  }

  // 获取上一批
  peek(){
    if (this.curr < 0){
      return this.curr
    }
    let e = this.feed_items[this.curr]
    // 循环队列
    this.curr = this.curr == 0 ? this.feed_items.length - 1 : this.curr - 1
    return e
  }

  resetCurr(){
    this.curr = this.feed_items.length - 1
  }
}

(function () {
  "use strict";
  console.log("[bplus]：running！");
  const site_data = {
    origin_elem: null,
    feed_queue: new FeedQueue(),
    delay2s: 2000,
    err_code: -1
  }

  const getPreFeed = ()=>{
    let e = site_data.feed_queue.peek()
    if (e == site_data.err_code){return}
    $('div.recommended-container').replaceWith(e)
    
    let feed_btn = document.querySelector("div.feed-roll-btn > button:nth-child(1)")
    feed_btn.addEventListener("click",(e)=> {
      // 恢复数据
      $("div.recommended-container").replaceWith(site_data.origin_elem)
      site_data.feed_queue.resetCurr()
      document.querySelector("div.feed-roll-btn > button:nth-child(1)").click()
    })
    document.querySelector("div.feed-roll-btn > button:nth-child(2)").addEventListener("click",getPreFeed)
  }

  const initSaveFeed = (replace = false)=>{
    let feed_btn = document.querySelector("div.feed-roll-btn > button:nth-child(1)")
    if (!feed_btn){ return }
    feed_btn.addEventListener("click",(e)=> {
      console.log(site_data.feed_queue.feed_items)
      let feed_container = $("div.recommended-container").clone(true)
      site_data.origin_elem = $("div.recommended-container")[0]
      site_data.feed_queue.enqueue(feed_container)
    })
    if (!replace){
      let pre_feed_btn = $("div.feed-roll-btn > button").clone()
      pre_feed_btn.appendTo("div.feed-roll-btn")
      document.querySelector("div.feed-roll-btn > button:nth-child(2) > span").innerHTML = "上一批"
    }
    document.querySelector("div.feed-roll-btn > button:nth-child(2)").addEventListener("click",getPreFeed)
  }

  let init = ()=>{
    // 保存 feed list
    initSaveFeed()
  }

  setTimeout(() => {
    init()
  }, site_data.delay2s);

})();
