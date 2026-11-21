import { app } from './app.js';
import { env } from './config/env.js';
import { startAutoConfirmTask } from './tasks/autoConfirmTask.js';
import { startSimulatedShippingTask } from './tasks/simulatedShippingTask.js';

app.listen(env.port, () => {
  console.log(`API chạy tại http://localhost:${env.port}`);
  startAutoConfirmTask();
  startSimulatedShippingTask();
});
