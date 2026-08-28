# Gil · Water Portal Assistant (SIHS/BA)

Backend for the **Gil** virtual assistant, used in the Water Portal of the Bahia Secretariat of Water Infrastructure and Sanitation.

Gil explains the portal, territorial divisions, and topics related to water, sanitation, and water infrastructure. Official figures and statistics remain available on the Experience Builder screens.

---

## What it covers

* Water Portal: Home, Water Infrastructure, Water Supply, Sewage, Atlas, and About
* Territorial divisions: State, Identity Territory, Semi-Arid Region, and municipality (417 municipalities)
* Data sources: IBGE 2022 Census, SIDRA 6803 and 6805, census sectors, and SIHS asset web maps

Model: `openai/gpt-oss-120b` via [Groq](https://groq.com?utm_source=chatgpt.com) (replacing `llama-3.3-70b-versatile`, which was discontinued on 08/16/2026).

---

## Environment Variables

Create a `.env` file in the root of this folder:

```env
PORT=3002
GROQ_API_KEY=your_api_key_here
GROQ_MODEL=openai/gpt-oss-120b
```

Generate your API key at [console.groq.com/keys](https://console.groq.com/keys?utm_source=chatgpt.com).

Port 3002 prevents conflicts with Experience Builder (in your case, `https://localhost:3001/builder`).

---

## How to Run Locally

```bash
cd PID-Assistant-API---BACKEND
npm install
npm run dev
```

API: `http://localhost:3002`

In the portal widget, use:

```text
http://localhost:3002/api/chat
```

---

## Endpoint

### POST `/api/chat`

Request:

```json
{
  "message": "How do I filter the Semi-Arid Region in the portal?"
}
```

Response:

```json
{
  "response": "On the Home page, open the Semi-Arid Region indicator and apply the filter. The map and the Bahia in Numbers panel will then display only this territorial division."
}
```

---

## Prompt

Kaio's behavior is defined in `src/services/geminiService.js` (`SYSTEM_PROMPT`). It responds in Portuguese, without Markdown, and does not make up municipal statistics.

---

## Author

Adapted from the PID Assistant API for the Water Portal / SIHS Bahia context.
