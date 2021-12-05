import Router from 'koa-router';
import userStore from './store';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { jwtConfig } from '../utils';

export const router = new Router();

const createToken = (user) => {
  return jwt.sign({ username: user.username, _id: user._id }, jwtConfig.secret, { expiresIn: 60 * 60 * 60 });
};

const createUser = async (user, response) => {
  try {
    user._id = uuidv4();
    await userStore.insert(user);
    response.body = { token: createToken(user) };
    response.status = 201;
  } catch (err) {
    response.body = { issue: [{ error: err.message }] };
    response.status = 400;
  }
};

router.post('/signup', async (ctx) => await createUser(ctx.request.body, ctx.response));

router.post('/login', async (ctx) => {
  const credentials = ctx.request.body;
  const response = ctx.response;
  const user = await userStore.findOne({ username: credentials.username });
  if (user && credentials.password === user.password) {
    response.body = { token: createToken(user) };
    response.status = 201;
  } else {
    response.body = { issue: [{ error: 'Invalid credentials' }] };
    response.status = 400;
  }
});
