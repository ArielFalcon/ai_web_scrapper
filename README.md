
# AI Web Scraper

AI Web Scraper is a project that combines web scraping with advanced content analysis. It leverages Selenium for scraping and Groq for analyzing extracted content. This tool can scrape and analyze content from any given website, providing structured insights in JSON format.

## Features

- **Web Scraping**: Extracts title and content from a webpage.
- **Content Analysis**: Provides structured insights like themes, summaries, and actionable recommendations.
- **Headless Browsing**: Optimized for efficiency using headless Chrome.

## Installation

1. Clone this repository:
   ```bash
   git clone https://github.com/ArielFalcon/ai_web_scrapper.git
   ```

2. Navigate to the project directory:
   ```bash
   cd ai_web_scrapper
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Create a `.env` file in the root directory and add your API key for Groq:
   ```env
   GROQ_API_KEY=your_api_key_here
   ```

## Usage

Run the scraper with a target URL:
```bash
node app.js <target_url>
```

For example:
```bash
node app.js https://example.com
```

## Outputs

The results are saved as a JSON file named `scraped-and-analyzed-content.json` in the root directory.

## Prerequisites

- Node.js (v16 or later)
- Chrome browser

## Notes

- The `.env` file is not included in this repository for security reasons. You must create it manually and add your API key.

## License

This project is licensed under the MIT License.
