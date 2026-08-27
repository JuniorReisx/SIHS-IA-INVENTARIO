import { generateResponse } from "../services/geminiService.js";

export async function sendMessage(req, res) {
  try {
    const { message } = req.body;
    console.log("Body recebido:", req.body);

    if (!message || typeof message !== "string" || message.trim() === "") {
      return res.status(400).json({ error: "A mensagem é obrigatória." });
    }

    const response = await generateResponse(message.trim());

    return res.status(200).json({ response });
  } catch (error) {
    console.error("Erro ao gerar resposta:", error.message);

    return res.status(500).json({ error: error.message });
  }
}
