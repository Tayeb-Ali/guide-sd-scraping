import puppeteer from 'puppeteer';
import * as fs from "fs";

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
            return places.map((place, index) => {
                const name = place.querySelector('.d-Resultinfo:first-child h5')
                const description = place.querySelector('#locationResult_ditel span');
                const address = place.querySelector('.d-Resultinfo:first-child h5');
                const metaTags = place.querySelector('.d-ResultCat');
                const url = place.querySelector('a').getAttribute('onclick').replace(/^location\.href='/, '').replace(/'$/, '');
                let id = index + 1;

                return {
                    title: name ? name.textContent : null,
                    description: description ? description.textContent : null,
                    address: description ? address.textContent : null,
                    metaTags: description ? metaTags.textContent : null,
                    url: "https://www.guide-sd.com" + url,
                    id: id,
                };
            });
        });
        console.log(placesData)


        const delay = ms => new Promise(res => setTimeout(res, ms));
        for (const place of placesData) {
            console.log(`Navigating to: ${place.url}`);
            await page.goto(`${place.url}`)
            await delay(2000);

            const lat = await page.evaluate(() => {
                return parseFloat(document.querySelector('.col-lg-7').textContent.match(/-?\d+\.\d+/g)[0]);
            });

            const lng = await page.evaluate(() => {
                return parseFloat(document.querySelector('.col-lg-7').textContent.match(/-?\d+\.\d+/g)[1]);
            });
            const newData = {
                lat: lat,
                lng: lng
            }
            pushDataToMyObject(place.id, newData, placesData)
            console.log(lat, lng, place.id);

        }
        await browser.close();

    } catch
        (e) {
        console.log("message Error: ", e)
    } finally {
        await browser.close();
    }
}

run().then(() => {
    console.log("end");
});

function pushDataToMyObject(id: number, newData: any, myArray: any) {
    const index = myArray.findIndex(obj => obj.id === id);
    if (index === -1) {
        throw new Error(`Object with ID ${id} not found in array.`);
    }
    myArray[index] = {...myArray[index], ...newData};

    fs.writeFile("./places.json", JSON.stringify(myArray), function (err) {
        if (err) {
            return console.log(err);
        }
    });
}