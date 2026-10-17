import { app } from './app.js';
import { env } from './config/env.js';

app.listen(env.port, () => {
  console.log(`API chạy tại http://localhost:${env.port}`);
});