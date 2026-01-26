import { Injectable } from '@nestjs/common';
import { createClient } from 'redis';

@Injectable()
export class CacheService {
  private client;

  constructor() {
    this.client = createClient({
      socket: {
        host: 'localhost',
        port: 6379,
      },
    });
    this.client.connect();
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
