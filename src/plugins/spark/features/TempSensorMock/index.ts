import { Unit } from '@/helpers/units';
import { genericBlockFeature } from '@/plugins/spark/generic';
import { blockWidgetSelector } from '@/plugins/spark/helpers';
import { BlockSpec } from '@/plugins/spark/types';
import { WidgetFeature } from '@/store/features';

import { typeName } from './getters';
import widget from './TempSensorMockWidget.vue';
import { TempSensorMockData } from './types';

const block: BlockSpec<TempSensorMockData> = {
  id: typeName,
  generate: () => ({
    value: new Unit(20, 'degC'),
    setting: new Unit(20, 'degC'),
    fluctuations: [],
    connected: true,
  }),
  changes: [
    {
      key: 'setting',
      title: 'Sensor Setting',
      component: 'UnitValEdit',
      generate: () => new Unit(20, 'degC'),
    },
    {
      key: 'connected',
      title: 'Connected',
      component: 'BoolValEdit',
      generate: () => true,
    },
  ],
  presets: [],
  graphTargets: {
    value: 'Sensor value',
  },
};

const feature: WidgetFeature = {
  ...genericBlockFeature,
  id: typeName,
  title: 'Temp Sensor (Mock)',
  role: 'Process',
  component: blockWidgetSelector(widget),
  widgetSize: {
    cols: 4,
    rows: 3,
  },
};

export default { feature, block };
