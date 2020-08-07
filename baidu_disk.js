// ==UserScript==
// @name         网盘视频倍速
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  增加当前倍速按钮，最新版
// @author       anjude
// @match        *://*.pan.baidu.com/*
// @require      https://cdn.bootcss.com/jquery/3.5.0/jquery.min.js
// @grant        none
// ==/UserScript==

(function() {
	'use strict';
	window.onload = function() {
		var elm = document.getElementById("video-toolbar");

		var btn1 = document.createElement("button");
		var cur_choose = btn1;
		var node1 = document.createTextNode("1倍");
		btn1.appendChild(node1);
		elm.appendChild(btn1);

		var btn125 = document.createElement("button");
		var node = document.createTextNode("1.25倍");
		btn125.appendChild(node);
		elm.appendChild(btn125);

		var btn15 = document.createElement("button");
		var node2 = document.createTextNode("1.5倍");
		btn15.appendChild(node2);
		elm.appendChild(btn15);

		var btn175 = document.createElement("button");
		var node3 = document.createTextNode("1.75倍");
		btn175.appendChild(node3);
		elm.appendChild(btn175);

		var btn2 = document.createElement("button");
		var node4 = document.createTextNode("2倍");
		btn2.appendChild(node4);
		elm.appendChild(btn2);

		var btn3 = document.createElement("button");
		var node5 = document.createTextNode("3倍");
		btn3.appendChild(node5);
		elm.appendChild(btn3);

		btn1.style.marginLeft = "300px";
		var selected = (btn) => {
			cur_choose.style.backgroundColor = "white";
			cur_choose.style.color = "black";
			cur_choose = btn;
			cur_choose.style.backgroundColor = "black";
			cur_choose.style.color = "white";
		}

		btn1.onclick = function() {
			selected(btn1)
			window.videojs.getPlayers("video-player").html5player.tech_.setPlaybackRate(1)
		}

		btn125.onclick = function() {
			selected(btn125)
			window.videojs.getPlayers("video-player").html5player.tech_.setPlaybackRate(1.25)
		}

		btn15.onclick = function() {
			selected(btn15)
			window.videojs.getPlayers("video-player").html5player.tech_.setPlaybackRate(1.5)
		};

		btn175.onclick = function() {
			selected(btn175)
			window.videojs.getPlayers("video-player").html5player.tech_.setPlaybackRate(1.75)
		}

		btn2.onclick = function() {
			selected(btn2)
			window.videojs.getPlayers("video-player").html5player.tech_.setPlaybackRate(2)
		}

		btn3.onclick = function() {
			selected(btn3)
			window.videojs.getPlayers("video-player").html5player.tech_.setPlaybackRate(3)
		}

		// 去除广告
		$('.privilege-box')[0].remove()
	}
})();