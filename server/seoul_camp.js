const puppeteer = require('puppeteer');
const axios = require('axios');
const fs = require('fs');

const wantedDay = '20241012';

const sendMessage = (message) => {
  const telegramBotToken = '5867168490:AAGwEwxFEqvybym2KjMCEixZunCQIRfa04o';
  const chatId = '-908386413';
  const sendMessageUrl = `https://api.telegram.org/bot${telegramBotToken}/sendMessage?chat_id=${chatId}&text=${message}`;
  axios.get(sendMessageUrl);
};

const browserConfig = async () => {
  const browser = await puppeteer.launch({
    slowMo: 100, //느리게 해서 천천히 보게 하기 위함
    headless: false, //눈으로 보게 함
    // devtools: true, //개발자도구
    args: ['--start-maximized'] //디스플레이 크기 최대로 오픈
  });
  return browser;
}

const pageConfig = async (browser) => {
  try {
    const page = await browser.newPage();
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

    return page;
  } catch (e) {
    console.log(e);
  }
}

const goMainPage = async (page, url) => {
  await page.goto(url, {
    timeout: 100000,
  });
}

const removePopup = async (page) => {
  try {
    const firstPopup = await page.$('.pop_x');
    const copyrightElement = await page.$('#Copyright_Message');

    if (firstPopup) {
      if (page.click) {
        await page.click('.pop_x');
      }
    }
    if (copyrightElement) {
      await copyrightElement.evaluate((element) => {
        if (element) {
          console.log('팝업 제거');
          element.remove();
        } else {
          console.log('팝업 없음');
        }
      });
    }
  } catch (e) {
    console.log(e);
  }
};

const reservation = (page) => {
  page.evaluate(async () => {
    const reservBtn = document.querySelector('ul.book_btn_box .btn_book');
    await reservBtn.click();
  });
};

const editReservationForm = async (page, url) => {

  try {
    await openReservationPage(url);
    await selectWantedPage();
    await removePopup(page);
    await openAgreementForm();
    await editAgreementForm();
    await removeTrashBtn();
    await ifExistRobotClick();

  } catch (error) {
    console.error('에러 발생:', error);
  }
  async function removeTrashBtn() {
    await page.evaluate(() => {
      Array.from(document.querySelectorAll('.book_btn_box li:not(.active)')).forEach((element) => {
        element.remove();
      });
    });
  }


  async function openReservationPage(url) {
    await page.goto(url, {
      timeout: 100000,
    });
  }

  async function selectWantedPage() {
    await page.waitForSelector('#calendar_' + wantedDay);
    const hasAbleClass = await page.evaluate((selector) => {
      const element = document.querySelector(selector);
      element.classList.add('on');
      element.classList.add('able');
    }, '#calendar_' + wantedDay);
  }

  async function openAgreementForm() {
    // await page.waitForSelector('.common_btn.blue');
    await page.evaluate(() => {
      fnRevervInsertForm(); //예약 정보 입력 창 열기. (여기서 정의된 함수 아님)
    });
    await page.waitForNavigation({
      waitUntil: 'networkidle0',
    });
  }

  async function editAgreementForm() {
    await page.evaluate(async () => {
      const wantedSleepDay = '1';
      const sleepDay = document.querySelector('select#form_cal');
      const allCheckbox = document.querySelector('label[for="chk_agree_all"] span.vchkbox');
      const bookUserPlus = document.querySelector('.book_user button.user_plus');
      const bookUserCnt = document.querySelector('.book_user .user_num')?.innerText;
      sleepDay.value = wantedSleepDay;
      await allCheckbox.click();

      if (!bookUserCnt) {
        await bookUserPlus.click();
      }
    });
  };

  async function ifExistRobotClick() {
    await page.evaluate(async () => {
      const robotArea = document.querySelector('tr.user_phon');
      if (robotArea) {
        robotArea.scrollIntoView({ behavior: "auto", block: "center" });
      }
    });
  }
};

const login = async (page) => {
  try {
    await page.waitForSelector('a[href="/web/loginForm.do"]');
    // await removePopup(page);
    await page.evaluate(() => {
      const link = document.querySelector('a[href="/web/loginForm.do"]');
      if (link) {
        link.click();
      } else {
        throw new Error('Link not found.');
      }
    });
    //계정 정보 입력 페이지 기다리기
    await page.waitForNavigation({
      waitUntil: 'networkidle0',
    });
    //계정 정보 입력 및 로그인 버튼 클릭
    await page.evaluate(() => {
      const userId = 'lando94';
      const userpasswd = 'ehgus159!23';
      const inputUserId = document.querySelector('input[id="userid"]');
      const inputPasswd = document.querySelector('input[id="userpwd"]');
      inputUserId.value = userId;
      inputPasswd.value = userpasswd;
      const loginBtn = document.querySelector('.login_inp_box .btn_login');
      loginBtn.click();
    });
    //로그인 기다리기
    await page.waitForNavigation({
      waitUntil: 'networkidle0',
    });
    try {
      const existFunctionChkInfo = await page.evaluate(() => {
        return typeof chkInfo === 'function';
      });
      if (existFunctionChkInfo) {
        page.evaluate(() => {
          chkInfo();
        });
      }
    } catch (e) {

    }

    return page;
  } catch (e) {
    console.log(e);
  }
};

const handleSuccessProcess = (page) => {
  page.on('dialog', async (dialog) => {
    console.log('Alert detected:', dialog.message());
    if (dialog.message() != '예악마감된 서비스입니다.') {
      await dialog.accept(); // Enter 키를 자동으로 눌러 alert 창을 닫습니다.
    }
    if (dialog.message() == '인증되었습니다.') {
      reservation(page);
      sendMessage(wantedDay + ' 예약을 정상적으로 시도했습니다. 성공 여부는 마이페이지에서 확인 해주세요');
    }
  });
}

const saveCookies = async (page) => {
  const cookies = await page.cookies();
  const sessionCookies = cookies.filter((obj) => obj.expires != -1); //비세션 쿠키 리스트

  fs.writeFileSync('./cookies.json', JSON.stringify(sessionCookies, null, 2));
}
const setCookies = async (page) => {
  try {
    const cookiesString = fs.readFileSync('./cookies.json');
    const cookies = JSON.parse(cookiesString);
    await page.setCookie(...cookies);
  } catch (e) {
    //쿠키 파일 없을 때 에러 방지
  }
}

const startProcess = async (browser) => {
  const mainPageUrl = 'https://yeyak.seoul.go.kr/web/main.do';
  const reservationPageUrl = 'https://yeyak.seoul.go.kr/web/reservation/selectReservView.do?rsv_svc_id=S240808093444122373';

  const page = await pageConfig(browser);
  handleSuccessProcess(page); //최종 인증 완료 다이얼로그(팝업) 생성시 다이얼로그 허용 및 예약버튼 클릭으로 마무리 하는 이벤트

  // 메인페이지 -> 로그인 폼에서 로그인 -> 쿠키 저장 
  // await goMainPage(page, mainPageUrl);
  // await login(page);
  // saveCookies(page);

  await setCookies(page);
  editReservationForm(page, reservationPageUrl);
}

async function start() {
  const browser = await browserConfig();
  for (let i = 0; i < 2; i++) {
    startProcess(browser);
    await sleep(5000);
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = {
  start
}