import puppeteer from 'puppeteer';

const siteUrl = "https://www.guide-sd.com";

async function run() {
    const browser = await puppeteer.launch({
        headless: "new",
        ignoreDefaultArgs: ['--disable-extensions'],
    });
    const page = await browser.newPage();

    try {
        page.setDefaultNavigationTimeout(2 * 60 * 1000);
        await page.goto(`${siteUrl}/dalil/Locations/3/%D9%85%D9%80%D9%80%D8%B1%D8%A7%D9%81%D9%82-%D8%A7%D9%84%D8%B7%D8%A8%D9%8A%D8%A9`)
        const placesData = await page.evaluate(() => {
            const places = Array.from(document.querySelectorAll('.d-BoxResult'));
            return places.map(place => {
                const name = place.querySelector('.d-Resultinfo:first-child h5')
                const description = place.querySelector('#locationResult_ditel span');
                const address = place.querySelector('.d-Resultinfo:first-child h5');
                const metaTags = place.querySelector('.d-ResultCat');
                const url = place.querySelector('a').getAttribute('onclick').replace(/^location\.href='/, '').replace(/'$/, '');
                // const url = anchor.getAttribute('onclick').replace(/^location\.href='/, '').replace(/'$/, '');

                return {
                    title: name ? name.textContent : null,
                    description: description ? description.textContent : null,
                    address: description ? address.textContent : null,
                    metaTags: description ? metaTags.textContent : null,
                    url: url
                };
            });
        });
        console.log(placesData)

        const delay = ms => new Promise(res => setTimeout(res, ms));
        for (const place of placesData) {
            console.log(`Navigating to: ${place.url}`);
            await page.goto(`${siteUrl}${place.url}`)
            await delay(2000);

            const lat = await page.evaluate(() => {
                return parseFloat(document.querySelector('.col-lg-7').textContent.match(/-?\d+\.\d+/g)[0]);
            });

            const lng = await page.evaluate(() => {
                return parseFloat(document.querySelector('.col-lg-7').textContent.match(/-?\d+\.\d+/g)[1]);
            });

            console.log(lat, lng);
        }
        await browser.close();
    } catch (e) {
        console.log("message Error: ", e)
    } finally {
        await browser.close();
    }
}

run().then(() => {
    console.log("end");
});