import { genericBlockFeature } from '@/plugins/spark/generic';
import { blockWidgetSelector } from '@/plugins/spark/helpers';
import { BlockSpec } from '@/plugins/spark/types';
import { WidgetFeature } from '@/store/features';

import widget from './BalancerWidget.vue';
import { typeName } from './getters';
import { BalancerData } from './types';

const block: BlockSpec<BalancerData> = {
  id: typeName,
  generate: () => ({
    clients: [],
  }),
  presets: [],
  changes: [],
};

const feature: WidgetFeature = {
  ...genericBlockFeature,
  id: typeName,
  title: 'Balancer',
  role: 'Constraint',
  component: blockWidgetSelector(widget),
  widgetSize: {
    cols: 4,
    rows: 2,
  },
};

export default { feature, block };
