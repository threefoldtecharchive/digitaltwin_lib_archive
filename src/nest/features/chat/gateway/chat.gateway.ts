import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
    MessageBody,
    OnGatewayConnection,
    OnGatewayDisconnect,
    OnGatewayInit,
    SubscribeMessage,
    WebSocketGateway,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

import { KeyService } from '../../key/service/key.service';
import { SocketService } from '../../socket/service/socket.service';
import { Chat } from '../models/chat.model';
import { Contact } from '../models/contact.model';
import { Message } from '../models/message.model';
import { ChatService } from '../service/chat.service';

@WebSocketGateway({ cors: '*', namespace: 'chat' })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {
    private logger: Logger = new Logger('ChatGateway');

    constructor(
        private readonly _socketService: SocketService,
        private readonly _configService: ConfigService,
        private readonly _keyService: KeyService,
        private readonly _chatService: ChatService
    ) {}

    /**
     * TODO: WIP
     * Sends a new incoming message to all connected clients.
     */
    @SubscribeMessage('message_to_server')
    async handleIncomingMessage(@MessageBody() message: Message) {
        // correct from to message
        message.from = this._configService.get<string>('userId');

        // sign message
        const signedMessage = await this._keyService.appendSignatureToMessage(message);

        // get chat data
        let chat = await this._chatService.getChat(`${message.from}-${message.to}`);
        if (!chat) {
            chat = await this.createNewChat(signedMessage);
        }

        // set correct chatId to message
        signedMessage.id = message.id;

        // notify contacts about creation of new chat
        this._socketService.server.emit('message_to_client', signedMessage);

        // const contacts = chat.parseContacts();

        // const location = contacts.find(c => c.id == chat.adminId).location;

        // if (signedMessage.type === MessageType.READ) {
        //     // TODO: handle read
        // }

        // persist message
        this._chatService.addMessageToChat({ chat, message: signedMessage });
    }

    /**
     * Adds a user to a chat for socket io.
     * @param {Socket} client - socket.io client.
     */
    @SubscribeMessage('join_chat')
    handleJoinChat(client: Socket): void {
        client.join('chat');
        client.emit('joined_chat', 'chat');
    }

    /**
     * Removes a user from a chat for socket io.
     * @param {Socket} client - socket.io client.
     */
    @SubscribeMessage('leave_chat')
    handleLeaveChat(client: Socket): void {
        client.leave('chat');
        client.emit('left_chat', 'chat');
    }

    /**
     * Emits message to connected clients.
     * @param {string} event - Event to emit.
     * @param {unknown} message - Message to send.
     */
    emitMessageToConnectedClients(event: string, message: unknown): void {
        this._socketService.server.emit(event, message);
    }

    /**
     * Handles socket initialization.
     * @param {Server} server - socket.io server.
     */
    afterInit(server: Server) {
        this.logger.log(`chat gateway setup successful`);
        this._socketService.server = server;
    }

    /**
     * Handles a new socket.io client connection.
     * @param {Socket} client - socket.io client.
     */
    handleConnection(client: Socket): void {
        this.logger.log(`new client connection: ${client.id}`);
        this.handleJoinChat(client);
    }

    /**
     * Handles a socket.io client disconnection.
     * @param {Socket} client - socket.io client.
     */
    handleDisconnect(client: Socket): void {
        this.logger.log(`client disconnected: ${client.id}`);
        this.handleLeaveChat(client);
    }

    /**
     * Creates a new chat if chat is not found.
     * @param {string} from - From id.
     * @param {string} to - To id.
     * @return {Chat} - The created chat.
     */
    private async createNewChat({ from, to }: { from: string; to: string }): Promise<Chat> {
        const contacts = [
            {
                id: from,
                location: 'localhost',
            },
            {
                id: to,
                location: 'localhost',
            },
        ];
        return await this._chatService.createChat({
            chatId: `${from}-${to}`,
            name: `${from}-${to}`,
            contacts: contacts as Contact[],
            messages: [],
            acceptedChat: false,
            adminId: from,
            read: [],
            isGroup: false,
            draft: [],
        });
    }
}
