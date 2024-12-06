import {Builder, By, until} from 'selenium-webdriver';
import Groq from "groq-sdk";
import dotenv from 'dotenv';

dotenv.config();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function scrapeWebsite(url) {
  let driver;
  try {
    driver = await new Builder().forBrowser('chrome').setChromeOptions().build();

    // Configurar el User-Agent
    await driver.executeScript("Object.defineProperty(navigator, 'userAgent', { get: () => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36' })");

    await driver.get(url);
    // Esperar a que el DOM se cargue
    await driver.wait(until.elementLocated(By.tagName('body')), 10000);

    // Extraer el contenido de la página
    return await driver.executeScript(() => {
      return {
        title: document.title,
        body: document.body.innerText.trim() // Extraemos solo el texto limpio
      };
    });
  } catch (error) {
    console.error('Error en el scraping:', error);
    return null;
  } finally {
    if (driver) {
      await driver.quit();
    }
  }
}

async function analyzeWithGroq(scrapedContent) {
  try {

    const prompt = `
      I have scraped the following content from a website:
      - Title: ${scrapedContent.title}
      - Content: ${scrapedContent.body}

      Your task is to analyze the content and provide a structured response in the form of a JSON object. The response should include the following fixed fields, always:

      {
        "overview": "A concise overview of the page's key points and purpose.",
        "main_themes": ["A list of primary topics or themes discussed in the content."],
        "key_information": ["Important facts, statistics, or highlights mentioned on the page."],
        "audience_target": "Who is the content aimed at (e.g., professionals, general public, enthusiasts, etc.)",
        "content_quality": "Assessment of the content's quality and depth, including whether it provides valuable insights or superficial information."
        "similar_websites": ["List of websites with similar content or focus areas that the audience might also find useful."],
        "improvement_possibilities": ["Suggestions for how the content could be improved in terms of depth, clarity, engagement, or other aspects."],
        "accessibility_issues": ["Any potential accessibility issues that could affect the user experience."]
      }

      Please provide the response exactly in this format, including all fields, even if some of them are empty. Do not add any additional fields or explanations.`;

    return await groq.chat.completions
      .create({
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        model: "llama3-8b-8192",
      })
      .then((chatCompletion) => {
        const response = chatCompletion.choices[0]?.message?.content || "No content returned from Groq.";
        console.log(response);
      });
  } catch (error) {
    console.error('Error al analizar el contenido con Groq:', error);
    return null;
  }
}

async function main(url='https://minecraft.net/en-us/') {
  const scrapedContent = await scrapeWebsite(url);

  if (scrapedContent) {
    await analyzeWithGroq(scrapedContent);
  } else {
    console.log('No se pudo extraer el contenido de la página');
  }
}

let urlFromArgs = process.argv[2] || 'minecraft.net/en-us';
if (!urlFromArgs.startsWith('http://') && !urlFromArgs.startsWith('https://')) {
  urlFromArgs = 'https://' + urlFromArgs;
}

main(urlFromArgs).then(() => console.log('Proceso completado.'));