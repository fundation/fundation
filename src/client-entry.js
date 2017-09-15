import 'es6-promise'
import { app, store, router } from './app'
import { sync } from 'vuex-router-sync'

// prime the store with server-initialized state.
// the state is determined during SSR and inlined in the page markup.
if (window.__INITIAL_STATE__) {

  // over write the query params in case of cache
  window.__INITIAL_STATE__.route.query = {}
  const pairs = location.search.slice(1).split('&')
  const query = {}
  pairs.map(function (pair) {
    pair = pair.split('=')
    if (pair[0]) {
      window.__INITIAL_STATE__.route.query[pair[0]] = decodeURIComponent(pair[1] || '')
    }
  })

  store.replaceState(window.__INITIAL_STATE__)

  // Sync the router with the vuex store.
  // This registers `store.state.route`
  sync(store, router)
}

// wait until router has resolved all async before hooks
// and async components...
router.onReady(() => {
  // actually mount to DOM
  app.$mount('#app')
})
