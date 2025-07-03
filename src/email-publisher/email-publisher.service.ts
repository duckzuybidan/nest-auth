import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import {
  EMAIL_QUEUE_NAME,
  SEND_VERIFICATION_EMAIL,
} from 'src/common/constants';

@Injectable()
export class EmailPublisherService {
  constructor(@Inject(EMAIL_QUEUE_NAME) private readonly client: ClientProxy) {}

  async sendVerificationEmail(payload: { to: string; otp: string }) {
    return firstValueFrom(
      this.client.emit(SEND_VERIFICATION_EMAIL, { payload }),
    );
  }
}
