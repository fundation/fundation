import 'babel-polyfill'
import Vue from 'vue'
import { sync } from 'vuex-router-sync'
import App from '../../../App.vue'
import { createStore } from '../../../store'
import { createRouter } from '../../../router'
import meta from 'vue-meta'
import * as plugins from '../../../plugins'
import * as filters from '../../../filters'
import axios from 'axios'
import cookie from 'vue-cookie'

// https://medium.com/the-vue-point/retiring-vue-resource-871a82880af4#.w5c4snp5p
// access this.$http like in vue-resource
Vue.$http = axios

// register global utility filters.
Object.keys(filters).forEach(key => {
  Vue.filter(key, filters[key])
})

// Register plugins
Object.keys(plugins).forEach(key => {
  plugins[key](Vue)
})

// Cookie Plugin
Vue.use(cookie)

// https://github.com/declandewet/vue-meta
Vue.use(meta)

if (process.env.NODE_ENV !== 'production') {
  Vue.config.devtools = true
}

// Expose a factory function that creates a fresh set of store, router,
// app instances on each call (which is called for each SSR request)
export function createApp () {
  const store = createStore()
  const router = createRouter()

  // create the app instance.
  // here we inject the router, store and ssr context to all child components,
  // making them available everywhere as `this.$router` and `this.$store`.
  const app = new Vue({
    router,
    store,
    render: h => h(App)
  })

  // expose the app, the router and the store.
  // note we are not mounting the app here, since bootstrapping will be
  // different depending on whether we are in a browser or on the server.
  return { app, router, store }
}
