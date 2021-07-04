// ==UserScript==
// @name         【最新】全网资源聚合搜索
// @namespace    http://tampermonkey.net/
// @version      0.0.1
// @icon         https://raw.githubusercontent.com/Anjude/tampermonkey/master/images/weindex-icon.png
// @description  按 alt + j 跳转聚合导航页面，选择相应搜索引擎，即可跳转你需要的资源，后面会不断筛选最强力的搜索引擎~
// @author       anjude
// @match        *
// @include      *
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

(function() {
    'use strict';
    /**
     * 键盘编码：https://blog.csdn.net/zhaozhbcn/article/details/38852583
     * 对应编码数值填至相应设置中就可以
     * 例子： let toWeindex = 77 为键盘 M ，把原本66改为77即可
     */

    let toWeindex = 74 // 键盘J，跳转聚合导航

    let focus = false

    console.log("[全网资源聚合搜索]：启动")

    $(document).ready(() => {
        $(document).delegate("input, textarea",
            "focus",
            function() {
                focus = true
                console.log('onfocus')
            });
        $(document).delegate("input, textarea",
            "blur",
            function() {
                console.log('onblur')
                focus = false
            });
        $(document).keydown((e) => {
        	// 如果正在打字或者特殊情况，屏蔽快捷键
            if (!e.altKey && (focus || _blockKey(e))) {
                return;
            }
            // console.log('键盘：',e)
            switch (e.keyCode) {
                case toWeindex:
                    if (e.altKey) {
                        window.open("http://39.108.128.80/#/")
                    }
                    break
                default:
                    console.log("do nothing!")
            }
        })
    });


    // 处理需要屏蔽快捷键
    function _blockKey(e) {
    	let isBlock = false;
        // do sth if isBlock should be true
        return isBlock;
    }


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