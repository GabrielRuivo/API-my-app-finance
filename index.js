const express = require('express');
const cors = require('cors');
const puppeteer = require('puppeteer');

const app = express();
app.use(cors());
const port = 3000;

app.get('/', async (req, res) => {
  return res.send({ message: 'Server is running !!!' });
})

app.get('/data', async (req, res) => {
  try {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    const data = [];

    const fiis = [
      'hglg11', 
      'bcff11', 
      'XPLG11', 
      'TRBL11', 
      'HSML11', 
      'GGRC11', 
      'FIIB11', 
      'RECR11', 
      'MXRF11', 
      'HTMX11',
      'CVBI11',
      'XPIN11',
      'HFOF11',
      'VISC11',
      'KNCR11',
    ];

    for (let ativo of fiis) {
      await page.goto(`https://statusinvest.com.br/fundos-imobiliarios/${ativo}`);

      const totalValueElement = await page.$(`[title="Valor atual do ativo"] > .value`);
      const totalValue = await page.evaluate(element => element.textContent, totalValueElement);

      const dividendYieldElement = await page.$(`[title="Dividend Yield com base nos últimos 12 meses"] > .value`);
      const dividendYieldValue = await page.evaluate(element => element.textContent, dividendYieldElement);

      await page.waitForSelector('.container');

      const pvpValue = await page.$$eval('div.info', infoDivs => {
        const pvpDiv = infoDivs.find(div => div.querySelector('h3.title').textContent === 'P/VP');
        return pvpDiv.querySelector('strong.value').textContent;
      });

      await delay(500);

      data.push({ ativo, totalValue, dividendYieldValue, pvpValue })
    }

    await browser.close();

    const sortedData = data.sort((a, b) => parseFloat(a.pvpValue.replace(',', '.')) - parseFloat(b.pvpValue.replace(',', '.')));

    res.json(sortedData);
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }

  function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
