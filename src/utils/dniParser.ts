/**
 * SERVICIO Y PARSER DE DNI ARGENTINO (CÓDIGO PDF417)
 * 
 * Soporta las versiones oficiales del DNI tarjeta argentino:
 * - Versión moderna (con N° de trámite al inicio):
 *   [0] Trámite @ [1] Apellido @ [2] Nombre @ [3] Sexo @ [4] DNI @ [5] Ejemplar @ [6] F. Nacimiento @ [7] F. Emisión @ [8] CUIL
 * - Versión clásica (sin trámite):
 *   [0] Apellido @ [1] Nombre @ [2] Sexo @ [3] DNI @ [4] Ejemplar @ [5] F. Nacimiento @ [6] F. Emisión
 * - Variantes con comillas, separadores por coma, pipes (|) o tabuladores.
 */

export interface DniParsedResult {
  isValid: boolean;
  raw: string;
  numero_documento: string;        // Ej: "34567890" (sin ceros a la izquierda)
  documento_formateado: string;    // Ej: "34.567.890"
  apellido: string;                // Ej: "González"
  nombre: string;                  // Ej: "Martín Alejandro"
  nombre_completo: string;         // Ej: "Martín Alejandro González"
  sexo?: 'M' | 'F' | 'X';
  sexo_descripcion?: 'Masculino' | 'Femenino' | 'No Binario / Otro';
  fecha_nacimiento?: string;       // Formato ISO estándar YYYY-MM-DD
  fecha_nacimiento_ar?: string;    // Formato argentino DD/MM/YYYY
  fecha_emision?: string;          // Formato ISO estándar YYYY-MM-DD
  numero_tramite?: string;         // Ej: "00123456789"
  ejemplar?: string;               // Ej: "A", "B", "C"
  cuil?: string;                   // Si viene especificado
  error?: string;
}

/**
 * Capitaliza nombres y apellidos respetando preposiciones en español.
 * Ej: "DE LA SERNA" -> "de la Serna" o "PÉREZ GÓMEZ" -> "Pérez Gómez"
 */
