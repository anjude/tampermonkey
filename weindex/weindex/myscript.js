chrome.extension.sendRequest({action: "getBlackList"}, function (response) {
    const blackList = response.blackList;
    console.info('blackList', blackList);
    let username;
    setInterval(() => {
        let newUsername = $('.username').text().trim();
        if (newUsername === username) {
            return;
        }
        username = newUsername;
        if (blackList.includes(username)) {
            // $('html').css('filter', 'invert(1)');

            // $('p, span, a').each((index, item) => {
            //         $(item).text('营销号');
            //     }
            // )

            console.error('您正在浏览营销号内容');
            document.title = '您正在浏览营销号内容！！！';
            $('.follow-btn').text('我是营销号');
            $('.follow-btn').css('background', 'red');
            $('.appeal-text').css('border', '5px solid red').css('font-size', '24px')
            $('.ops').html('<p style="color:red;font-weight: bold;font-size: 24px">这是一个光荣的营销号，随手举报传递正能量 →</p>')
            $('.ipt-txt').text('营销号+1');
            $('body').append('<video src="https://636f-codenav-8grj8px727565176-1256524210.tcb.qcloud.la/audio.mp4" autoplay style="display: none"></video>')
        }
    }, 2000)
});

