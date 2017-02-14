import _ from 'lodash'
import { app, router, store } from './app'
const util = require('util');

const isDev = process.env.NODE_ENV !== 'production'

// This exported function will be called by `bundleRenderer`.
// This is where we perform data-prefetching to determine the
// state of our application before actually rendering it.
// Since data fetching is async, this function is expected to
// return a Promise that resolves to the app instance.
export default context => {

  // Put the cookies in the store
  if (context.cookies) {
    store.state.cookies = context.cookies
  }

  const s = isDev && Date.now()

  // set router's location
  router.push(context.url)
  const matchedComponents = router.getMatchedComponents()

  // no matched routes
  if (!matchedComponents.length) {
    return Promise.reject({ code: '404' })
  }

  const meta = app.$meta()

  // Call preFetch hooks on components matched by the route.
  // A preFetch hook dispatches a store action and returns a Promise,
  // which is resolved when the action is complete and store state has been
  // updated.
  return Promise.all(matchedComponents.map(component => {
    // Prefetch only applies to first time load
    if (component.preFetch) {
      return component.preFetch(store, app)
    }
  })).then(() => {
    // After all preFetch hooks are resolved, our store is now
    // filled with the state needed to render the app.
    // Expose the state on the render context, and let the request handler
    // inline the state in the HTML response. This allows the client-side
    // store to pick-up the server-side state without having to duplicate
    // the initial data fetching on the client.
    context.initialState = store.state

    context.meta = meta

    return app
  })
  .catch(error => {
    if (_.get(error, 'code') === '301' && _.get(error, 'url', false)) {
      return Promise.reject({
        code: _.get(error, 'code'),
        url:  _.get(error, 'url')
      })
    }

    context.initialState = store.state
    context.meta = meta
    return app
  })
}
