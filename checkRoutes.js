const app = require('./src/app');
const routes = [];

const routePrefixes = new Map([
  [require('./src/routes/todoRoutes'), '/issues'],
  [require('./src/routes/userRoutes'), '/users']
]);

const getStack = (router) => router?.stack || router?._router?.stack || router?.router?.stack || [];

for (const layer of getStack(app)) {
  if (layer.route) {
    const methods = Object.keys(layer.route.methods).join(',');
    routes.push(methods.toUpperCase() + ' ' + layer.route.path);
  } else if (routePrefixes.has(layer.handle)) {
    const prefix = routePrefixes.get(layer.handle);

    for (const routeLayer of getStack(layer.handle)) {
      if (routeLayer.route) {
        const methods = Object.keys(routeLayer.route.methods).join(',');
        routes.push(methods.toUpperCase() + ' ' + prefix + routeLayer.route.path);
      }
    }
  }
}

console.log(routes.join('\n'));
