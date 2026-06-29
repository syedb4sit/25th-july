import { WebSocketEvent } from '@25th-july/types';
import { messageService } from '../services/message.service';
import { broadcastToPartner, connectedClients } from './server';
import { prisma } from '../lib/db';

export const handleWebSocketMessage = async (userId: string, event: WebSocketEvent) => {
  switch (event.type) {
    case 'message:send':
      const message = await messageService.createMessage(userId, event.payload);
      
      // Acknowledge to sender
      const senderSocket = connectedClients.get(userId);
      if (senderSocket) {
        senderSocket.send(JSON.stringify({ type: 'message:new', payload: message }));
      }

      // Broadcast to partner
      await broadcastToPartner(userId, { type: 'message:new', payload: message });
      break;

    case 'message:edit':
      const updated = await messageService.editMessage(userId, event.payload);
      await broadcastToPartner(userId, { type: 'message:edited', payload: updated });
      break;

    case 'message:reaction':
      await prisma.reaction.upsert({
        where: {
          messageId_userId_reaction: {
            messageId: event.payload.messageId,
            userId,
            reaction: event.payload.reaction
          }
        },
        create: {
          messageId: event.payload.messageId,
          userId,
          reaction: event.payload.reaction
        },
        update: {}
      });
      await broadcastToPartner(userId, event);
      break;

    case 'typing:start':
    case 'typing:stop':
      // Ephemeral events, just pass through to partner
      await broadcastToPartner(userId, event);
      break;

    case 'status:delivered':
      await messageService.markDelivered(event.payload.messageIds);
      await broadcastToPartner(userId, event);
      break;

    case 'status:read':
      await messageService.markRead(event.payload.messageIds);
      await broadcastToPartner(userId, event);
      break;

    default:
      console.warn(`Unknown WebSocket event type`);
  }
};
