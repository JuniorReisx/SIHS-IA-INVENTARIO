const LAYERS = {
  reservatorios: {
    id: "reservatorios",
    label: "reservatórios / barragens",
    url: "https://maps.sihs.ba.gov.br/server/rest/services/Reservatorios_SNISB_2026/FeatureServer/0",
    municipalityFields: ["municipio"],
    nameFields: ["barragem", "n_secund"],
    extraFields: ["uso_princ", "empreendedor", "capacidade_t", "dominio"],
    keywords: ["barragem", "barragens", "reservatorio", "reservatorios", "represa", "represas"]
  },
  pocos: {
    id: "pocos",
    label: "poços",
    url: "https://maps.sihs.ba.gov.br/server/rest/services/Hosted/Poços_Tratado/FeatureServer/0",
    municipalityFields: ["nm_mun", "municipio", "municipio_oficial"],
    nameFields: ["localidade", "localizacao", "codigo"],
    extraFields: ["aquifero"],
    keywords: ["poco", "pocos", "poco tubular"]
  },
  sistemas: {
    id: "sistemas",
    label: "sistemas de abastecimento",
    url: "https://maps.sihs.ba.gov.br/server/rest/services/Hosted/SistemasdeAbastecimento_Tratado/FeatureServer/0",
    municipalityFields: ["nm_mun", "municipio_oficial", "municipio"],
    nameFields: ["localidade", "codigo", "tipo_sistema"],
    extraFields: ["tipo_sistema", "captacao"],
    keywords: ["sistema", "sistemas", "saa", "abastecimento"]
  }
};

