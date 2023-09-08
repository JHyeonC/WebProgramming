const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const { JSDOM } = require('jsdom');

const url = 'https://www.mju.ac.kr/mjukr/8595/subview.do?enc=Zm5jdDF8QEB8JTJGZGlldCUyRm1qdWtyJTJGMTAlMkZ2aWV3LmRvJTNGbW9uZGF5JTNEMjAyMy4wNi4xMiUyNndlZWslM0RuZXh0JTI2';

axios.get(url)
  .then(response => {
    const html = response.data;
    const $ = cheerio.load(html);

    const lunchContent = [];
    const dinnerContent = [];

    $('tr').each((index, element) => {
      const thRowspan2 = $(element).find('th[rowspan="2"]');
      const tdRowspan1 = $(element).find('td[rowspan="1"]');

      if (thRowspan2.length > 0 && tdRowspan1.length > 0) {
        const day = thRowspan2.text();
        const lunchdietClassification = tdRowspan1.text();
        const lunchContents = tdRowspan1.nextAll('td.alignL').first().html();

        let formattedLunchContents = '';

        if (lunchContents) {
          const lunchMenuItems = lunchContents.split('<br>').map(item => item.trim()).filter(item => item !== '');
          formattedLunchContents = lunchMenuItems.join('<br>');
        } else {
          formattedLunchContents = '등록된 중식 내용이 없습니다.';
        }

        lunchContent.push({
          day: day,
          lunchdietClassification: lunchdietClassification,
          lunchdietContents: formattedLunchContents
        });
      }

      if (thRowspan2.length === 0 && tdRowspan1.length > 0) {
        const dinnerdietClassification = tdRowspan1.text();
        const dinnerContents = tdRowspan1.nextAll('td.alignL').first().html();

        let formattedDinnerContents = '';
        if (dinnerContents) {
            const dinnerMenuItems = dinnerContents.split('<br>').map(item => item.trim()).filter(item => item !== '');
            formattedDinnerContents = dinnerMenuItems.join('<br>');
        } else {
            formattedDinnerContents = '등록된 석식 내용이 없습니다.';
        }

        dinnerContent.push({
            dinnerdietClassification: dinnerdietClassification,
            dinnerdietContents: formattedDinnerContents
        });
      }
    });

    // index.html 파일 읽기
    const indexHTML = fs.readFileSync('./todaySikdan.html', 'utf8');

    // 가상의 DOM 생성
    const dom = new JSDOM(indexHTML);
    const document = dom.window.document;

    const lunchMenu = document.querySelector('.lunchMenu');
    lunchMenu.innerHTML = '';

    const row1 = document.createElement('text');
    var today = new Date();
    var month = today.getMonth() + 1;
    var day = today.getDate();
    var formattedDate = (month < 10 ? '0' + month : month) + '.' + (day < 10 ? '0' + day : day);
  
    lunchContent.forEach(item => {
        if (item.day.includes(formattedDate)) {
            row1.innerHTML = item.day + '<br>' + item.lunchdietClassification + '<br>' + item.lunchdietContents;
        }
    });
    lunchMenu.appendChild(row1);

    const dinnerMenu = document.querySelector('.dinnerMenu');
    dinnerMenu.innerHTML = '';

    var today = new Date();
    var startDay = today.getDate() - today.getDay() + 1; // 해당 주의 시작일 설정 (월요일)
    var daysOfWeek = ['일', '월', '화', '수', '목', '금', '토'];

    const row2 = document.createElement('text');
    var date = new Date();
    date.setDate(startDay + 1);

    var month = date.getMonth() + 1;
    var day = date.getDate();
    var dayOfWeek = daysOfWeek[date.getDay()];

    var formattedDate = (month < 10 ? '0' + month : month) + '.' + (day < 10 ? '0' + day : day) + ' ' + ' (' + dayOfWeek + ')';

    var repeatCount = 1; // Default repeat count is 1

    if (dayOfWeek === '화') {
      repeatCount = 2;
    } else if (dayOfWeek === '수') {
      repeatCount = 3;
    } else if (dayOfWeek === '목') {
      repeatCount = 4;
    } else if (dayOfWeek === '금') {
      repeatCount = 5;
    }

    for (var i = 0; i < repeatCount; i++) {
      if(repeatCount-1 == i){
        row2.innerHTML = formattedDate + '<br>' + dinnerContent[i % dinnerContent.length].dinnerdietClassification + '<br>' + dinnerContent[i % dinnerContent.length].dinnerdietContents;
      dinnerMenu.appendChild(row2.cloneNode(true));
      }
    }


    // 변경된 HTML 파일 저장
    const updatedHTML = dom.serialize();
    fs.writeFileSync('./todaySikdan.html', updatedHTML, 'utf8');

    console.log('메뉴가 업데이트되었습니다.');
})
.catch(error => {
    console.log(error);
});