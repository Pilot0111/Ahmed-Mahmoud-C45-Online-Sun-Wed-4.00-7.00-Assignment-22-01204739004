import { Module } from "@nestjs/common";
import { createClient } from "redis";
import { RedisService } from "../service/redis.service";

@Module({
    imports: [],
    controllers: [],
    providers: [
        RedisService,
        {
            provide: 'REDIS_CLIENT',
            useFactory: async () => {
                const client = createClient({
                    url: process.env.REDIS_URL || 'redis://localhost:6379',
                });
                client.on('error', (err) => console.error('Redis Client Error', err));
                await client.connect();
                console.log('Redis connected successfully via Global RedisModule! 🚀');
                return client;
            },
        }
    ],
    exports: ['REDIS_CLIENT', RedisService],
})
export class RedisModule {}