export function formatNameToTitleCase(str: string): string {
  if (!str) return '';
  const prepositions = new Set(['de', 'del', 'la', 'las', 'los', 'y', 'van', 'von', 'da', 'di']);
  
  const words = str.trim().toLowerCase().split(/\s+/);
  return words
    .map((word, index) => {
      if (word.length === 0) return '';
      if (index > 0 && prepositions.has(word)) {
        return word;
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

/**
 * Limpia y normaliza el número de DNI removiendo ceros a la izquierda y caracteres no numéricos.
 */
export function cleanDni(dniStr: string): string {
  if (!dniStr) return '';
  const digits = dniStr.replace(/\D/g, '');
  const clean = digits.replace(/^0+/, '');
  return clean || digits;
}

/**
 * Formatea un DNI con puntos de millar estilo argentino (ej: 34567890 -> 34.567.890).
 */
export function formatDni(dniStr: string): string {
  const clean = cleanDni(dniStr);
  if (!clean) return '';
  return clean.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/**
 * Convierte fechas en formato DD/MM/YYYY o DD-MM-YYYY a ISO YYYY-MM-DD.
 */
export function parseDateToISO(dateStr: string): string {
  if (!dateStr) return '';
  const clean = dateStr.trim();
  // Formato DD/MM/YYYY o DD-MM-YYYY
  const parts = clean.split(/[/ -]/);
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      // Ya es YYYY-MM-DD
      return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
    }
    // DD-MM-YYYY -> YYYY-MM-DD
    const day = parts[0].padStart(2, '0');
    const month = parts[1].padStart(2, '0');
    const year = parts[2];
    return `${year}-${month}-${day}`;
  }
  return clean;
}

/**
 * Convierte fecha ISO YYYY-MM-DD a DD/MM/YYYY.
 */
export function parseDateToAR(dateStr: string): string {
  if (!dateStr) return '';
  const clean = dateStr.split('T')[0];
  const parts = clean.split('-');
  if (parts.length === 3) {
    const [y, m, d] = parts;
    return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
  }
  return dateStr;
}

/**
 * Decodifica la ráfaga de datos del código de barras PDF417 del DNI argentino.
 */
export function parseDniPdf417(rawInput: string): DniParsedResult {
  if (!rawInput || typeof rawInput !== 'string') {
    return {
      isValid: false,
      raw: '',
      numero_documento: '',
      documento_formateado: '',
      apellido: '',
      nombre: '',
      nombre_completo: '',
      error: 'Entrada vacía o inválida',
    };
  }

  const raw = rawInput.trim();

  // Detectar delimitador: típicamente '@', o comillas con comas/espacios/pipes
  let delimiter = '@';
  if (raw.includes('@')) {
    delimiter = '@';
  } else if (raw.includes('|')) {
    delimiter = '|';
  } else if (raw.includes('"') && raw.includes(',')) {
    delimiter = ',';
  }

  // Dividir y limpiar comillas circundantes
  const fields = raw
    .split(delimiter)
    .map(f => f.replace(/^["'\s]+|["'\s]+$/g, '').trim());

  if (fields.length < 5) {
    return {
      isValid: false,
      raw,
      numero_documento: '',
      documento_formateado: '',
      apellido: '',
      nombre: '',
      nombre_completo: '',
      error: 'Estructura de campos insuficiente para DNI argentino',
    };
  }

  let numeroTramite = '';
  let apellido = '';
  let nombre = '';
  let sexoRaw = '';
  let dniRaw = '';
  let ejemplar = '';
  let fechaNacRaw = '';
  let fechaEmisionRaw = '';
  let cuilRaw = '';

  // Verificación de formato:
  // Si fields[0] es numérico de 10 u 11 dígitos, es el formato moderno con Número de Trámite
  const isModernFormat = /^\d{9,12}$/.test(fields[0]);

  if (isModernFormat) {
    // Formato moderno: [0] Trámite, [1] Apellido, [2] Nombre, [3] Sexo, [4] DNI, [5] Ejemplar, [6] Nacimiento, [7] Emisión
    numeroTramite = fields[0] || '';
    apellido = fields[1] || '';
    nombre = fields[2] || '';
    sexoRaw = fields[3] || '';
    dniRaw = fields[4] || '';
    ejemplar = fields[5] || '';
    fechaNacRaw = fields[6] || '';
    fechaEmisionRaw = fields[7] || '';
    cuilRaw = fields[8] || '';
  } else {
    // Formato antiguo: [0] Apellido, [1] Nombre, [2] Sexo, [3] DNI, [4] Ejemplar, [5] Nacimiento, [6] Emisión
    apellido = fields[0] || '';
    nombre = fields[1] || '';
    sexoRaw = fields[2] || '';
    dniRaw = fields[3] || '';
    ejemplar = fields[4] || '';
    fechaNacRaw = fields[5] || '';
    fechaEmisionRaw = fields[6] || '';
    cuilRaw = fields[7] || '';
  }

  // Si por alguna variación el DNI o el sexo quedaron desplazados, hacer un fallback heurístico
  if (!/^\d{6,9}$/.test(cleanDni(dniRaw))) {
    for (const f of fields) {
      const clean = cleanDni(f);
      if (/^\d{7,8}$/.test(clean)) {
        dniRaw = f;
        break;
      }
    }
  }

  const cleanDoc = cleanDni(dniRaw);
  const formattedDoc = formatDni(cleanDoc);
  const formattedApellido = formatNameToTitleCase(apellido);
  const formattedNombre = formatNameToTitleCase(nombre);
  const nombreCompleto = `${formattedNombre} ${formattedApellido}`.trim();

  // Mapear sexo
  const cleanSexo = (sexoRaw || '').toUpperCase().trim();
  let sexo: 'M' | 'F' | 'X' | undefined = undefined;
  let sexoDescripcion: 'Masculino' | 'Femenino' | 'No Binario / Otro' | undefined = undefined;

  if (cleanSexo === 'M' || cleanSexo === 'MASCULINO') {
    sexo = 'M';
    sexoDescripcion = 'Masculino';
  } else if (cleanSexo === 'F' || cleanSexo === 'FEMENINO') {
    sexo = 'F';
    sexoDescripcion = 'Femenino';
  } else if (cleanSexo === 'X' || cleanSexo === 'NO BINARIO') {
    sexo = 'X';
    sexoDescripcion = 'No Binario / Otro';
  }

  const fechaNacISO = parseDateToISO(fechaNacRaw);
  const fechaNacAR = parseDateToAR(fechaNacISO || fechaNacRaw);
  const fechaEmisionISO = parseDateToISO(fechaEmisionRaw);

  const isValid = Boolean(cleanDoc && (formattedNombre || formattedApellido));

  return {
    isValid,
    raw,
    numero_documento: cleanDoc,
    documento_formateado: formattedDoc,
    apellido: formattedApellido,
    nombre: formattedNombre,
    nombre_completo: nombreCompleto,
    sexo,
    sexo_descripcion: sexoDescripcion,
    fecha_nacimiento: fechaNacISO,
    fecha_nacimiento_ar: fechaNacAR,
    fecha_emision: fechaEmisionISO,
    numero_tramite: numeroTramite,
    ejemplar: ejemplar.toUpperCase(),
    cuil: cleanDni(cuilRaw) || undefined,
  };
}
