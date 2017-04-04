import Vue from 'vue'
import App from '../../../App.vue'
import store from '../../../store'
import router from '../../../router'
import meta from 'vue-meta'
import { sync } from 'vuex-router-sync'
import * as filters from '../../../filters'
import axios from 'axios'
import cookie from 'vue-cookie'

// http://element.eleme.io/#/en-US/component/i18n
import ElementUI from 'element-ui'
import locale from 'element-ui/lib/locale/lang/en'
Vue.use(ElementUI, { locale })

// https://medium.com/the-vue-point/retiring-vue-resource-871a82880af4#.w5c4snp5p
// access this.$http like in vue-resource
Vue.prototype.$http = axios

// sync the router with the vuex store.
// this registers `store.state.route`
sync(store, router)

// register global utility filters.
Object.keys(filters).forEach(key => {
  Vue.filter(key, filters[key])
})

// create the app instance.
// here we inject the router and store to all child components,
// making them available everywhere as `this.$router` and `this.$store`.
const app = new Vue({
  router,
  store,
  render: h => h(App)
})

// https://github.com/declandewet/vue-meta
Vue.use(meta)

Vue.use(cookie)

// expose the app, the router and the store.
// note we are not mounting the app here, since bootstrapping will be
// different depending on whether we are in a browser or on the server.
export { app, router, store }
