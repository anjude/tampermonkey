// ==UserScript==
// @name         rain
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  give back the answer
// @author       ddl
// @match        *://www.yuketang.cn/*
// @grant	     	 GM_getValue
// @grant	       GM_setValue
// @grant	       GM_registerMenuCommand
// @grant	       GM_addStyle
// @grant	       GM.setClipboard
// ==/UserScript==
(function () {
  'use strict';
  GM_registerMenuCommand("查看已提醒次数", function () {
    alert("已提醒次数：" + (GM_getValue("remind_times") || 0))
  });
  var status = true, shine = false, titleInit = "课堂"
  window.onload = function () {
    titleInit = document.title
    // 判断是否支持提醒
    if (window.Notification) {
      var permission = Notification.permission;
      if (permission === 'granted') {
      } else {
        Notification.requestPermission().then(function (permission) {
          console.log('用户是否允许通知： ', permission === 'granted' ? '允许' : '拒绝');
        });
      }
    } else {
      alert('你的浏览器不支持此消息提示功能，请使用chrome内核的浏览器！')
    }
    if (location.href.match(/ke.qq.com/)) {
      tencent_course();
    }
    if (location.href.match(/yuketang.cn/)) {
      rainingRoom();
    }
  }
  window.onfocus = function () {
    status = false;
    shine = false;
  };
  window.onblur = function () {
    status = true;
    shine = true;
    document.title = titleInit;
  };
  // for IE
  document.onfocusin = function () {
    status = false;
    shine = false;
  };
  document.onfocusout = function () {
    status = true;
    shine = true;
    document.title = titleInit;
  };
  function rainingRoom() {
    var raining_monitor = setInterval(function test() {
      var rain_1 = document.getElementsByClassName("pl10 f16 cfff")
      var rain_2 = document.getElementsByClassName("box-start")
      var rain_3 = document.getElementsByClassName("submit-btn f18").length != 0 ? document.getElementsByClassName("submit-btn f18")[0] : { innerHTML: "none" }
      if ((rain_1.length || rain_2.length || rain_3.innerHTML == "提交答案") && shine) {
        var title = document.title;
        if (/HXDM/.test(title) === false) {
          document.title = '【HXDM】';
        } else {
          document.title = '【come back】';
        }
      } else {
        return;
      }
      if (status) {
        var notification = new Notification('雨课堂', {
          body: "hxdm，有习题！！！",
          icon: "https://lh3.googleusercontent.com/proxy/N6c9yyNg5g3Si-bkRNwbWt6FxVK-Xmra7uuqgHHwEiqrJb0xQc6pMLEH_SGOxwRDhxkB5XbekwR-i5ng1XORK13TCjk1il2uu5mx_gUZce867N5Rjis_"
        });
        notification.onclick = function () {
          console.log('onclick');
        };
        notification.onerror = function (err) {
          alert("显示通知出错，请认真听课！！！")
          console.log(err);
        };
        notification.onclose = function () {
          console.log("close")
        }
        GM_setValue('remind_times', (GM_getValue('remind_times') || 0) + 1);
        console.log("HXDM", GM_getValue('remind_times'))
        status = false
      }
    }, 1000)
    XMLHttpRequest.prototype.send = new Proxy(XMLHttpRequest.prototype.send, {
      "apply": (target, thisArg, args) => {
        thisArg.addEventListener(
          "load", event => {
            const result = JSON.parse(event.target.responseText);
            if (!result.data) { return; }
            if (result.data.answer) {
              var answer = result.data.answer, temp = [], temp2 = ""
              if (typeof (answer) == "object") {
                temp = answer; answer = "";
                for (var i = 0, len = Object.keys(temp).length, key = Object.keys(temp); i < len; i++) {
                  for (var j = 0, len2 = temp[key[i]].length; j < len2; j++) {
                    temp2 = temp2 + temp[key[i]][j] + "/"
                    console.log(temp2)
                  }
                  answer = answer + '_' + (i + 1) + '_' + temp2
                  temp2 = ""
                }
              }
              if (confirm(`正确答案是【${answer}】，得分【${result.data.score}】,是否复制正确答案？`)) {
                GM.setClipboard(answer);
              }
            }
          })
        return target.apply(thisArg, args);
      }
    })
  }
})();