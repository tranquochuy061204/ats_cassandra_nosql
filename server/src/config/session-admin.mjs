import session from 'express-session';
import { RedisStore } from 'connect-redis';
import redisClient from './redis.mjs';

// Ensure Redis client is connected before creating store
if (!redisClient.isOpen) {
  await redisClient.connect();
}

const sessionAdmin = session({
  store: new RedisStore({
    client: redisClient,
    prefix: 'admin:',
    ttl: 60 * 60 * 1,
  }),
  secret: process.env.SESSION_SECRET || 'team10',
  name: 'admin.sid',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false,
    maxAge: 1000 * 60 * 60 * 24,
    sameSite: 'lax',
  },
});

export default sessionAdmin;
