import { ApifyClient } from "apify-client";
import fs from "node:fs/promises";
import path from "node:path";
import dotenv, { config } from "dotenv";

dotenv.config();

const apify = new ApifyClient({
  token: process.env.APIFY_TOKEN!,
});

async function fetchAndBackup() {
  const backupDir = path.join(__dirname, "../../backups");

  try {
    // Create backups directory if it doesn't exist
    await fs.mkdir(backupDir, { recursive: true });
    console.log("Backup directory ready.");


      const run = await apify.actor("curious_coder/linkedin-jobs-scraper").call({
        urls:["https://www.linkedin.com/jobs/search/?position=1&pageNum=0"],
        scrapeCompany: true,
        count: 1000,
        splitByLocation: false,
      });


      const { items } = await apify.dataset(run.defaultDatasetId).listItems();

      // Create a filename like "software_engineer.json"
    
      const fileName = `jobDump.json`;
      const filePath = path.join(backupDir, fileName);

      await fs.writeFile(filePath, JSON.stringify(items, null, 2));
      console.log(`Saved ${items.length} jobs to ${filePath}`);
    // }

    console.log("\nAll categories backed up.");
  } catch (error) {
    console.error("Backup failed:", error);
  }
}

fetchAndBackup();