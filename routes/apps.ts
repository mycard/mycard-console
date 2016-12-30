/**
 * Created by weijian on 2016/12/28.
 */
import Router = require('koa-router');
import App from '../models/app';
import {NotFound} from '../koa/errors';
import {Model} from '../db/mongo';
const router = new Router();

router.get('/apps', async(ctx, next) => {
    ctx.body = await App.find({});
});

router.get('/apps/:id', async(ctx, next) => {
    let app = await App.findOne({id: ctx.params.id});
    if (app) {
        ctx.body = app;
    } else {
        throw new NotFound(`App ${ctx.params.id} Not Found`);
    }
});

router.post('/apps/:id', async(ctx, next) => {
    let app = new App(ctx.request.body);
    ctx.body = await app.save();
});

router.patch('/apps/:id', async(ctx, next) => {
    let app: App|null = await Model.findOne({id: ctx.params.id});
    if (!app) {
        throw new NotFound(`App ${ctx.params.id} Not Found`);
    }
    Object.assign(app, ctx.request.body);
    await app.save();
});

router.delete('/apps/:id', async(ctx, next) => {
    let result = await  App.remove({id: ctx.params.id});
    if (!result.deletedCount) {
        throw new NotFound(`App ${ctx.params.id} Not Found`);
    }
    ctx.body = result;
});

export default router;