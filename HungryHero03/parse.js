const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const { JSDOM } = require('jsdom');

const url = 'https://www.mju.ac.kr/mjukr/8595/subview.do?enc=Zm5jdDF8QEB8JTJGZGlldCUyRm1qdWtyJTJGMTAlMkZ2aWV3LmRvJTNGbW9uZGF5JTNEMjAyMy4wNi4xOSUyNndlZWslM0RwcmUlMjY%3D';

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
          formattedLunchContents = lunchMenuItems.join('\n');
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
            formattedDinnerContents = dinnerMenuItems.join('\n');
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
    const indexHTML = fs.readFileSync('./c_/weekSikdan.html', 'utf8');

    // 가상의 DOM 생성
    const dom = new JSDOM(indexHTML);
    const document = dom.window.document;

    // 기존의 tbody 요소 제거
    const tbody = document.querySelector('tbody');
    tbody.innerHTML = '';

    // tbody 내용 채우기
    const row1 = document.createElement('tr');
    lunchContent.forEach(item => {

        const dayCell = document.createElement('td');
        dayCell.innerHTML = item.day + '<br>'+item.lunchdietClassification+'<br>'+item.lunchdietContents;
        row1.appendChild(dayCell);
    });
    tbody.appendChild(row1);

    const row2 = document.createElement('tr');
    dinnerContent.forEach(item => {

        const dayCell = document.createElement('td');
        dayCell.innerHTML = item.dinnerdietClassification+'<br>'+item.dinnerdietContents;
        row2.appendChild(dayCell);
    });
    tbody.appendChild(row2);

    // 변경된 HTML 파일 저장
    const updatedHTML = dom.serialize();
    fs.writeFileSync('weekSikdan.html', updatedHTML, 'utf8');

    console.log('테이블이 업데이트되었습니다.');
  })
  .catch(error => {
    console.log(error);
  });
