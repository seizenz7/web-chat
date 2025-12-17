/**
 * Message Status Seeder
 * 
 * Creates demo message status events for tracking delivery states.
 * Simulates realistic read/delivery patterns for demo users.
 */

import { sequelize } from './database.js';
import { MessageStatus } from '../models/MessageStatus.js';

export const MessageStatusSeeder = async (users, messages) => {
  try {
    console.log('  Creating message statuses...');

    const createdStatuses = [];
    let statusId = 0;

    for (const message of messages) {
      // Find all participants in this conversation
      // (In real app, we'd query this. For demo, we'll simulate)
      const conversationId = message.conversation_id;
      
      // Simulate getting conversation participants based on conversation ID
      // This is simplified for demo purposes
      const participantMap = {
        '850e8400-e29b-41d4-a716-446655440000': [0, 1], // Alice-Bob DM
        '850e8400-e29b-41d4-a716-446655440001': [1, 2], // Bob-Charlie DM
        '850e8400-e29b-41d4-a716-446655440002': [3, 7], // Diana-Helen DM
        '850e8400-e29b-41d4-a716-446655440010': [0, 1, 2, 5, 6, 7], // Coffee Enthusiasts
        '850e8400-e29b-41d4-a716-446655440011': [2, 3, 4, 6, 7], // Book Club
        '850e8400-e29b-41d4-a716-446655440012': [1, 0, 5, 6], // Project Team Alpha
        '850e8400-e29b-41d4-a716-446655440013': [5, 0, 3, 7], // Weekend Adventures
        '850e8400-e29b-41d4-a716-446655440014': [6, 1, 5], // Code Review Circle
      };

      const participantIndices = participantMap[conversationId] || [];
      
      for (const participantIndex of participantIndices) {
        const participant = users[participantIndex];
        
        // Skip if participant is the sender
        if (participant.id === message.sender_id) {
          // Sender automatically has "sent" status
          const sentStatus = await MessageStatus.create({
            message_id: message.id,
            user_id: participant.id,
            status: 'sent',
            delivered_at: new Date(message.created_at.getTime() + 5000), // 5 seconds later
            read_at: message.created_at.getTime() < Date.now() - 300000 ? 
                     new Date(message.created_at.getTime() + 300000) : null, // Read if older than 5 minutes
            created_at: message.created_at,
            updated_at: message.created_at,
          });
          createdStatuses.push(sentStatus);
          continue;
        }

        // Simulate realistic delivery patterns
        const timeSinceMessage = Date.now() - message.created_at.getTime();
        let status = 'sent';
        let deliveredAt = null;
        let readAt = null;

        if (timeSinceMessage > 10000) { // More than 10 seconds old
          status = 'delivered';
          deliveredAt = new Date(message.created_at.getTime() + Math.random() * 30000); // Within 30 seconds

          // Simulate read status for older messages (70% chance)
          if (timeSinceMessage > 300000 && Math.random() > 0.3) { // Older than 5 minutes
            status = 'read';
            readAt = new Date(deliveredAt.getTime() + Math.random() * 600000); // Read within 10 minutes of delivery
          }
        }

        // Add some reactions for variety (10% chance)
        let reaction = null;
        if (Math.random() < 0.1 && status !== 'failed') {
          const reactions = ['👍', '❤️', '😂', '😮', '😢', '😡'];
          reaction = reactions[Math.floor(Math.random() * reactions.length)];
          status = 'reacted';
        }

        const messageStatus = await MessageStatus.create({
          message_id: message.id,
          user_id: participant.id,
          status: status,
          reaction: reaction,
          delivered_at: deliveredAt,
          read_at: readAt,
          created_at: message.created_at,
          updated_at: new Date(),
        });

        createdStatuses.push(messageStatus);
      }
    }

    console.log(`  ✅ Created ${createdStatuses.length} message status events`);
    return createdStatuses;

  } catch (error) {
    console.error('  ❌ Message status seeding failed:', error);
    throw error;
  }
};

export default MessageStatusSeeder;