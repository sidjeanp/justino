const { Schema, model } = require("mongoose");

const AudioTempSchema = new Schema({
  audioMessageId: { type: String, required: true, unique: true }, // ID único da mensagem de áudio
  sender: { type: String, required: true }, // ID do remetente (e.g., 5511987654321@s.whatsapp.net)
  timestamp: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ["pending", "transcribed", "failed"],
    default: "pending",
  },
  transcription: { type: String, default: null }, // Será preenchido quando a transcrição for recebida
  filePath: { type: String, required: true }, // Caminho completo do arquivo de áudio
});

module.exports = model("AudioTemp", AudioTempSchema);
