import { createApp } from 'vue'
import { Quasar, Notify, Dialog } from 'quasar'
import quasarIconSet from 'quasar/icon-set/material-icons'
import router from './router'

// Import icon libraries
import '@quasar/extras/material-icons/material-icons.css'

// Import Quasar css
import 'quasar/src/css/index.sass'

import './style.css' // We will put tailwind here
import App from './App.vue'

const myApp = createApp(App)

myApp.use(router)
myApp.use(Quasar, {
  plugins: { Notify, Dialog },
  iconSet: quasarIconSet,
})

myApp.mount('#app')
