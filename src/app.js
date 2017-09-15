import Vue from 'vue'
import App from '../../../App.vue'
import store from '../../../store'
import router from '../../../router'
import meta from 'vue-meta'
import * as plugins from '../../../plugins'
import * as filters from '../../../filters'
import axios from 'axios'
import cookie from 'vue-cookie'

// https://medium.com/the-vue-point/retiring-vue-resource-871a82880af4#.w5c4snp5p
// access this.$http like in vue-resource
Vue.prototype.$http = axios

// Register global utility filters.
Object.keys(filters).forEach(key => {
  Vue.filter(key, filters[key])
})

// Register plugins
Object.keys(plugins).forEach(key => {
  plugins[key](Vue)
})

// https://github.com/declandewet/vue-meta
Vue.use(meta)

Vue.use(cookie)

// Create the app instance.
// Here we inject the router and store to all child components,
// making them available everywhere as `this.$router` and `this.$store`.
const app = new Vue({
  router,
  store,
  render: h => h(App)
})

// Expose the app, the router and the store.
// Note we are not mounting the app here, since bootstrapping will be
// different depending on whether we are in a browser or on the server.
export { app, router, store }
