import { Module } from '@nestjs/common';
import { TransportController } from './transport.controller';

@Module({
  controllers: [TransportController],
})
export class TransportModule {}
