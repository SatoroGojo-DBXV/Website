declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    DTB_OWNER_EMAIL?: string;
    BUCKET?: R2Bucket;
  }
}
