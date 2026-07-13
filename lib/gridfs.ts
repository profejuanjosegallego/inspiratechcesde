import { GridFSBucket } from "mongodb";
import { getDb } from "./mongodb";

export async function getBucket() {
  const db = await getDb();
  return new GridFSBucket(db, { bucketName: "certificates" });
}
