(function() {
    'use strict';
    let dloading = false
    let bangumi = /bilibili.com\/bangumi\/play\//g.test(window.location.href)
    let parentId = bangumi ? 'toolbar_module' : 'arc_toolbar_report'
    //添加样式
    let style = document.createElement("style")
    style.innerHTML =(".coldrainf-get-dm{float:right;}.coldrainf-get-dm>div{display:inline-block;}.coldrainf-get-dm a{font-size:15px;color:#00a1d6;margin:0 12px;line-height:28px;}.coldrainf-get-dm a:hover{cursor:pointer;color:#f25d8e;}")
    document.head.appendChild(style)
    if(bangumi && unsafeWindow.__PGC_USERSTATE__.area_limit != 0) Object.defineProperty(unsafeWindow, '__PGC_USERSTATE__', {get: () => ({area_limit:0, gat: true})})
    //添加按钮
    let addElement = cid => {
        let name = document.title.match(/(.+?)_((.+?)_|哔哩哔哩 )/)[1]
        let title = bangumi ? unsafeWindow.__INITIAL_STATE__.mediaInfo.title : name
        let parent = document.getElementById(parentId)
        let old = document.querySelector('.coldrainf-get-dm')
        if(old) parent.removeChild(old)
        let ele = document.createElement("div")
        ele.className = 'coldrainf-get-dm'
        let iframeTmp = document.querySelector('#coldrainf-iframe')
        if(iframeTmp) document.querySelector('.plp-l').removeChild(iframeTmp)
        let bfq = document.getElementById('player_module')
        if(bfq) bfq.style.display = 'block'
        let jump = document.createElement("a")

        if(bangumi && (unsafeWindow.__INITIAL_STATE__.epPayMent.status != 0 || unsafeWindow.__PGC_USERSTATE__.gat)) {

            let iframe = document.createElement("iframe")
            iframe.id = 'coldrainf-iframe'
            iframe.src = `https://dm.coldrain.top/?dm=${cid}&wd=${title.slice(0,13)}&ep=${unsafeWindow.__INITIAL_STATE__.epInfo.i + 1}`
            // iframe.src = `https://d.mahua-kb.com/20200710/0WduWOme/index.m3u8`
            console.log('cid:',cid,'title:', title, 'title.slice',title.slice(0,13),'window',unsafeWindow.__INITIAL_STATE__.epInfo.i + 1,'src',iframe.src)
            if(document.body.className.includes('player-mode-widescreen')) {
                iframe.style.position = 'absolute'
                iframe.style.top = '0'
            }
            iframe.height = 0
            iframe.width = '100%'
            iframe.setAttribute('frameborder','no')
            iframe.setAttribute('border','0')
            iframe.setAttribute('allowfullscreen','allowfullscreen')
            iframe.setAttribute('webkitallowfullscreen','webkitallowfullscreen')
            document.querySelector('.plp-l').insertBefore(iframe,bfq)

            //手动点击
            jump.textContent = "替换播放器"
            jump.onclick = e => {
                if(unsafeWindow.player) unsafeWindow.player.pause()
                if(bfq.style.display == 'none') return
                iframe.height = bfq.style.height
                window.onresize = () => {
                 iframe.style.height = bfq.style.height
                }
                bfq.style.display = 'none'
            }

        }
        ele.appendChild(jump)
        parent.appendChild(ele)
    }
    //添加换p事件
    let href = window.location.href
    let changeEp = () => {
        let eles = bangumi ? document.querySelectorAll('.plp-r') : document.querySelectorAll('.list-box li')
        if(!eles) return
        eles.forEach(ele => {
            ele.addEventListener('click',e => {
                setTimeout(()=>{
                    if(window.location.href == href) return
                    href = window.location.href
                    document.getElementById(parentId).removeChild(document.querySelector('.coldrainf-get-dm'))
                    addElement(getCid())
                },200)
            })
        })
    }
    //获取cid
    let getCid = () => {
        if(bangumi) return unsafeWindow.__INITIAL_STATE__.epInfo.cid
        else return cid
    }
    let init = () => {
        addElement(getCid())
        changeEp()
    }
    let obs = bangumi ? document.querySelector('#toolbar_module') : document.querySelector('.ops')
    if(!obs) setTimeout(init,500)
    else{
        new MutationObserver(function (mutations, observer) {
            observer.disconnect();
            setTimeout(init,500)
        }).observe(obs, {childList: true, subtree: true});
    }
})();