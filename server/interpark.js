const puppeteer = require('puppeteer');
const fs = require('fs');

const pageConfig = async (page) => {
  try {
    //모든 콘솔 출력
    page.on('console', (msg) => {
      for (let i = 0; i < msg.args().length; ++i)
        console.log(`${i}: ${msg.args()[i]}`);
    });

    //디스플레이 크기
    const dimensions = await page.evaluate(() => {
      return {
        width: window.screen.width,
        height: window.screen.height
      };
    });
    // viewport 크기를 디스플레이의 전체 크기로 설정
    await page.setViewport({
      width: dimensions.width,
      height: dimensions.height
    });

  } catch (e) {
    console.log(e);
  }
}

const openReservationNewPage = async (page, url) => {

  try {
    await page.goto(url, {
      timeout: 100000,
    });

    await page.waitForSelector('a.sideBtn.is-primary');
    await page.evaluate(() => {
      const reservBtn = document.querySelector('a.sideBtn.is-primary');
      if (reservBtn) {
        reservBtn.click();
      }
    });

  } catch (error) {
    console.error('에러 발생:', error);
  }
};

const goMainPage = async (page, url) => {
  await page.goto(url, {
    timeout: 100000,
  });
}

const login = async (page, url) => {
  await page.goto(url, {
    timeout: 100000,
  });

  try {
    await page.evaluate(() => {
      const idInput = document.querySelector('input#userId');
      const pwdInput = document.querySelector('input#userPwd');
      idInput.value = 'lando94';
      pwdInput.value = 'ehgus159!23';
      const loginBtn = document.querySelector('input#btn_login');
      loginBtn.click();
    });

    return page;
  } catch (e) {
    console.log(e);
  }
};

const handleSuccessProcess = (page) => {
  // page.on('dialog', async (dialog) => {
  //   console.log('Alert detected:', dialog.message());
  //   await dialog.accept(); // Enter 키를 자동으로 눌러 alert 창을 닫습니다.
  // });
}

const saveCookies = async (page) => {

  let cookies = await page.cookies();
  const sessionCookies = cookies //비세션 쿠키 리스트

  fs.writeFileSync('./interparkcookies.json', JSON.stringify(sessionCookies, null, 2));
}
const setCookies = async (page) => {
  try {
    const cookiesString = fs.readFileSync('./interparkcookies.json');
    const cookies = JSON.parse(cookiesString);
    await page.setCookie(...cookies);
  } catch (e) {

  }
}

const selectSeat = async (frame) => {
  console.log('selectSeat 함수 실행. frame 이름 : ', frame.name());
  const seatDetailFrame = await frame.waitForSelector('iframe#ifrmSeatDetail');
  const seatDetailFrameContent = await seatDetailFrame.contentFrame();
  console.log('2');
  try {
    await seatDetailFrameContent.waitForSelector('html', { visible: true });
    console.log('3');
    console.log('클릭 이벤트 동작할 프레임 이름: ', seatDetailFrameContent.name());
    await seatDetailFrameContent.evaluate(() => {
      window.clicked = false;
      //이벤트 사라지는 현상 때문에 중복 이벤트 정의
      setTimeout(() => {
        document.addEventListener('click', () => {
          window.clicked = true;
        }, 0);
      });
      setTimeout(() => {
        document.addEventListener('click', () => {
          window.clicked = true;
        }, 100);
      });
      setTimeout(() => {
        document.addEventListener('click', () => {
          window.clicked = true;
        }, 300);
      });
    });
    console.log('4');
    await seatDetailFrameContent.waitForFunction(() => window.clicked, { timeout: 0 });
    console.log('5');
  } catch (e) {
    console.log(e);
  }
  console.log('6');
  const seatSelected = await frame.evaluate(() => {
    const seatCntElement = document.querySelector('form[name="frmSeat"] #SelectedSeatCount');
    if (parseInt(seatCntElement.innerText, 10) > 0) {
      return true;
    } else {
      console.log('문제가 있어서 좌석 선택을 다시 합니다');
      return false;
    }
  });
  if (!seatSelected) {
    await selectSeat(frame);
    return;
  }
  console.log('좌석 선택에 성공했습니다')

  await frame.waitForFunction(() => {
    const img = document.querySelector('.btnWrap img');
    return img && img.src === 'http://ticketimage.interpark.com/TicketImage/onestop/btn_seat_confirm_on.gif';
  });

  await frame.evaluate(() => {
    const completeBtn = document.querySelector('.btnWrap a');
    console.log('버튼 객체', completeBtn);
    if (completeBtn) {
      console.log('다음 버튼을 클릭합니다');
      completeBtn.click();
    }
  });

  return true;
}


