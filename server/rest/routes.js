import express from 'express';
import * as controller from './controllers';

const router = express.Router();

router.route('/hello')
  .get(controller.getHello)
  .post(controller.postHello);

router.route('/bye')
  .get(controller.getBye)
  .post(controller.postBye);

export default router;
