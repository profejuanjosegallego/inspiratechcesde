import { MongoClient } from "mongodb";
import { readFileSync } from "node:fs";
const env = Object.fromEntries(readFileSync(".env.local","utf8").split(/\r?\n/).filter(l=>l.includes("=")&&!l.startsWith("#")).map(l=>[l.slice(0,l.indexOf("=")),l.slice(l.indexOf("=")+1).trim()]));
const c = new MongoClient(env.MONGODB_URI); await c.connect();
const us = await c.db().collection("users").find({ role: "estudiante" }).toArray();
console.log("estudiantes:", us.length);
for (const u of us) {
  const n = (u.name||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
  if (n.includes("mat")) console.log("MATCH →", JSON.stringify({ id: u._id.toString(), name: u.name, email: u.email, verified: u.verified }));
}
await c.close();
