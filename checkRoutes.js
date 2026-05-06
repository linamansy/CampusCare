const app = require('./src/app');
const routes = [];
app._router.stack.forEach(mw => {
  if (mw.route) {
    const methods = Object.keys(mw.route.methods).join(',');
    routes.push(methods.toUpperCase() + ' ' + mw.route.path);
  } else if (mw.name === 'router') {
    mw.handle.stack.forEach(r => {
      if (r.route) {
        const methods = Object.keys(r.route.methods).join(',');
        routes.push(methods.toUpperCase() + ' ' + r.route.path);
      }
    });
  }
});
console.log(routes.join('\n'));