const processSecondIframe = async (frame) => {
  console.log('가격/할인 선택을 시작합니다');
  await frame.waitForSelector('select[name="SeatCount"]');
  await frame.evaluate(() => {
    const ticketCntElement = document.querySelector('select[name="SeatCount"]');
    ticketCntElement.value = '1';
  });
};

const nextPageToSecondIframe = async (page, buttonSelector) => {
  await page.waitForSelector(buttonSelector);
  await page.evaluate((buttonSelector) => {
    const nextBtn = document.querySelector(buttonSelector);
    if (nextBtn) {
      nextBtn.click();
    } else {
      console.log('넥스트 버튼이 감지되지 않았습니다');
    }
  }, buttonSelector);
}

const selectDeliveryInfo = async (frame) => {
  await frame.waitForSelector('.deliveryR .orderer td.form input#YYMMDD');
  await frame.evaluate(() => {
    document.querySelector('.deliveryR .orderer td.form input#YYMMDD').value = '940502';
  });
}

const handlePayment = async (frame) => {
  await frame.waitForSelector('label.kakaopay')
  await frame.evaluate(() => {
    const kakaopay = document.querySelector('label.kakaopay');
    console.log('카카오페이라벨 : ', kakaopay)
    const kakaoRadioBtn = kakaopay.parentElement.querySelector('input');
    console.log('카카오페이 체크박스 인풋: ', kakaopay)
    if (kakaoRadioBtn) {
      kakaoRadioBtn.click();
    }
  });
}

const handleAgree = async (frame) => {
  await frame.waitForSelector('.agree_check input#checkAll');
  await frame.evaluate(() => {
    const agreeAllCheck = document.querySelector('.agree_check input#checkAll');
    agreeAllCheck.click();
  });
}

async function start() {
  const mainPageUrl = 'https://tickets.interpark.com/';
  const loginPageUrl = 'https://accounts.interpark.com/login/form';
  const reservationPageUrl = 'https://tickets.interpark.com/goods/24011561';
  const browser = await puppeteer.launch({
    slowMo: 30, //느리게 해서 천천히 보게 하기 위함
    headless: false, //눈으로 보게 함
    devtools: true, //개발자도구
    // args: ['--start-maximized'] //디스플레이 크기 최대로 오픈
  });
  const page = await browser.newPage();
  await pageConfig(page);
  const newPagePromise = new Promise(resolve => browser.on('targetcreated', async target => {
    if (target.type() === 'page') resolve(await target.page());
  }));

  handleSuccessProcess(page);


  // 메인페이지 -> 로그인 폼에서 로그인 -> 쿠키 저장 
  await login(page, loginPageUrl);
  saveCookies(page);

  await setCookies(page);
  openReservationNewPage(page, reservationPageUrl);
  const newPage = await newPagePromise;
  await pageConfig(newPage);
  console.log('새 페이지 감지 성공');

  const iframeHandle1 = await newPage.waitForSelector('iframe#ifrmSeat');
  const frame1 = await iframeHandle1.contentFrame();
  await frame1.waitForSelector('body');

  await selectSeat(frame1);

  const iframeHandle2 = await newPage.waitForSelector('iframe#ifrmBookStep');
  const frame2 = await iframeHandle2.contentFrame();
  await frame2.waitForSelector('body');

  await processSecondIframe(frame2);
  await nextPageToSecondIframe(newPage, buttonSelector = '#SmallNextBtn a#SmallNextBtnLink');

  await selectDeliveryInfo(frame2);
  await nextPageToSecondIframe(newPage, buttonSelector = '#SmallNextBtn a#SmallNextBtnLink');

  await handlePayment(frame2);
  await nextPageToSecondIframe(newPage, buttonSelector = '#SmallNextBtn a#SmallNextBtnLink');

  await handleAgree(frame2);
  await nextPageToSecondIframe(newPage, buttonSelector = '#LargeNextBtnLink');
}

module.exports = {
  start
}