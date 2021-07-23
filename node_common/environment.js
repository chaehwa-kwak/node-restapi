export const NODE = process.env.NODE_ENV || "development";
export const IS_PRODUCTION = NODE === "production";
export const PORT = process.env.PORT || 8080;
export const SOURCE = process.env.SOURCE;

// NOTE(jim):
// In production we don't use .env and manage secrets another way.
if (!IS_PRODUCTION) {
  require("dotenv").config();
}

export const POSTGRES_ADMIN_PASSWORD = process.env.POSTGRES_ADMIN_PASSWORD;
export const POSTGRES_ADMIN_USERNAME = process.env.POSTGRES_ADMIN_USERNAME;
export const POSTGRES_HOSTNAME = process.env.POSTGRES_HOSTNAME;
export const POSTGRES_DATABASE = process.env.POSTGRES_DATABASE;
export const JWT_SECRET = process.env.JWT_SECRET;
export const TEXTILE_HUB_KEY = process.env.TEXTILE_HUB_KEY;
export const TEXTILE_HUB_SECRET = process.env.TEXTILE_HUB_SECRET;
export const TEXTILE_SLACK_WEBHOOK_KEY = process.env.TEXTILE_SLACK_WEBHOOK_KEY;

export const CONTACT_EMAIL = process.env.CONTACT_EMAIL || "nchime@gmail.com";
export const HOST_ROOT = process.env.HOST_ROOT || "http://localhost:8080/o2/";
export const HOST_DOWNLOAD_ROOT = process.env.HOST_DOWNLOAD_ROOT || "https://localhost/dn/";
export const LOWDB_FILE_PATH = process.env.LOWDB_FILE_PATH || "/node_common/lowdb/lowdb.json";
export const LOWDB_O2PLUS_FILE_PATH = process.env.LOWDB_O2PLUS_FILE_PATH || "/node_common/lowdb/lowdb-o2Plus.json";
export const LOWDB_O2PLUS_LOTUS_PATH = process.env.LOWDB_O2PLUS_LOTUS_PATH || "/node_common/lowdb/lowdb-o2Plus-lotus.json";
export const UPLOAD_BASE_FILE_PATH = process.env.UPLOAD_BASE_FILE_PATH || "/upload-data/o2";
export const UPLOAD_FILE_LIMIT_SIZE = process.env.UPLOAD_FILE_LIMIT_SIZE || 1024*1024*1024*10;
export const GENERATED_APP_URL = process.env.GENERATED_APP_URL || "http://ocalhost:8080/o2/";
export const GENERATE_URL = process.env.GENERATE_URL || "http://ocalhost:8080/_generate";
export const LOTUS_DEAL_PERIOD = process.env.LOTUS_DEAL_PERIOD || "540";
