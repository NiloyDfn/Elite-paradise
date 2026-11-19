// Load (or top up) the sample catalogue:  npm run seed
import "dotenv/config";
import { connectDb, disconnectDb } from "../server/_core/db";
import { initModels } from "../server/models/init";
import { runSeed } from "../server/seed";

await connectDb();
await initModels();
const added = await runSeed();
console.log(`Done. ${added} new sample products added (existing ones left untouched).`);
await disconnectDb();
