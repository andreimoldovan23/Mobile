import Router from 'koa-router';
import CoffeeStore from './store';
import { v4 as uuidv4 } from 'uuid';
import { broadcast } from "../utils";

export const router = new Router();

router.get('/', async (ctx) => {
  const response = ctx.response;
  const userId = ctx.state.user._id;
  const pageNumber = ctx.get("Page");
  const pageSize = ctx.get("Size");
  const filter = ctx.get("Filter");

  let items = await CoffeeStore.find({ userId: userId });
  if (filter !== '') items = items.filter(it => it.origin === filter);

  if (pageNumber === "" || pageSize === "" || parseInt(pageNumber) == NaN || parseInt(pageSize) == NaN || !items || items.length === 0) {
    response.body = items;
  }
  else {
    let startIndex = parseInt(pageNumber) * parseInt(pageSize);
    let endIndex = startIndex + parseInt(pageSize);
    if (endIndex > items.length) endIndex = items.length;
    response.body = items.slice(startIndex, endIndex);
  }
  response.status = 200;
});

router.get('/origins', async (ctx) => {
  const response = ctx.response;
  const userId = ctx.state.user._id;

  const items = await CoffeeStore.find({ userId: userId });
  let origins = items.map(it => it.origin);
  origins = [...new Set(origins)];

  response.body = origins.map(it => { return { origin: it }; });
  response.status = 200;
});

router.get('/:id', async (ctx) => {
  const userId = ctx.state.user._id;
  const cof = await CoffeeStore.findOne({ _id: ctx.params.id });
  const response = ctx.response;
  
  if (cof) {
    if (cof.userId === userId) {
      response.body = cof;
      response.status = 200;
    } else {
      response.status = 403;
    }
  } else {
    response.status = 404;
  }
});

const createCoffee = async (ctx, cof, response) => {
  try {
    const userId = ctx.state.user._id;
    cof.userId = userId;
    cof._id = uuidv4();
    response.body = await CoffeeStore.insert(cof);
    response.status = 201;
    broadcast(userId, { type: 'created', payload: cof });
  } catch (err) {
    response.body = { message: err.message };
    response.status = 400;
  }
};

router.post('/', async ctx => await createCoffee(ctx, ctx.request.body, ctx.response));

router.put('/:id', async (ctx) => {
  const cof = ctx.request.body;
  const id = ctx.params.id;
  const cofId = cof._id;
  const response = ctx.response;
  if (cofId && cofId !== id) {
    response.body = { message: 'Param id and body _id should be the same' };
    response.status = 400;
    return;
  }
  if (!cofId) {
    await createCoffee(ctx, cof, response);
  } else {
    const userId = ctx.state.user._id;
    cof.userId = userId;
    const updatedCount = await CoffeeStore.update({ _id: id }, cof);
    if (updatedCount === 1) {
      response.body = cof;
      response.status = 200;
      broadcast(userId, { type: 'updated', payload: cof });
    } else {
      response.body = { message: 'Resource no longer exists' };
      response.status = 405;
    }
  }
});

router.del('/:id', async (ctx) => {
  const userId = ctx.state.user._id;
  const cof = await CoffeeStore.findOne({ _id: ctx.params.id });
  if (cof && userId !== cof.userId) {
    ctx.response.status = 403;
  } else {
    await CoffeeStore.remove({ _id: ctx.params.id });
    broadcast(userId, { type: 'deleted', payload: cof })
    ctx.response.status = 204;
  }
});
