// ==UserScript==
// @name         【小破站必备】 哔哩哔哩（bilibili|B站）小助手--功能快捷键，每日任务等
// @namespace    http://tampermonkey.net/
// @version      0.0.1
// @icon         https://raw.githubusercontent.com/Anjude/tampermonkey/master/images/bilibili_tool.png
// @description  另一个宝藏B站工具箱脚本的重构版，去掉无用功能，增加更多实用功能！具体看脚本介绍~
// @author       anjude
// @match        https://*.bilibili.com/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @grant        GM_addStyle
// @grant        GM_registerMenuCommand
// @grant        GM_unregisterMenuCommand
// @grant        GM_xmlhttpRequest
// @original-script   https://github.com/Anjude/tampermonkey
// @require           https://cdn.jsdelivr.net/npm/jquery@3.2.1/dist/jquery.min.js
// ==/UserScript==

(function () {
    'use strict'
    // 检查版本
    const RELEASE_VERSION = '0.0.1'
    let updateVersion = RELEASE_VERSION !== GM_getValue('RELEASE_VERSION')
    updateVersion && GM_setValue('RELEASE_VERSION', RELEASE_VERSION)
    // resetScript()
    /**
     * 默认设置
     * `${e.altKey}${e.ctrlKey}${e.shiftKey}${pressKey}`
     */
    let defaultBili2sConf = {
        shortcutMap: {
            upToTop: '000U',   // 回到顶部
            takeNote: '000N',  // 打开视频笔记
            notePicShot: '101P',   // 笔记-视频截图
            noteTimePoint: '101T',   // 笔记-时间标记
        },
        videoRecordMap: {}, // 视频记录
        multiUnceasing: true,   // 多集自动连播
        singleUncreasing: false,    // 单集自动连播
        shareDate: '2022/1/1',
        lastClearup: new Date()
    }
    let bili2sConf = GM_getValue('bili2sConf') || defaultBili2sConf

    if (updateVersion) {
        bili2sConf.shortcutMap = Object.assign(defaultBili2sConf.shortcutMap, bili2sConf.shortcutMap)
        GM_setValue('bili2sConf', bili2sConf)
    }

    // 网站配置
    const siteConfig = {
        delayMs: 2000,
        scrollBtnList: [
            'div.item.back-top', // 首页
            'div.item.backup',  // up视频,
            'div.tool-item.backup.iconfont.icon-up',  // 
            '#app > div.to-top', // up主所有视频
            '#cheese_guide > div > div'  // 课堂
        ],
        noteBtnList: [
            'div.note-btn', // 普通up视频
            'span.note-btn'  // 课堂视频
        ],
        notePanelList: [
            'div.resizable-component.bili-note' // 普通up视频
        ],
        picBtnList: ['span.ql-capture-btn'],
        pointBtnList: ['span.ql-tag-btn'],
        multiPageBox: ['#multi_page > div.cur-list'],
        chapListItem: ['div.cur-list > ul > li.on'],
        shareBtnList: ['div.share-btns > div:nth-child(6)'],
        unceasingBtnList: ['span.switch-button'],
        searchResBox: [
            '#video-list > ul',
            'div.mixin-list > ul.video-list',    // 番剧
            'div.flow-loader > ul'
        ]
    }

    const getElement = (list) => {
        let btn = document.querySelector(list[0])
        list.forEach(e => { btn = document.querySelector(e) || btn })
        return btn
    }

    const getBvid = (href) => {
        return /video\/([^\?]*)/i.exec(href || document.location.href)[1]
    }

    const UpToTop = () => { // 回到顶部
        let scrollBtn = getElement(siteConfig.scrollBtnList)
        if (scrollBtn) scrollBtn.click()
    }

    const TakeNote = () => {
        let noteBtn = getElement(siteConfig.noteBtnList)
        let nodePanel = getElement(siteConfig.notePanelList)
        let res = nodePanel || (() => {
            noteBtn.click()
            return false
        })()
        if (!res) return

        nodePanel.style.display = nodePanel.style.display === 'none'
            ? '' : 'none'
    }

    const NotePicShot = () => {
        let picBtn = getElement(siteConfig.picBtnList)
        picBtn.click()
    }

    const NoteTimePoint = () => {
        let pointBtn = getElement(siteConfig.pointBtnList)
        pointBtn.click()
    }

    const keyCtrl = () => {

    }

    const blockKey = (e) => {
        let isBlock = false

        // do sth if isBlock should be true

        return isBlock
    }

    let focus = false   // 输入中
    $(document).ready(() => {
        $(document).delegate('input, textarea',
            'focus', () => { focus = true })
        $(document).delegate('input, textarea',
            'blur', () => { focus = false })
        $(document).keydown((e) => {
            // 如果正在打字或者特殊情况，屏蔽快捷键
            if (!e.altKey && !e.shiftKey && !e.ctrlKey
                && (focus || blockKey(e))) {
                return
            }
            const k = (key) => key ? 1 : 0
            let pressKey = String.fromCharCode(e.keyCode)
            let command = `${k(e.altKey)}${k(e.ctrlKey)}${k(e.shiftKey)}${pressKey}`
            let keyMap = bili2sConf.shortcutMap

            // console.log('键盘:', command)
            switch (command) {
                case keyMap.upToTop:
                    return UpToTop()
                case keyMap.takeNote:
                    return TakeNote()
                case keyMap.notePicShot:
                    return NotePicShot()
                case keyMap.noteTimePoint:
                    return NoteTimePoint()
                default:
                    keyCtrl(command)  // 一些不常用的小操作，集中一个函数处理
            }
        })
    })

    const startHttpProxy = () => {
        XMLHttpRequest.prototype.send = new Proxy(XMLHttpRequest.prototype.send, {
            apply: (target, thisArg, args) => {
                thisArg.addEventListener('load', event => {
                    try {
                        // console.log(111, event.target.responseURL)
                        let { responseText, responseURL } = event.target
                        if (!/^{.*}$/.test(responseText)) return
                        const result = JSON.parse(responseText);
                        /\/player\/playurl/.test(responseURL)
                            && chapListener(result);
                        /x\/web-interface\/search/.test(responseURL)
                            && dealRead(result)
                    } catch (err) { }
                })
                return target.apply(thisArg, args)
            }
        })
    }

    const chapListener = (res) => {
        let listItem = getElement(chapListItem).innerHTML
        let regxList = /video\/([^\?]*)\?p=(\d+)'.*title='(.*?)'><div/i.exec(listItem)
        Object.assign(bili2sConf.videoRecordMap, {
            [regxList[1]]: {
                p: regxList[2],
                title: regxList[3],
                updateTime: new Date()
            }
        })
        GM_setValue('bili2sConf', bili2sConf)
    }

    const multiPageJump = () => {
        let bvid = getBvid()
        let videoHis = bili2sConf.videoRecordMap[bvid]
        videoHis && (() => {
            document.querySelector(`div.cur-list > ul > li:nth-child(${videoHis.p}) > a`).click()
            Toast('小助手: 跳转上次观看集数')
        })()
    }

    const setVideoRecord = () => {
        let bvid = getBvid()
        let videoRecord = bili2sConf.videoRecordMap[bvid] || {}
        videoRecord.updateTime = new Date()
        videoRecord.docTitle = document.title
        Object.assign(bili2sConf.videoRecordMap, {
            [bvid]: videoRecord
        })
        GM_setValue('bili2sConf', bili2sConf)
    }

    const dealUnceasing = (isMultiPage) => {
        // 处理连播
        let switchCase = isMultiPage ? 'multiUnceasing' : 'singleUncreasing'
        let unceasingBtn = getElement(siteConfig.unceasingBtnList)
        let curUnceasing = /switch-button on/.test(unceasingBtn.getAttribute('class'))
        curUnceasing === bili2sConf[switchCase]
            || unceasingBtn.click()
        unceasingBtn.addEventListener("click", (e) => {
            // 过滤脚本模拟点击
            if (e.isTrusted) {
                bili2sConf[switchCase] = !/switch-button on/.test(unceasingBtn.getAttribute('class'))
                GM_setValue('bili2sConf', bili2sConf);
            }
        })
    }

    const doShare = () => {
        console.log('[B站小助手]: 开始分享!')
        let shareBtn = getElement(siteConfig.shareBtnList)
        shareBtn.click()
        document.body.lastChild.remove()
        bili2sConf.shareDate = new Date().toLocaleDateString()
        GM_setValue('bili2sConf', bili2sConf)
        console.log('[B站小助手]: 分享完成!')
        Toast('小助手: 今日分享任务达成')
    }

    const dealRead = (res) => {
        let searchResBox = getElement(siteConfig.searchResBox)
        console.log(searchResBox.childNodes)
        let resList = searchResBox.childNodes
        resList.forEach(e => {
            let bvid = getBvid(e.innerHTML)
            let addDiv = document.createElement("div")
            addDiv.className = 'video-view'
            if (bili2sConf.videoRecordMap[bvid]) {
                addDiv.innerHTML = "看过";
                addDiv.style.opacity = 1;
                addDiv.style.color = 'red';
            } else {
                addDiv.innerHTML = "未看";
            }
            e.prepend(addDiv);
        })
    }

    const runScript = () => {
        let date = new Date().toLocaleDateString()
        let href = window.location.href
        let isMultiPage = getElement(siteConfig.multiPageBox)
        if (isMultiPage) {
            setTimeout(() => { multiPageJump() }, siteConfig.delayMs)
        }
        if (/\/video\//.test(href)) {
            setTimeout(() => {
                setVideoRecord()
                dealUnceasing(isMultiPage)
                date === bili2sConf.shareDate || doShare()
            }, siteConfig.delayMs);
        }
        if (/search.bilibili.com/.test(href)) {
            setTimeout(() => {
                dealRead()
            }, siteConfig.delayMs)
        }
    }

    // 执行脚本
    try {
        startHttpProxy()
        runScript()
        clearupStore()
        // console.log('[B站小助手]:', bili2sConf)
    } catch (err) {
        console.log('[B站小助手]:', err)
    }

    function resetScript() {
        GM_deleteValue('bili2sConf')
    }

    function clearupStore() {
        const getDayDiff = (d) => {
            return (new Date() - new Date(d)) / (1000 * 60 * 60 * 24)
        }
        let dayDiff = getDayDiff(bili2sConf.lastClearup)
        if (dayDiff < 30) return    // 每月清理一次数据
        console.log('[B站小助手]:开始清理!')

        let recordMapKeys = Object.keys(bili2sConf.videoRecordMap)
        recordMapKeys.forEach(e => {
            let updateTime = bili2sConf.videoRecordMap[e].updateTime
            if (getDayDiff(updateTime) > 365 * 2) {
                delete bili2sConf.videoRecordMap[e]
            }
        })
        bili2sConf.lastClearup = new Date()
        GM_setValue('bili2sConf', bili2sConf)
    }

    function Toast(message = "已完成", time = 2000) {
        /*设置信息框停留的默认时间*/
        let el = document.createElement("div")
        el.setAttribute("class", "web-toast")
        el.innerHTML = message
        document.body.appendChild(el);
        el.classList.add("fadeIn");
        setTimeout(() => {
            el.classList.remove("fadeIn")
            el.classList.add("fadeOut")
            /*监听动画结束，移除提示信息元素*/
            el.addEventListener("animationend", () => {
                document.body.removeChild(el)
            })
            el.addEventListener("webkitAnimationEnd", () => {
                document.body.removeChild(el)
            })
        }, time)
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
