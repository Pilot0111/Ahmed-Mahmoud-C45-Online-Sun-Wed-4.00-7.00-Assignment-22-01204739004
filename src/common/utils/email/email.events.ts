import { EventEmitter } from 'node:events';
import { EventEnum } from '../../enum/emailEvent.enum';

export const emailEvents = new EventEmitter();

for (const event of Object.values(EventEnum)) {
  emailEvents.on(event, async (fn) => {
    try {
      await fn();
      console.log(`Email task for ${event} completed successfully`);
    } catch (error: any) {
      console.error(`Email event error for ${event}:`, error?.message);
    }
  });
}
