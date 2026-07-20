import { MongoClient, type Db, type MongoClientOptions } from "mongodb";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "inspiratech";

if (!uri) {
  throw new Error(
    "Falta la variable MONGODB_URI. Revisa tu archivo .env.local o las variables de entorno en Vercel."
  );
}

// Pensado para serverless (Vercel): pool pequeño por instancia y timeouts
// cortos para que un problema de conexión FALLE RÁPIDO en vez de dejar la
// página colgada esperando a Mongo.
const options: MongoClientOptions = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 8000,
  connectTimeoutMS: 8000,
};

// Reutilizamos la MISMA promesa de conexión entre invocaciones, tanto en
// desarrollo (sobrevive al hot-reload) como en producción (una lambda
// "caliente" de Vercel conserva el módulo, así no abrimos un cliente nuevo en
// cada request). Cachearla en global evita fugas de conexiones hacia Atlas.
let clientPromise: Promise<MongoClient>;

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

if (!global._mongoClientPromise) {
  global._mongoClientPromise = new MongoClient(uri, options).connect();
}
clientPromise = global._mongoClientPromise;

export default clientPromise;

export async function getDb(): Promise<Db> {
  const client = await clientPromise;
  return client.db(dbName);
}
