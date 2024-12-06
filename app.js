import { Builder, By, until } from "selenium-webdriver";
import Groq from "groq-sdk";
import dotenv from "dotenv";
import { writeFileSync } from "fs";

dotenv.config();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function scrapeWebsite(url, visitedLinks = new Set(), depth = 0, maxDepth = 2) {
  let driver;
  try {
    driver = await new Builder().forBrowser("chrome").setChromeOptions().build();

    // Configurar el User-Agent
    await driver.executeScript(
      "Object.defineProperty(navigator, 'userAgent', { get: () => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36' })"
    );

    // Navegar a la página
    await driver.get(url);

    // Esperar el DOM
    await driver.wait(until.elementLocated(By.tagName("body")), 10000);

    // Extraer contenido principal
    const scrapedContent = await driver.executeScript(() => {
      return {
        title: document.title,
        body: document.body.innerText.trim(),
        links: Array.from(document.querySelectorAll("a[href]"))
          .map((a) => a.href)
          .filter((href) => href.startsWith("http")), // Filtramos solo URLs absolutas
      };
    });

    console.log(`Scraped: ${url}`);
    if (depth >= maxDepth) return scrapedContent;

    // Analizar con Groq para determinar la relevancia de enlaces
    const relevantLinks = await analyzeLinksWithGroq(scrapedContent.links, url);
    console.log(`Relevant links at depth ${depth}:`, relevantLinks);

    visitedLinks.add(url); // Registrar el enlace actual como visitado

    // Recursivamente explorar los enlaces relevantes
    for (const link of relevantLinks) {
      if (!visitedLinks.has(link)) {
        await scrapeWebsite(link, visitedLinks, depth + 1, maxDepth);
      }
    }

    return scrapedContent;
  } catch (error) {
    console.error("Error en el scraping:", error);
    return null;
  } finally {
    if (driver) {
      await driver.quit();
    }
  }
}

// Función para analizar relevancia de enlaces con Groq
async function analyzeLinksWithGroq(links, parentUrl) {
  try {
    const prompt = `
      I have collected the following links from a page (${parentUrl}):
      ${links.map((link, index) => `- ${index + 1}. ${link}`).join("\n")}

      Your task is to analyze these links and return ONLY a JSON list of the most relevant URLs for further scraping. 
      Do NOT include any additional text or comments. Return ONLY the JSON list, e.g., ["link1", "link2"].
    `;

    const response = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      model: "llama3-8b-8192",
    });

    const responseText = response.choices[0]?.message?.content || "[]";
    let relevantLinks;

    // Extraer solo la parte JSON de la respuesta
    try {
      const jsonStart = responseText.indexOf("[");
      const jsonEnd = responseText.lastIndexOf("]") + 1;
      const jsonString = responseText.slice(jsonStart, jsonEnd);
      relevantLinks = JSON.parse(jsonString);
    } catch (parseError) {
      console.error("Error al parsear la respuesta de Groq:", responseText);
      relevantLinks = [];
    }

    return Array.isArray(relevantLinks) ? relevantLinks : [];
  } catch (error) {
    console.error("Error al analizar los enlaces con Groq:", error);
    return [];
  }
}

// Función principal
async function main(url = "https://minecraft.net/en-us/") {
  const visitedLinks = new Set();
  const result = await scrapeWebsite(url, visitedLinks);
  if (result) {
    writeFileSync("deep-scraped-content.json", JSON.stringify(result, null, 2));
    console.log("Scraping en profundidad completado.");
  } else {
    console.log("No se pudo completar el scraping.");
  }
}

// Obtener la URL desde los argumentos
let urlFromArgs = process.argv[2] || "minecraft.net/en-us";
if (!urlFromArgs.startsWith("http://") && !urlFromArgs.startsWith("https://")) {
  urlFromArgs = "https://" + urlFromArgs;
}

// Ejecutar
main(urlFromArgs).then(() => console.log("Proceso completado."));