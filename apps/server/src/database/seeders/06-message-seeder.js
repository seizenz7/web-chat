/**
 * Message Seeder
 * 
 * Creates demo messages for each conversation with realistic content.
 * Includes text messages, system messages, and different message types.
 */

import { sequelize } from './database.js';
import { Message } from '../models/Message.js';

// Simulate encrypted content (in real app, this would be base64 encoded encrypted data)
const simulateEncryptedContent = (content) => {
  const encoded = Buffer.from(content, 'utf8').toString('base64');
  return `encrypted_${encoded}`;
};

const demoMessages = [
  // Alice-Bob Direct Messages
  {
    conversationIndex: 0, // Alice-Bob DM
    messages: [
      {
        senderIndex: 0, // Alice
        content: 'Hey Bob! How are you doing today?',
        type: 'text',
        timestamp: new Date(Date.now() - 3600000), // 1 hour ago
      },
      {
        senderIndex: 1, // Bob
        content: 'Hi Alice! I\'m doing great, thanks for asking. How\'s your project going?',
        type: 'text',
        timestamp: new Date(Date.now() - 3500000), // 58 minutes ago
      },
      {
        senderIndex: 0, // Alice
        content: 'It\'s going well! I\'m making good progress on the new feature.',
        type: 'text',
        timestamp: new Date(Date.now() - 3400000), // 56 minutes ago
      },
      {
        senderIndex: 1, // Bob
        content: 'That\'s awesome! Let me know if you need any help.',
        type: 'text',
        timestamp: new Date(Date.now() - 3300000), // 55 minutes ago
      },
      {
        senderIndex: 0, // Alice
        content: 'Thanks! I might take you up on that offer.',
        type: 'text',
        timestamp: new Date(Date.now() - 1800000), // 30 minutes ago
      },
    ],
  },

  // Bob-Charlie Direct Messages
  {
    conversationIndex: 1, // Bob-Charlie DM
    messages: [
      {
        senderIndex: 1, // Bob
        content: 'Charlie, did you finish the code review for the PR?',
        type: 'text',
        timestamp: new Date(Date.now() - 2700000), // 45 minutes ago
      },
      {
        senderIndex: 2, // Charlie
        content: 'Almost done! Just finishing up the final checks.',
        type: 'text',
        timestamp: new Date(Date.now() - 2600000), // 43 minutes ago
      },
      {
        senderIndex: 2, // Charlie
        content: 'Great work on the implementation. Looks solid.',
        type: 'text',
        timestamp: new Date(Date.now() - 2500000), // 41 minutes ago
      },
      {
        senderIndex: 1, // Bob
        content: 'Perfect! I\'ll merge it then.',
        type: 'text',
        timestamp: new Date(Date.now() - 2400000), // 40 minutes ago
      },
      {
        senderIndex: 1, // Bob
        content: 'Thanks for the quick turnaround!',
        type: 'text',
        timestamp: new Date(Date.now() - 900000), // 15 minutes ago
      },
    ],
  },

  // Diana-Helen Direct Messages
  {
    conversationIndex: 2, // Diana-Helen DM
    messages: [
      {
        senderIndex: 3, // Diana
        content: 'Helen, what do you think about organizing a team building event?',
        type: 'text',
        timestamp: new Date(Date.now() - 7200000), // 2 hours ago
      },
      {
        senderIndex: 7, // Helen
        content: 'That\'s a great idea! What kind of event were you thinking?',
        type: 'text',
        timestamp: new Date(Date.now() - 7100000), // 1 hour 58 minutes ago
      },
      {
        senderIndex: 3, // Diana
        content: 'Maybe a hiking trip or a game night? I\'m open to suggestions.',
        type: 'text',
        timestamp: new Date(Date.now() - 7000000), // 1 hour 56 minutes ago
      },
      {
        senderIndex: 7, // Helen
        content: 'I love the hiking idea! The weather should be nice this weekend.',
        type: 'text',
        timestamp: new Date(Date.now() - 6900000), // 1 hour 55 minutes ago
      },
      {
        senderIndex: 3, // Diana
        content: 'Let me send out a poll to see who\'s interested.',
        type: 'text',
        timestamp: new Date(Date.now() - 6800000), // 1 hour 53 minutes ago
      },
      {
        senderIndex: 7, // Helen
        content: 'Perfect! Count me in.',
        type: 'text',
        timestamp: new Date(Date.now() - 3600000), // 1 hour ago
      },
    ],
  },

  // Coffee Enthusiasts Group Chat
  {
    conversationIndex: 3, // Coffee Enthusiasts
    messages: [
      {
        senderIndex: 0, // Alice
        content: 'Good morning coffee lovers! ☕ What\'s everyone drinking today?',
        type: 'text',
        timestamp: new Date(Date.now() - 7200000), // 2 hours ago
      },
      {
        senderIndex: 1, // Bob
        content: 'Just finished my espresso shot! Perfect way to start the day.',
        type: 'text',
        timestamp: new Date(Date.now() - 7100000), // 1 hour 58 minutes ago
      },
      {
        senderIndex: 2, // Charlie
        content: 'I\'m having a cold brew. It\'s been a lifesaver this heat!',
        type: 'text',
        timestamp: new Date(Date.now() - 7000000), // 1 hour 56 minutes ago
      },
      {
        senderIndex: 5, // Frida
        content: 'Found this amazing Ethiopian blend yesterday. The citrus notes are incredible!',
        type: 'text',
        timestamp: new Date(Date.now() - 6900000), // 1 hour 55 minutes ago
      },
      {
        senderIndex: 6, // George
        content: 'That sounds delicious! Where did you get it from?',
        type: 'text',
        timestamp: new Date(Date.now() - 6800000), // 1 hour 53 minutes ago
      },
      {
        senderIndex: 5, // Frida
        content: 'Local roaster downtown. I can bring some tomorrow if anyone wants to try.',
        type: 'text',
        timestamp: new Date(Date.now() - 6700000), // 1 hour 51 minutes ago
      },
      {
        senderIndex: 7, // Helen
        content: 'Yes please! I\'d love to try it.',
        type: 'text',
        timestamp: new Date(Date.now() - 6600000), // 1 hour 50 minutes ago
      },
      {
        senderIndex: 0, // Alice
        content: 'That sounds wonderful! Thanks Frida.',
        type: 'text',
        timestamp: new Date(Date.now() - 6500000), // 1 hour 48 minutes ago
      },
      {
        senderIndex: 2, // Charlie
        content: 'What\'s the ideal water temperature for pour-over coffee?',
        type: 'text',
        timestamp: new Date(Date.now() - 1800000), // 30 minutes ago
      },
      {
        senderIndex: 1, // Bob
        content: 'Generally 195-205°F (90-96°C). Any hotter and you get bitterness.',
        type: 'text',
        timestamp: new Date(Date.now() - 1700000), // 28 minutes ago
      },
      {
        senderIndex: 6, // George
        content: 'Thanks for the tip! I\'ve been experimenting with temperatures.',
        type: 'text',
        timestamp: new Date(Date.now() - 300000), // 5 minutes ago
      },
    ],
  },

  // Book Club Group Chat
  {
    conversationIndex: 4, // Book Club
    messages: [
      {
        senderIndex: 2, // Charlie
        content: 'Welcome to this month\'s book club discussion! 📚',
        type: 'text',
        timestamp: new Date(Date.now() - 86400000), // 1 day ago
      },
      {
        senderIndex: 3, // Diana
        content: 'So what did everyone think of the ending?',
        type: 'text',
        timestamp: new Date(Date.now() - 86000000), // 23 hours 53 minutes ago
      },
      {
        senderIndex: 4, // Edgar
        content: 'I found it quite haunting. The author really knows how to build atmosphere.',
        type: 'text',
        timestamp: new Date(Date.now() - 85500000), // 23 hours 45 minutes ago
      },
      {
        senderIndex: 6, // George
        content: 'Agreed. The character development was exceptional.',
        type: 'text',
        timestamp: new Date(Date.now() - 85000000), // 23 hours 36 minutes ago
      },
      {
        senderIndex: 7, // Helen
        content: 'What was your favorite scene? Mine was when...',
        type: 'text',
        timestamp: new Date(Date.now() - 84500000), // 23 hours 27 minutes ago
      },
      {
        senderIndex: 3, // Diana
        content: 'That scene gave me chills! So well written.',
        type: 'text',
        timestamp: new Date(Date.now() - 84000000), // 23 hours 20 minutes ago
      },
      {
        senderIndex: 2, // Charlie
        content: 'Next month we\'re reading "The Great Gatsby". Who\'s excited?',
        type: 'text',
        timestamp: new Date(Date.now() - 7200000), // 2 hours ago
      },
    ],
  },

  // Project Team Alpha Group Chat
  {
    conversationIndex: 5, // Project Team Alpha
    messages: [
      {
        senderIndex: 1, // Bob
        content: 'Great work everyone on today\'s sprint! 🎉',
        type: 'text',
        timestamp: new Date(Date.now() - 14400000), // 4 hours ago
      },
      {
        senderIndex: 0, // Alice
        content: 'Thanks Bob! The new feature is working beautifully.',
        type: 'text',
        timestamp: new Date(Date.now() - 14300000), // 3 hours 58 minutes ago
      },
      {
        senderIndex: 5, // Frida
        content: 'The UI improvements look fantastic. Great work design team!',
        type: 'text',
        timestamp: new Date(Date.now() - 14200000), // 3 hours 56 minutes ago
      },
      {
        senderIndex: 6, // George
        content: 'Just finished the unit tests. All green! ✅',
        type: 'text',
        timestamp: new Date(Date.now() - 14100000), // 3 hours 55 minutes ago
      },
      {
        senderIndex: 1, // Bob
        content: 'Excellent! Let\'s push to staging tomorrow.',
        type: 'text',
        timestamp: new Date(Date.now() - 60000), // 1 minute ago
      },
    ],
  },

  // Weekend Adventures Group Chat
  {
    conversationIndex: 6, // Weekend Adventures
    messages: [
      {
        senderIndex: 5, // Frida
        content: 'Who\'s up for a hiking trip this weekend? 🏔️',
        type: 'text',
        timestamp: new Date(Date.now() - 10800000), // 3 hours ago
      },
      {
        senderIndex: 0, // Alice
        content: 'I\'m in! What trail were you thinking?',
        type: 'text',
        timestamp: new Date(Date.now() - 10700000), // 2 hours 58 minutes ago
      },
      {
        senderIndex: 3, // Diana
        content: 'Count me in too! The mountain trail would be perfect.',
        type: 'text',
        timestamp: new Date(Date.now() - 10600000), // 2 hours 56 minutes ago
      },
      {
        senderIndex: 7, // Helen
        content: 'Sounds great! Should we meet early Saturday morning?',
        type: 'text',
        timestamp: new Date(Date.now() - 10500000), // 2 hours 55 minutes ago
      },
      {
        senderIndex: 5, // Frida
        content: 'Perfect! Let\'s say 7 AM at the trailhead.',
        type: 'text',
        timestamp: new Date(Date.now() - 10400000), // 2 hours 53 minutes ago
      },
      {
        senderIndex: 0, // Alice
        content: 'I\'ll bring snacks and water for everyone!',
        type: 'text',
        timestamp: new Date(Date.now() - 10300000), // 2 hours 51 minutes ago
      },
      {
        senderIndex: 3, // Diana
        content: 'I have a first aid kit we can bring.',
        type: 'text',
        timestamp: new Date(Date.now() - 10200000), // 2 hours 50 minutes ago
      },
      {
        senderIndex: 7, // Helen
        content: 'This is going to be amazing! Can\'t wait! 🌟',
        type: 'text',
        timestamp: new Date(Date.now() - 1800000), // 30 minutes ago
      },
    ],
  },

  // Code Review Circle Group Chat
  {
    conversationIndex: 7, // Code Review Circle
    messages: [
      {
        senderIndex: 6, // George
        content: 'Just pushed a PR for the new API endpoints. Could use some fresh eyes! 👀',
        type: 'text',
        timestamp: new Date(Date.now() - 14400000), // 4 hours ago
      },
      {
        senderIndex: 1, // Bob
        content: 'I\'ll take a look at it after lunch!',
        type: 'text',
        timestamp: new Date(Date.now() - 14300000), // 3 hours 58 minutes ago
      },
      {
        senderIndex: 5, // Frida
        content: 'The error handling looks much cleaner now.',
        type: 'text',
        timestamp: new Date(Date.now() - 7200000), // 2 hours ago
      },
      {
        senderIndex: 6, // George
        content: 'Thanks! Also wondering if we should add rate limiting?',
        type: 'text',
        timestamp: new Date(Date.now() - 10800000), // 3 hours ago
      },
      {
        senderIndex: 1, // Bob
        content: 'Good point. Let me check the current usage patterns first.',
        type: 'text',
        timestamp: new Date(Date.now() - 10700000), // 2 hours 58 minutes ago
      },
      {
        senderIndex: 5, // Frida
        content: 'We definitely need some protection against abuse.',
        type: 'text',
        timestamp: new Date(Date.now() - 10600000), // 2 hours 56 minutes ago
      },
    ],
  },

  // System Messages (for testing different message types)
  {
    conversationIndex: 3, // Coffee Enthusiasts
    systemMessage: true,
    content: 'Alice added George to the group',
    timestamp: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000), // 35 days ago
  },
  {
    conversationIndex: 4, // Book Club
    systemMessage: true,
    content: 'Charlie created the group "Book Club"',
    timestamp: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000), // 120 days ago
  },
];

