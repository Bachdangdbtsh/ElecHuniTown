// const required = ['DATABASE_URL', 'JWT_SECRET', 'CLIENT_ORIGIN'];
// const missing = required.filter((k) => !process.env[k]);
// if (missing.length) {
//   throw new Error(`Thieu bien moi truong: ${missing.join(', ')}`);
// }
import 'dotenv/config'; 

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 4000),
  clientOrigin: process.env.CLIENT_ORIGIN,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '30m',
};