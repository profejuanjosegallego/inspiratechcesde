// Escritor de ZIP mínimo, sin dependencias y en streaming.
//
// Usa el método "store" (sin comprimir): los PDF ya vienen comprimidos, así
// que comprimir otra vez apenas ahorra espacio y sí gasta CPU. Cada archivo se
// emite apenas se lee, así la respuesta no tiene que caber entera en memoria
// (y no choca con el límite de tamaño de respuesta de Vercel).

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(data: Uint8Array) {
  let c = 0xffffffff;
  for (let i = 0; i < data.length; i++) c = CRC_TABLE[(c ^ data[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

// Fecha/hora en formato MS-DOS, que es lo que guarda el ZIP.
function dosDateTime(d: Date) {
  const time = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1);
  const date = ((Math.max(d.getFullYear(), 1980) - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
  return { time, date };
}

export interface ZipEntry {
  name: string; // ruta dentro del ZIP, ej. "Ana Pérez/Curso de Python.pdf"
  date?: Date;
  read: () => Promise<Uint8Array>; // se llama justo antes de escribir el archivo
}

/** Arma un ZIP en streaming con las entradas dadas. */
export function zipStream(entries: ZipEntry[]): ReadableStream<Uint8Array> {
  const enc = new TextEncoder();
  const central: Uint8Array[] = [];
  let offset = 0;
  let i = 0;
  let count = 0;

  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      while (i < entries.length) {
        const entry = entries[i++];
        let data: Uint8Array;
        try {
          data = await entry.read();
        } catch (e) {
          // Si un archivo falla (p. ej. ya no existe en GridFS) lo saltamos
          // para no dañar todo el ZIP.
          console.error("zip: no se pudo leer", entry.name, e);
          continue;
        }
        const name = enc.encode(entry.name);
        const crc = crc32(data);
        const { time, date } = dosDateTime(entry.date ?? new Date());

        // Encabezado local
        const local = new DataView(new ArrayBuffer(30));
        local.setUint32(0, 0x04034b50, true);
        local.setUint16(4, 20, true); // versión necesaria
        local.setUint16(6, 0x0800, true); // bit 11: nombres en UTF-8 (tildes, ñ)
        local.setUint16(8, 0, true); // método: store
        local.setUint16(10, time, true);
        local.setUint16(12, date, true);
        local.setUint32(14, crc, true);
        local.setUint32(18, data.length, true);
        local.setUint32(22, data.length, true);
        local.setUint16(26, name.length, true);
        local.setUint16(28, 0, true);

        // Entrada del directorio central (se escribe al final)
        const cd = new DataView(new ArrayBuffer(46));
        cd.setUint32(0, 0x02014b50, true);
        cd.setUint16(4, 20, true);
        cd.setUint16(6, 20, true);
        cd.setUint16(8, 0x0800, true);
        cd.setUint16(10, 0, true);
        cd.setUint16(12, time, true);
        cd.setUint16(14, date, true);
        cd.setUint32(16, crc, true);
        cd.setUint32(20, data.length, true);
        cd.setUint32(24, data.length, true);
        cd.setUint16(28, name.length, true);
        cd.setUint32(42, offset, true); // dónde empieza el encabezado local
        central.push(new Uint8Array(cd.buffer), name);

        controller.enqueue(new Uint8Array(local.buffer));
        controller.enqueue(name);
        controller.enqueue(data);
        offset += 30 + name.length + data.length;
        count++;
        return;
      }

      // Directorio central + registro de fin
      let cdSize = 0;
      for (const part of central) {
        controller.enqueue(part);
        cdSize += part.length;
      }
      const end = new DataView(new ArrayBuffer(22));
      end.setUint32(0, 0x06054b50, true);
      end.setUint16(8, count, true);
      end.setUint16(10, count, true);
      end.setUint32(12, cdSize, true);
      end.setUint32(16, offset, true);
      controller.enqueue(new Uint8Array(end.buffer));
      controller.close();
    },
  });
}