export const MessageSeeder = async (users, conversations) => {
  try {
    console.log('  Creating messages...');

    const createdMessages = [];

    for (const conversationData of demoMessages) {
      const conversation = conversations[conversationData.conversationIndex];
      const conversationMessages = conversationData.messages || [];

      for (const messageData of conversationMessages) {
        const sender = users[messageData.senderIndex];
        
        // Create message with encrypted content
        const message = await Message.create({
          conversation_id: conversation.id,
          sender_id: sender.id,
          content_encrypted: simulateEncryptedContent(messageData.content),
          message_type: messageData.type || 'text',
          metadata: messageData.metadata || null,
          is_edited: false,
          is_deleted: false,
          created_at: messageData.timestamp,
          updated_at: messageData.timestamp,
        });

        createdMessages.push(message);
      }

      // Add system message if specified
      if (conversationData.systemMessage) {
        const systemMessage = await Message.create({
          conversation_id: conversation.id,
          sender_id: users[0].id, // Use first user as system message sender
          content_encrypted: simulateEncryptedContent(conversationData.content),
          message_type: 'system',
          metadata: {
            system_event: 'user_added',
          },
          is_edited: false,
          is_deleted: false,
          created_at: conversationData.timestamp,
          updated_at: conversationData.timestamp,
        });

        createdMessages.push(systemMessage);
      }
    }

    console.log(`  ✅ Created ${createdMessages.length} messages`);
    return createdMessages;

  } catch (error) {
    console.error('  ❌ Message seeding failed:', error);
    throw error;
  }
};

export default MessageSeeder;