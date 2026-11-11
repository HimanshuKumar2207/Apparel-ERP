import { createApp } from "./app.js";
import { connectDb } from "./config/db.js";
import "./models/index.js";
import { logger } from "./utils/logger.js";

await connectDb();

const app = createApp();

logger.info("Apparel ERP API initialized");

export default app;
