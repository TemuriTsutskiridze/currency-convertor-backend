import { Injectable } from '@nestjs/common';
import { createClient } from 'redis';

@Injectable()
export class CacheService {
  private client: ReturnType<typeof createClient>;

  constructor() {
    this.client = createClient({
      socket: {
        host: process.env.REDIS_HOST || 'localhost',
        port: Number(process.env.REDIS_PORT || 6379),
      },
      password: process.env.REDIS_PASSWORD || undefined,
      database: Number(process.env.REDIS_DB || 0),
    });
    this.client.connect().catch((error) => {
      console.log(error);
    });
  }

  async get(key: string) {
    try {
      return await this.client.get(key);
    } catch (error) {
      console.log(error);
    }
  }

  async set(key: string, value: string, ttl: number) {
    try {
      await this.client.setEx(key, ttl, value);
    } catch (error) {
      console.log(error);
    }
  }

  //   async test() {
  //     await this.set('test', 'temo', 60);
  //     const result = await this.get('test');
  //     return result;
  //   }
}
