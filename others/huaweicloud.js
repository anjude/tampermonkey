// ==UserScript==
// @name         临时插件
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  wbbb
// @author       wbbb
// @match          *://*.huaweicloud1.com/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @grant        GM_addStyle
// @grant        GM.setClipboard
// ==/UserScript==
(function() {
    'use strict';
    let times = 1;
    XMLHttpRequest.prototype.send = new Proxy(XMLHttpRequest.prototype.send, {
        "apply": (target, thisArg, args) => {
            thisArg.addEventListener(
                "load", event => {
                    console.log("this111:", event)
                    const result = JSON.parse(event.target.responseText);
                    times++;
                    if(result.attempts_used){
                        _toast({ message: "使用:" + result.attempts_used + "\n" +
                                "成绩:" + result.current_score + "\n" +
                                "变化:" + result.progress_changed + "\n" +
                                "总可能:" + result.total_possible, time: 5000 })
                    }
                    console.log("this:", result)
                })
            return target.apply(thisArg, args);
        }
    })

    function _toast(params = { message: "已完成", time: 2000 }) {
        /*设置信息框停留的默认时间*/
        var time = params.time || 2000;
        var el = document.createElement("div");
        el.setAttribute("class", "web-toast");
        el.innerHTML = params.message || "已完成";
        document.body.appendChild(el);
        el.classList.add("fadeIn");
        setTimeout(function() {
            el.classList.remove("fadeIn");
            el.classList.add("fadeOut");
            /*监听动画结束，移除提示信息元素*/
            el.addEventListener("animationend", function() {
                document.body.removeChild(el);
            });
            el.addEventListener("webkitAnimationEnd", function() {
                document.body.removeChild(el);
            });
        }, time);
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