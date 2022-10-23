import "dotenv/config";
import puppeteer from "puppeteer";
import { Telegraf } from "telegraf";

const telegramBotToken = process.env.BOT_TOKEN;
const bot = new Telegraf(telegramBotToken); //сюда помещается токен, который дал botFather
const urlToGo =
  "https://www.letgo.com/alanya_g5000085/q-Mikrodalga?isSearchCall=true";

console.log("Я запущен, всё ок!");

console.log(bot);
bot.start((ctx) => {
  (async () => {
    console.log("поехали");
    await ctx.reply("Поехали!");

    await ctx.reply("⏳ Запускаю браузер . . .");
    // запускаем браузер
    const browser = await puppeteer.launch({
      executablePath:
        "./node_modules/chromium/lib/chromium/chrome-linux/chrome",
      headless: true,
      defaultViewport: null,
      args: ["--incognito", "--no-sandbox", "--single-process", "--no-zygote"],
    });

    await ctx.reply("⏳ Открываю вкладку . . .");
    // создаём страницу
    const page = await browser.newPage();

    console.log("создали страницу");

    await ctx.reply("⏳ Перехожу на сайт letgo . . .");
    // переходим по адресу
    await page.goto(urlToGo);

    console.log("перешли по адресу");

    // ждём, пока подгрузятся остальные данные
    await page.waitForTimeout(3000);

    console.log("подождали");

    await ctx.reply("⏳ Делаю скриншот . . .");
    // меняем вьюпорт
    await page.setViewport({ width: 1000, height: 1000 });

    console.log("поменяли вьюпорт");

    // делаем скрин
    await page.screenshot({ path: "initialScreen.png", fullPage: true });

    console.log("сделали скрин");

    await ctx.reply("⏳ Почти закончил . . . ");
    await ctx.replyWithPhoto(
      { source: "./initialScreen.png" },
      {
        caption: `✅ Готово! Запустил поиск новых товаров по странице: ${urlToGo}`,
      }
    );

    let titleOfTheLastItem = await page.evaluate(() => {
      return Array.from(
        document.querySelectorAll("[data-aut-id='itemTitle']")
      )[7].textContent;
    });

    let priceOfTheLastItem = await page.evaluate(() => {
      return Array.from(
        document.querySelectorAll("[data-aut-id='itemPrice']")
      )[7].textContent;
    });

    setInterval(async () => {
      // перезагружаем страницу
      await page.reload({ waitUntil: ["networkidle0", "domcontentloaded"] });

      try {
        // находим название восьмого товара
        const titleOfTheLastItemAfterReload = await page.evaluate(
          () =>
            Array.from(
              document.querySelectorAll("[data-aut-id='itemTitle']")
            )[7].textContent
        );

        // находим цену восьмого товара
        const priceOfTheLastItemAfterReload = await page.evaluate(
          () =>
            Array.from(
              document.querySelectorAll("[data-aut-id='itemPrice']")
            )[7].textContent
        );

        // Если у последнего товара не совпадает название или цена
        if (
          titleOfTheLastItem !== titleOfTheLastItemAfterReload ||
          priceOfTheLastItem !== priceOfTheLastItemAfterReload
        ) {
          // делаем скрин

          await page.screenshot({ path: "newScreen.png", fullPage: true });

          // уведомляем
          await ctx.replyWithPhoto(
            { source: "./newScreen.png" },
            {
              caption: `Появился новый товар. Вот ссылка: ${urlToGo} `,
            }
          );

          // Обновляем название и цену
          titleOfTheLastItem = titleOfTheLastItemAfterReload;
          priceOfTheLastItem = priceOfTheLastItemAfterReload;
        }
        console.log(`${new Date()}, всё отработало норм`);
      } catch (e) {
        console.log(e);
      }
    }, 60000);
  })();
});

bot.launch();