function normalize (value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function escapeSql (value) {
  return String(value || "").replace(/'/g, "''");
}

function tokens (text) {
  return normalize(text).split(/[^a-z0-9]+/).filter((token) => token.length >= 3);
}

function looksLike (token, keyword) {
  if (!token || !keyword) return false;
  if (token === keyword || token.includes(keyword) || keyword.includes(token)) return true;
  if (token.length >= 4 && keyword.startsWith(token.slice(0, 4))) return true;
  if (keyword.length >= 4 && token.startsWith(keyword.slice(0, 4))) return true;
  return false;
}

function detectLayer (text) {
  const words = tokens(text);
  return Object.values(LAYERS).find((layer) =>
    layer.keywords.some((word) => words.some((token) => looksLike(token, word)))
  ) || null;
}

function detectMunicipality (text) {
  const cleaned = String(text || "")
    .replace(/[?!.,;]+$/g, "")
    .trim();
  const n = normalize(cleaned);

  const patterns = [
    /(?:no\s+munic[ií]pio\s+de|munic[ií]pio\s+de)\s+(.+)$/i,
    /(?:quantas?|quntas?|quais|qual).*(?:\bem\b|\bno\b|\bna\b|\bde\b)\s+(.+)$/i,
    /(?:tem(?:\s+e|\s+em)|\bem\b|\bno\b|\bna\b)\s+(.+)$/i,
    /(?:de)\s+([A-ZÁÉÍÓÚÂÊÔÃÕ][\p{L}'\s]+)$/iu
  ];

  for (const pattern of patterns) {
    const match = cleaned.match(pattern);
    const place = String(match?.[1] || "")
      .replace(/\b(bahia|ba)\b/gi, "")
      .replace(/\s+/g, " ")
      .trim();
    if (place.length >= 3) return place;
  }

  const known = ["salvador", "feira de santana", "vitoria da conquista", "camacari", "itabuna", "juazeiro", "lauro de freitas", "ilheus", "jequie", "alagoinhas"];
  const hit = known.find((name) => n.includes(name));
  return hit || null;
}

const fieldCache = new Map();

async function layerFieldNames (url) {
  if (fieldCache.has(url)) return fieldCache.get(url);
  const meta = await fetch(`${url}?f=json`).then((res) => res.json());
  const names = new Set((meta.fields || []).map((field) => String(field.name || "")));
  fieldCache.set(url, names);
  return names;
}

function existingFields (available, candidates) {
  return candidates.filter((name) => available.has(name));
}

function municipalityWhere (fields, municipality) {
  const value = escapeSql(municipality.toUpperCase());
  if (!fields.length) return "1=0";
  return fields
    .map((field) => `UPPER(${field}) LIKE '%${value}%'`)
    .join(" OR ");
}

function queryErrorMessage (payload) {
  const err = payload?.error;
  if (!err) return "";
  const details = Array.isArray(err.details) ? err.details.join(" ") : "";
  return [err.message, details].filter(Boolean).join(" — ");
}

async function queryLayer (layer, municipality, limit = 40) {
  const available = await layerFieldNames(layer.url);
  const munFields = existingFields(available, layer.municipalityFields);
  const nameFields = existingFields(available, layer.nameFields);
  const extraFields = existingFields(available, layer.extraFields);
  const where = municipalityWhere(munFields, municipality);
  const outFields = [...new Set([...nameFields, ...munFields, ...extraFields])].join(",") || "*";

  const params = new URLSearchParams({
    where,
    outFields,
    returnGeometry: "false",
    resultRecordCount: String(limit),
    f: "json"
  });

  const countParams = new URLSearchParams({
    where,
    returnCountOnly: "true",
    f: "json"
  });

  const [listRes, countRes] = await Promise.all([
    fetch(`${layer.url}/query?${params}`),
    fetch(`${layer.url}/query?${countParams}`)
  ]);

  const listJson = await listRes.json();
  const countJson = await countRes.json();
  const listError = queryErrorMessage(listJson);
  if (listError) throw new Error(listError);

  const features = listJson.features || [];
  const items = features.map((feature) => {
    const attrs = feature.attributes || {};
    const nome = (nameFields.length ? nameFields : Object.keys(attrs))
      .map((field) => attrs[field])
      .find((value) => value != null && String(value).trim()) || "Sem nome";
    const municipioNome = munFields
      .map((field) => attrs[field])
      .find((value) => value != null && String(value).trim()) || municipality;
    const extras = {};
    for (const field of extraFields) {
      if (attrs[field] != null && String(attrs[field]).trim() !== "") {
        extras[field] = attrs[field];
      }
    }
    return { nome: String(nome).trim(), municipio: String(municipioNome).trim(), ...extras };
  });

  const total = Number.isFinite(Number(countJson.count))
    ? Number(countJson.count)
    : items.length;

  return {
    tipo: layer.id,
    label: layer.label,
    municipio,
    total,
    mostrados: items.length,
    itens: items
  };
}

export function detectWebmapQuestion (message) {
  const layer = detectLayer(message);
  const municipality = detectMunicipality(message);
  if (!layer || !municipality) {
    console.log(`[webmap] sem consulta — camada=${layer?.id || "não"} municipio=${municipality || "não"} texto="${message}"`);
    return null;
  }
  return { layer, municipality };
}

export async function consultarWebmap (message) {
  const detected = detectWebmapQuestion(message);
  if (!detected) return null;

  try {
    const result = await queryLayer(detected.layer, detected.municipality);
    console.log(`[webmap] ${detected.layer.id} em ${detected.municipality}: ${result.total} registro(s)`);
    return result;
  } catch (error) {
    console.warn("[webmap] consulta falhou:", error.message);
    return {
      tipo: detected.layer.id,
      label: detected.layer.label,
      municipio: detected.municipality,
      erro: error.message,
      total: 0,
      mostrados: 0,
      itens: []
    };
  }
}

export function formatWebmapContext (result) {
  if (!result) return "";
  if (result.erro) {
    return `CONSULTA AO WEB MAP FALHOU (${result.label} em ${result.municipio}): ${result.erro}`;
  }

  const linhas = result.itens.map((item, index) => {
    const extra = Object.entries(item)
      .filter(([key]) => key !== "nome" && key !== "municipio")
      .map(([key, value]) => `${key}: ${value}`)
      .join(", ");
    return `${index + 1}. ${item.nome} (${item.municipio})${extra ? ` — ${extra}` : ""}`;
  });

  const corte = result.total > result.mostrados
    ? ` Foram listados ${result.mostrados} de ${result.total}.`
    : "";

  return [
    `DADOS CONSULTADOS NO WEB MAP AGORA (camada de ${result.label}, município ${result.municipio}).`,
    `Total encontrado: ${result.total}.${corte}`,
    result.itens.length ? linhas.join("\n") : "Nenhum registro encontrado nessa camada para esse município.",
    "Responda começando pelo total encontrado. Liste os nomes. Não invente nomes. Diga que a fonte é o inventário do Portal da Água / SIHS."
  ].join("\n");
}
