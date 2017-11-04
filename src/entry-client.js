import 'es6-promise/auto'
import { createApp } from './app'
import { sync } from 'vuex-router-sync'

const { app, router, store } = createApp()

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
  // Add router hook for handling asyncData.
  // Doing it after initial route is resolved so that we don't double-fetch
  // the data that we already have. Using router.beforeResolve() so that all
  // async components are resolved.
  router.beforeResolve((to, from, next) => {
    const matched = router.getMatchedComponents(to)
    const prevMatched = router.getMatchedComponents(from)
    let diffed = false
    const activated = matched.filter((c, i) => {
      return diffed || (diffed = (prevMatched[i] !== c))
    })
    const asyncDataHooks = activated.map(c => c.asyncData).filter(_ => _)
    if (!asyncDataHooks.length) {
      return next()
    }
  })

  // actually mount to DOM
  app.$mount('#app')
})
