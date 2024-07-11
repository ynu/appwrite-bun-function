import { Client, Databases } from "node-appwrite";
import process from "process";
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.align(),
    winston.format.timestamp({ format: 'YYYY-MM-DD T hh:mm:ss.sss A' }),
    winston.format.printf(({ level, message, timestamp, label }) => {
      return `${level.toUpperCase()} | ${timestamp} | ${message}`;
    })
  ),
  defaultMeta: { service: 'user-service' },
  transports: [
    //
    // - Write all logs with importance level of `error` or less to `error.log`
    // - Write all logs with importance level of `info` or less to `combined.log`
    //
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

//
// If we're not in production then log to the `console` with the format:
// `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
//
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console());
}

const { APPWRITE_ENDPOINT, APPWRITE_FUNCTION_PROJECT_ID, APPWRITE_API_KEY, APPWRITE_DATABASE_ID, APPWRITE_COLLECTION_ID } = process.env;

if (!APPWRITE_ENDPOINT || !APPWRITE_FUNCTION_PROJECT_ID || !APPWRITE_DATABASE_ID || !APPWRITE_COLLECTION_ID) {
  console.info(`appwrite envs not configured!`);
  process.exit(-1);
}

async function list_documents(client: Client, log) {
  const databases = new Databases(client);
  const { total, documents } = await databases.listDocuments(
    APPWRITE_DATABASE_ID!,
    APPWRITE_COLLECTION_ID!
  );
  log(`Found ${total} documents in the collection`);
}

// This is your Appwrite function
// It's executed each time we get a request
export default async ({ req, res, log, error }: { req: REQ_TYPE; res: RES_TYPE; log: LOG_TYPE; error: ERROR_TYPE }) => {

  /**
   * The following console.log maybe async, these log message will print after the log and error the runtime provided.
   */
  // show log message for info, warn, error, log in console
  for(const level of ['debug', 'info', 'warn', 'error', 'log']) {
    console[level](`This is console.${level} message`);
  }
  
  // show log message for winston, see https://github.com/winstonjs/winston?tab=readme-ov-file#using-logging-levels
  const logging_levels = { emerg: 0, alert: 1, crit: 2, error: 3, warning: 4, notice: 5, info: 6, debug: 7 };
  for(const level of Object.keys(logging_levels)) {
    try {
      logger[level](`This is logger.${level} message`);
    } catch (error) {
      console.error(`logger.${level} error with`, error);
    }
  }

  // Why not try the Appwrite SDK?
  //
  const client = new Client()
    .setEndpoint(APPWRITE_ENDPOINT)
    .setProject(APPWRITE_FUNCTION_PROJECT_ID)

  // // setKey is optional if you deploy the function and run it in the Appwrite instance.
  if (process.env.NODE_ENV === 'development') {
    if (!APPWRITE_API_KEY) {
      throw new Error('APPWRITE_API_KEY is required in development mode');
    }
    client.setKey(APPWRITE_API_KEY!);
  }

  await list_documents(client, log);

  // You can log messages to the console
  log(`Bun.version: ${Bun.version}`);

  // If something goes wrong, log an error
  error("Hello, Errors!");

  // The `req` object contains the request data
  if (req.method === "GET") {
    // Send a response with the res object helpers
    // `res.send()` dispatches a string back to the client
    return res.send("Hello, World!");
  }

  // `res.json()` is a handy helper for sending JSON
  return res.json({
    motto: "Build like a team of hundreds_",
    learn: "https://appwrite.io/docs",
    connect: "https://appwrite.io/discord",
    getInspired: "https://builtwith.appwrite.io",
  });
};
