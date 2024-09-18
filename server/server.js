const express = require('express');
const path = require('path');
const app = express();
const port = 5000;
const seoul = require('./seoul_camp');
const interpark = require('./interpark');

const puppeteer = require('puppeteer');
const axios = require('axios');


app.use(express.static(path.join(__dirname, 'build')));

app.get('/reserve/:site', async (req, res) => {
  const site = req.params.site;
  try {
    if (site === 'seoul') {
      seoul.start();
    } else if (site === 'interpark') {
      interpark.start();
    }
  } catch (error) {
    console.error("Error during Puppeteer execution", error);
    res.status(500).json({ message: 'Puppeteer 실행 중 오류 발생', error });
  }
});

app.listen(port, async () => {
  console.log(`서버가 http://localhost:${port}에서 실행 중입니다.`);
});
