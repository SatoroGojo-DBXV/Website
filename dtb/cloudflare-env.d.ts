declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    DTB_OWNER_EMAIL?: string;
    DTB_OWNER_PATH_KEY?: string;
    DTB_OWNER_CODE?: string;
    BUCKET?: R2Bucket;
  }
}
