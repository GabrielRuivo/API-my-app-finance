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
      'KNCR11',
      'VISC11',
      'XPLG11', 
      'hglg11', 
      'bcff11', 
      'HTMX11',
      'CVBI11',
      'FIIB11', 
      'MXRF11', 
      'RECR11', 
      'HSML11', 
      'TRBL11', 
      'GGRC11', 
      'XPIN11',
      'HFOF11'
    ];

    for (let ticker of fiis) {
      await page.goto(`https://statusinvest.com.br/fundos-imobiliarios/${ticker}`);

      const totalValueElement = await page.$(`[title="Valor atual do ativo"] > .value`);
      const totalValue = await page.evaluate(element => element.textContent, totalValueElement);

      const dividendYieldElement = await page.$(`[title="Dividend Yield com base nos últimos 12 meses"] > .value`);
      const dividendYieldValue = await page.evaluate(element => element.textContent, dividendYieldElement);

      await page.waitForSelector('.container');

      const pvpValue = await page.$$eval('div.info', infoDivs => {
        const pvpDiv = infoDivs.find(div => div.querySelector('h3.title').textContent === 'P/VP');
        return pvpDiv.querySelector('strong.value').textContent;
      }); 

      const nextDividendElement = await page.$('#main-2 > div.container.pb-7 > div.mt-5.d-flex.flex-wrap.flex-lg-nowrap.justify-between > div.bg-secondary.white-text.card.w-100.w-md-45 > div > div:nth-child(2) > div:nth-child(1) > div:nth-child(1) > div > b');
      const nextDividend = await page.evaluate(el => el.textContent, nextDividendElement)

      const lastDividendElement = await page.$('#dy-info > div > div:nth-child(2) > div:nth-child(1) > div:nth-child(1) > div > b');
      const lastDividend = await page.evaluate(el => el.textContent, lastDividendElement)

      const numberShareholderElement = await page.$('#main-2 > div.container.pb-7 > div:nth-child(5) > div > div:nth-child(6) > div > div:nth-child(1) > strong');
      const numberShareholder = await page.evaluate(el => el.textContent, numberShareholderElement)

      const averageDailyLiquidityElement = await page.$('#main-2 > div.container.pb-7 > div:nth-child(6) > div > div > div.info.p-0 > div > div > div > strong');
      const averageDailyLiquidity = await page.evaluate(el => el.textContent, averageDailyLiquidityElement)
      
      const followUpElement = await page.$('#fund-section > div > div > div.card.bg-main-gd-h.white-text.rounded.pt-1.pb-1 > div > div:nth-child(1) > div > div > div > a > strong');
      const followUp = await page.evaluate(el => el.textContent, followUpElement)

      await delay(500);

      data.push({ 
        ativo: ticker, 
        seguimento: followUp,
        valor: totalValue, 
        dividendosUltimos12Meses: dividendYieldValue, 
        pvp: pvpValue, 
        proximoDividendo: nextDividend, 
        ultimoDividendo: lastDividend, 
        cotistas: numberShareholder,
        liquidezMediaDiaria: averageDailyLiquidity
      })
    }

    await browser.close();

    const sortedData = data.sort((a, b) => {
      // Ordena pelo menor pvp
      const pvpA = parseFloat(a.pvp.replace(',', '.'));
      const pvpB = parseFloat(b.pvp.replace(',', '.'));
      if (pvpA !== pvpB) return pvpA - pvpB;
      
      // Ordena pelo maior proximoDividendo, ignorando se for "-"
      const proxDivA = a.proximoDividendo === "-" ? -Infinity : parseFloat(a.proximoDividendo.replace(',', '.'));
      const proxDivB = b.proximoDividendo === "-" ? -Infinity : parseFloat(b.proximoDividendo.replace(',', '.'));
      if (proxDivA !== proxDivB) return proxDivB - proxDivA;
  
      // Ordena pelo maior ultimoDividendo
      const ultDivA = parseFloat(a.ultimoDividendo.replace(',', '.'));
      const ultDivB = parseFloat(b.ultimoDividendo.replace(',', '.'));
      return ultDivB - ultDivA;
    });  

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
