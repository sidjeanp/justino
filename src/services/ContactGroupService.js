// src/services/ContactGroupService.js

const { saveParticipantToDatabase, saveGroupToDatabase } = require('../database/db');
const logger = require('../../utils/logger');

class ContactGroupService {
  static async syncContactsAndGroups(sock) {
    try {
      
      // Sincroniza contatos
      const contacts = await sock.contacts;

      if (!contacts || Object.keys(contacts).length === 0) {
        logger.warn('Nenhum contato encontrado para sincronização.');
      } else {

        let participant = {
          customer_id: jid,
          participant_id: jid,
          name: contact.name || jid.split('@')[0],
          allow_ai_interaction: true, // Define se a IA pode interagir com o participante
          // group_id: remoteJid,
        };

        for (const [jid, contact] of Object.entries(contacts)) {
          await saveParticipantToDatabase(participant);

        }

        logger.info('Contatos sincronizados com sucesso.');
      }

      // Sincroniza grupos
      const groups = await sock.groupFetchAllParticipating();

      if (!groups || Object.keys(groups).length === 0) {
        logger.warn('Nenhum grupo encontrado para sincronização.');
      } else {
        for (const [groupJid, groupMetadata] of Object.entries(groups)) {
          await saveGroupToDatabase({
            group_id: groupJid,
            name: groupMetadata.subject,
            allow_ai_interaction: true,
            summary: `Grupo identificado como ${groupMetadata.subject}.`,
          });
        }
        logger.info('Grupos sincronizados com sucesso.');
      }

    } catch (error) {
      logger.error(`Erro ao sincronizar contatos e grupos: ${error.message}`);
      throw error; // Propaga o erro para tratamento externo
    }
  }
}

module.exports = ContactGroupService;