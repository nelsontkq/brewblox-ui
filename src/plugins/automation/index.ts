import { VueConstructor } from 'vue';

import { autoRegister, ref } from '@/helpers/component-ref';
import { featureStore, WatcherFeature, WidgetFeature } from '@/store/features';

import { EventbusMessage } from '../eventbus';
import AutomationWidget from './AutomationWidget.vue';
import { AutomationEvent } from './getters';
import { automationStore } from './store';
import { AutomationConfig, AutomationEventData } from './types';

const widget: WidgetFeature = {
  id: 'Automation',
  title: 'Automation',
  component: ref(AutomationWidget),
  wizard: true,
  widgetSize: {
    cols: 4,
    rows: 2,
  },
  generateConfig: (): AutomationConfig => ({}),
};

const watcher: WatcherFeature = {
  id: 'AutomationWatcher',
  component: 'AutomationWatcher',
  props: {},
};

export default {
  install(Vue: VueConstructor) {
    autoRegister(require.context('./components', true, /[A-Z]\w+\.vue$/));

    if (process.env.BLOX_FEATURE_AUTOMATION) {
      featureStore.registerWidget(widget);
      featureStore.registerWatcher(watcher);
    }

    Vue.$startup.onStart(() => automationStore.start());
    Vue.$eventbus.addListener({
      id: 'automation',
      filter: (_, type) => type === AutomationEvent,
      onmessage: (msg: EventbusMessage) => {
        const data: AutomationEventData = msg.data;
        automationStore.setEventData(data);
      },
    });
  },
};
