/**
 * Attachment Seeder
 * 
 * Creates demo file attachments for messages.
 * Simulates various file types like images, documents, etc.
 */

import { sequelize } from './database.js';
import { Attachment } from '../models/Attachment.js';

export const AttachmentSeeder = async (messages) => {
  try {
    console.log('  Creating attachments...');

    const demoAttachments = [
      // Image attachments
      {
        messageIndex: 0, // Alice's first message to Bob
        file_name: 'coffee-shop-exterior.jpg',
        file_path: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&h=600&fit=crop',
        file_size: 245760, // ~240KB
        mime_type: 'image/jpeg',
        file_hash: 'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef12',
        thumbnail_path: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=200&h=150&fit=crop',
        is_encrypted: true,
      },
      {
        messageIndex: 5, // Bob's message in Coffee Enthusiasts
        file_name: 'ethiopian-coffee-beans.jpg',
        file_path: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=800&h=600&fit=crop',
        file_size: 312580, // ~305KB
        mime_type: 'image/jpeg',
        file_hash: 'b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef1234',
        thumbnail_path: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=200&h=150&fit=crop',
        is_encrypted: true,
      },
      {
        messageIndex: 18, // Charlie's question in Coffee Enthusiasts
        file_name: 'coffee-temperature-guide.pdf',
        file_path: 'https://example.com/docs/coffee-temperature-guide.pdf',
        file_size: 1048576, // 1MB
        mime_type: 'application/pdf',
        file_hash: 'c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456',
        thumbnail_path: null,
        is_encrypted: true,
      },
      {
        messageIndex: 25, // Alice's book discussion in Book Club
        file_name: 'book-club-reading-list.pdf',
        file_path: 'https://example.com/docs/reading-list-2024.pdf',
        file_size: 524288, // 512KB
        mime_type: 'application/pdf',
        file_hash: 'd4e5f6789012345678901234567890abcdef1234567890abcdef1234567',
        thumbnail_path: null,
        is_encrypted: true,
      },
      {
        messageIndex: 35, // Frida's hiking photo
        file_name: 'mountain-trail-sunset.jpg',
        file_path: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
        file_size: 445644, // ~435KB
        mime_type: 'image/jpeg',
        file_hash: 'e5f6789012345678901234567890abcdef1234567890abcdef12345678',
        thumbnail_path: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200&h=150&fit=crop',
        is_encrypted: true,
      },
      {
        messageIndex: 40, // George's API documentation
        file_name: 'api-endpoints-spec.yaml',
        file_path: 'https://example.com/docs/api-spec-v2.yaml',
        file_size: 32768, // 32KB
        mime_type: 'application/x-yaml',
        file_hash: 'f6789012345678901234567890abcdef1234567890abcdef1234567890',
        thumbnail_path: null,
        is_encrypted: true,
      },

      // Voice message simulation
      {
        messageIndex: 8, // Diana's voice message
        file_name: 'voice-message-001.m4a',
        file_path: 'https://example.com/audio/voice-message-001.m4a',
        file_size: 196608, // ~192KB for ~30 second message
        mime_type: 'audio/mpeg',
        file_hash: '6789012345678901234567890abcdef1234567890abcdef123456789012',
        thumbnail_path: null,
        is_encrypted: true,
      },
      {
        messageIndex: 28, // Helen's voice message
        file_name: 'voice-message-002.m4a',
        file_path: 'https://example.com/audio/voice-message-002.m4a',
        file_size: 262144, // ~256KB for ~40 second message
        mime_type: 'audio/mpeg',
        file_hash: '789012345678901234567890abcdef1234567890abcdef1234567890123',
        thumbnail_path: null,
        is_encrypted: true,
      },

      // Document attachments
      {
        messageIndex: 15, // Bob's meeting notes
        file_name: 'meeting-notes-sprint-12.docx',
        file_path: 'https://example.com/docs/meeting-notes-sprint-12.docx',
        file_size: 157286, // ~153KB
        mime_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        file_hash: '89012345678901234567890abcdef1234567890abcdef12345678901234',
        thumbnail_path: null,
        is_encrypted: true,
      },
      {
        messageIndex: 38, // Diana's first aid checklist
        file_name: 'hiking-first-aid-checklist.pdf',
        file_path: 'https://example.com/docs/first-aid-checklist.pdf',
        file_size: 131072, // 128KB
        mime_type: 'application/pdf',
        file_hash: '9012345678901234567890abcdef1234567890abcdef123456789012345',
        thumbnail_path: null,
        is_encrypted: true,
      },
    ];

    const createdAttachments = [];

    for (const attachmentData of demoAttachments) {
      const message = messages[attachmentData.messageIndex];
      
      if (message) {
        const attachment = await Attachment.create({
          message_id: message.id,
          file_name: attachmentData.file_name,
          file_path: attachmentData.file_path,
          file_size: attachmentData.file_size,
          mime_type: attachmentData.mime_type,
          file_hash: attachmentData.file_hash,
          thumbnail_path: attachmentData.thumbnail_path,
          is_encrypted: attachmentData.is_encrypted,
          created_at: new Date(),
          updated_at: new Date(),
        });

        createdAttachments.push(attachment);
      }
    }

    console.log(`  ✅ Created ${createdAttachments.length} attachments`);
    return createdAttachments;

  } catch (error) {
    console.error('  ❌ Attachment seeding failed:', error);
    throw error;
  }
};

export default AttachmentSeeder;