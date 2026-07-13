import { MongoClient, type Db } from "mongodb";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "inspiratech";

if (!uri) {
  throw new Error(
    "Falta la variable MONGODB_URI. Revisa tu archivo .env.local o las variables de entorno en Vercel."
  );
}

const options = {};

// En serverless (Vercel) reutilizamos la conexión entre invocaciones para no
// abrir un socket nuevo en cada request. En desarrollo usamos una variable
// global para sobrevivir al hot-reload de Next.
let clientPromise: Promise<MongoClient>;

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

if (process.env.NODE_ENV === "development") {
  if (!global._mongoClientPromise) {
    global._mongoClientPromise = new MongoClient(uri, options).connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  clientPromise = new MongoClient(uri, options).connect();
}

export default clientPromise;

export async function getDb(): Promise<Db> {
  const client = await clientPromise;
  return client.db(dbName);
}
