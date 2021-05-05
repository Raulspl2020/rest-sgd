const puppeteer = require("puppeteer");
export const convertTo24Hour = (time: string) => {

    let hours = parseInt(time.substr(0, 2));
    if (time.indexOf('AM') != -1 && hours == 12) {
        time = time.replace('12', '0');
    }
    if (time.indexOf('PM') != -1 && hours < 12) {
        time = time.replace(hours.toString(), (hours + 12).toString());
    }
    return time.replace(/(AM|PM)/, '');
}

export const generarHTMLPDF = async (html: string) => {
    try {
        const browser = await puppeteer.launch({
            args: [
                "--no-sandbox",
                "--headless",
                "--disable-gpu",
                "--disable-setuid-sandbox",
            ],
        });
        const page = await browser.newPage();

        await page.setContent(html);
        const pdf = await page.pdf({
            format: "Letter",
            printBackground: true,
        });
        console.log("Pdf generado");
        await browser.close();

        return pdf;



    } catch (error) {
        throw new Error(error.message);
    }

}