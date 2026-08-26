import { MongoClient } from "mongodb";
import { readFileSync } from "node:fs";
import bcrypt from "bcryptjs";
const env = Object.fromEntries(readFileSync(".env.local","utf8").split(/\r?\n/).filter(l=>l.includes("=")&&!l.startsWith("#")).map(l=>[l.slice(0,l.indexOf("=")),l.slice(l.indexOf("=")+1).trim()]));
const c = new MongoClient(env.MONGODB_URI); await c.connect();
const db = c.db();
const u = await db.collection("users").findOne({ name: /matias/i });
if (!u) { console.log("NO ENCONTRADO"); process.exit(1); }
await db.collection("users").updateOne(
  { _id: u._id },
  { $set: { passwordHash: await bcrypt.hash("matias1234", 10), verified: true } }
);
console.log(JSON.stringify({ name: u.name, email: u.email, verified: u.verified, nuevaClave: "matias1234" }, null, 2));
await c.close();
