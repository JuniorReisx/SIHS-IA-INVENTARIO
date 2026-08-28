# GIL · Assistente do Portal da Água (SIHS/BA)

Backend do assistente virtual **Kaio**, usado no Portal da Água da Secretaria de Infraestrutura Hídrica e Saneamento da Bahia.

O Kaio explica o portal, os recortes territoriais e os temas de água, saneamento e infraestrutura hídrica. Os números oficiais continuam nas telas do Experience Builder.

---

## O que ele cobre

- Portal da Água: início, infraestrutura hídrica, abastecimento, esgotamento, Atlas e Sobre
- Recortes: Estado, Território de Identidade, Região Semiárida e município (417 municípios)
- Fontes: Censo IBGE 2022, SIDRA 6803 e 6805, setores censitários, web maps de ativos da SIHS

Modelo: `openai/gpt-oss-120b` via [Groq](https://groq.com) (substituto do `llama-3.3-70b-versatile`, desligado em 16/08/2026).

---

## Variáveis de ambiente

Crie um arquivo `.env` na raiz desta pasta:

```env
PORT=3002
GROQ_API_KEY=sua_chave_api_aqui
GROQ_MODEL=openai/gpt-oss-120b
```

Gere a chave em [console.groq.com/keys](https://console.groq.com/keys).

A porta 3002 evita conflito com o Experience Builder (no seu caso, `https://localhost:3001/builder`).

---

## Como executar localmente

```bash
cd PID-Assistant-API---BACKEND
npm install
npm run dev
```

API: `http://localhost:3002`

No widget do portal, use:

```text
http://localhost:3002/api/chat
```

---

## Endpoint

### POST `/api/chat`

Requisição:

```json
{
  "message": "Como filtro a região semiárida no portal?"
}
```

Resposta:

```json
{
  "response": "No Início, abra o indicador Região Semiárida e aplique o filtro. O mapa e o painel Bahia em números passam a mostrar só esse recorte."
}
```

---

## Prompt

O comportamento do Kaio está em `src/services/geminiService.js` (`SYSTEM_PROMPT`). Ele responde em português, sem markdown, e não inventa estatísticas municipais.

---

## Autor

Adaptado a partir da PID Assistant API para o contexto do Portal da Água / SIHS Bahia.
