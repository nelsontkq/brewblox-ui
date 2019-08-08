import './quasar';

import PortalVue from 'portal-vue';
import Vue, { PluginObject } from 'vue';

import App from './App.vue';
import { autoRegister, externalComponent } from './helpers/component-ref';
import builder from './plugins/builder';
import database from './plugins/database';
import history from './plugins/history';
import spark from './plugins/spark';
import router from './router';
import store from './store';
import { UIPlugin, pluginStore } from './store/plugins';

autoRegister(require.context('./components', true, /[A-Z]\w+\.vue$/));

const loadRemotePlugin = async (plugin: UIPlugin): Promise<PluginObject<any>> => {
  try {
    const obj = await externalComponent(plugin.url);
    pluginStore.commitResult({ id: plugin.id, loaded: true, error: null });
    return {
      install: (Vue, { store }) => {
        try {
          Vue.use(obj, { store });
        } catch (e) {
          pluginStore.commitResult({ id: plugin.id, loaded: false, error: e.toString() });
        }
      },
    };
  } catch (e) {
    pluginStore.commitResult({ id: plugin.id, loaded: false, error: e.toString() });
    // return a dummy so we don't have to filter the list before calling Vue.use()
    return { install: () => { } };
  }
};

const setup = async () => {
  // Make Vue accessible as global variable in plugins
  Object.defineProperty(window, 'Vue', { value: Vue });

  // Enable the Vue devtools performance tab
  Vue.config.performance = (process.env.NODE_ENV === 'development');

  // Install the database. We need it to fetch remote plugins
  Vue.use(database, {
    host: process.env.VUE_APP_API_URI || window.location.origin,
    name: 'brewblox-ui-store',
  });

  const plugins: PluginObject<any>[] = [
    PortalVue,
    history,
    spark,
    builder,
  ];

  try {
    await pluginStore.setup();
    const remotePlugins = await pluginStore.fetchPlugins();
    const loaded = await Promise
      .all(remotePlugins.map(loadRemotePlugin));
    plugins.push(...loaded);
  } catch (e) { }

  plugins.forEach(plugin => Vue.use(plugin, { store }));
};

setup().then(() => {
  new Vue({
    router,
    store,
    // q-app is defined by public/index.html
    el: document.getElementById('q-app') as HTMLElement,
    render: f => f(App),
  });
});
