import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({ cors: { origin: '*' } }) // tighten origin in production
export class QueueGateway {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(QueueGateway.name);

  @SubscribeMessage('joinDoctorQueue')
  handleJoinDoctorQueue(
    @MessageBody() data: { doctorId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const room = `doctor:${data.doctorId}:queue`;
    client.join(room);
    this.logger.log(`Client ${client.id} joined room ${room}`);
  }

  @SubscribeMessage('joinUserRoom')
  handleJoinUserRoom(
    @MessageBody() data: { userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const room = `user:${data.userId}`;
    client.join(room);
    this.logger.log(`Client ${client.id} joined room ${room}`);
  }

  emitToDoctorRoom(doctorId: string, event: string, payload: any) {
    this.server.to(`doctor:${doctorId}:queue`).emit(event, payload);
  }

  emitToUser(userId: string, event: string, payload: any) {
    this.server.to(`user:${userId}`).emit(event, payload);
  }
}