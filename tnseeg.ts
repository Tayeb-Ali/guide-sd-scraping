import puppeteer from 'puppeteer';
import * as fs from "fs";
// import carsJson from "./cars.json";

const siteUrl = "https://tnseeg.net/";
// or from local disk
// const siteUrl = "file:///D:/sites/home.html";
const delay = ms => new Promise(res => setTimeout(res, ms));

async function run() {
    const browser = await puppeteer.launch({
        headless: "new",
        ignoreDefaultArgs: ['--disable-extensions'],
    });
    const page = await browser.newPage();
    await page.setJavaScriptEnabled(false);
    await page.setCacheEnabled(true);
    await page.setRequestInterception(true);
    await page.on('request', (request) => {
        if (request.resourceType() === 'stylesheet' ||
            request.resourceType() === 'script' ||
            request.url().includes('googleapis') ||
            request.resourceType() === 'image'
        ) {
            request.abort();
        } else {
            request.continue();
        }
    });

    try {
        await page.setDefaultNavigationTimeout(0);
        await page.goto(siteUrl)
        const carData = await page.evaluate(() => {
            const cars = Array.from(document.querySelectorAll('.table-responsive-md tbody tr'));
            return cars.map((car, index) => {
                const plate_numbers = car.querySelector('td:nth-child(2)')
                const description = car.querySelector('td:nth-child(3)');
                const chassis_numbers = car.querySelector('td:nth-child(4)');
                const url = car.querySelector('td:nth-child(2) a');
                let id = index + 1;

                return {
                    name: plate_numbers ? plate_numbers.textContent.trim() : null,
                    description: description ? description.textContent.trim() : null,
                    chassis_numbers: chassis_numbers ? chassis_numbers.textContent.trim() : null,
                    url: url ? url.getAttribute('href').trim() : null,
                    id: id,
                };
            });
        });

        console.log(carData)

        for (const car of carData) {
            console.log(`Navigating to: ${car.url}`);
            await page.goto(car.url)
            await delay(2000);

            // Extract the place of loss.
            const placeOfLoss = await page.evaluate(() => {
                return document.querySelector('.box-body p:nth-of-type(3)')?.textContent.trim() ?? "non";
            });

            // Extract the cause of loss.
            const causeOfLoss = await page.evaluate(() => {
                return document.querySelector('.box-body p:nth-of-type(4)')?.textContent.trim() ?? "non";
            });

            // Extract the general description.
            const generalDescription = await page.evaluate(() => {
                return document.querySelector('.box-body p:nth-of-type(1)')?.textContent.trim() ?? "non";
            });

            // Extract the phone number.
            const phoneNumber = await page.evaluate(() => {
                return document.querySelector('.box-body ul li:last-child')?.textContent.trim() ?? "non";
            });


            // Extract the full name.
            const fullName = await page.evaluate(() => {
                return document.querySelector('.box-body ul li:first-child')?.textContent.trim() ?? "non";
            });
            let newData = {
                name: fullName,
                phone: phoneNumber,
                description: generalDescription,
                cause_of_loss: causeOfLoss,
                place_of_loss: placeOfLoss
            }
            console.log(newData)
            pushDataToMyObject(car.id, newData, carData)
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

    fs.writeFile("./cars.json", JSON.stringify(myArray), function (err) {
        if (err) {
            return console.log(err);
        }
    });
}
