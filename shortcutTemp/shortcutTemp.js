// ==UserScript==
// @name         网站快捷键模板脚本
// @namespace    http://tampermonkey.net/
// @version      0.0.1
// @icon         https://raw.githubusercontent.com/Anjude/tampermonkey/master/images/weindex-icon.png
// @description  为网站增加自定义快捷键
// @author       豆小匠Coding
// @match        *://*.bilibili.com/*
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
     * 第一步：修改 @match 后的网址为需要使用快捷键的网址，* 表示匹配任何文本，如 *://*.baidu.com/*
     * 第二步：修改 yourKey 的值为你要的键盘键值，如 "Y"（必须为大写字母）,yourKey 这个变量名可以自定义
     * 第三步：通过浏览器开发者模式，右键相应按钮元素，Copy 对应元素的 Copy JS path，放到相应代码块
     * 第四步：刷新对应网站，脚本即可自动应用，按快捷键，调试结果
     */

    let upToTop = "U" // 键盘U，按U回到顶部
    let yourKey = "*" // 键盘*，按*你的功能（*代表一个字母）
    let focus = false   // 如果正在输入文字，屏蔽快捷键

    console.log("[豆小匠Coding]：网站快捷键模板启动！")

    $(document).ready(() => {
        $(document).delegate("input, textarea",
            "focus",
            function() {
                focus = true
                // console.log('onfocus')
            });
        $(document).delegate("input, textarea",
            "blur",
            function() {
                // console.log('onblur')
                focus = false
            });
        $(document).keydown((e) => {
            // console.log('键盘：',e)

            // 如果正在打字或者特殊情况，屏蔽快捷键
            if (focus || _blockKey(e)) return;

            let pressKey = String.fromCharCode(e.keyCode)
            switch (pressKey) {
                case upToTop:
                    console.log("[豆小匠Coding]：按下了 " + pressKey + " ，回到顶部！")
                    let scrollBtn = document.querySelector("#elevator > div.list-box > div.item.back-top > i")  // 投稿视频的按钮
                        || document.querySelector("#app > div.v-wrap > div.float-nav > div > div.item.backup > i")  // 主页的按钮
                        || document.querySelector("#app > div.nav-tools > div.tool-item.backup.iconfont.icon-up")   // 番剧区的按钮
                    if(scrollBtn) scrollBtn.click()
                    break
                case yourKey:
                    console.log("[豆小匠Coding]：按下了 " + pressKey + " ，你的功能！")

                    if(e.altKey){ console.log("如果按了 alt 键，进入这里！") }
                    let yourBtn = document.querySelector("***")  // 功能按钮
                        || document.querySelector("******")  // 同功能按钮
                        || document.querySelector("**********")   // 同功能按钮
                    if(yourBtn) yourBtn.click()
                    break
                default:
                    // console.log("do nothing!")
            }
        })
    });

    // 处理特殊情况需要屏蔽快捷键
    function _blockKey(e) {
        let isBlock = false;
        let pressKey = String.fromCharCode(e.keyCode)

        // do sth if isBlock should be true

        return isBlock;
    }
})();