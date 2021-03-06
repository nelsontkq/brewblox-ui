import { blockTypes } from '@/plugins/spark/block-types';

import { showDrivingBlockDialog } from '../helpers';
import { PartSpec, PersistentPart } from '../types';

const SIZE_X = 1;
const SIZE_Y = 1;

const spec: PartSpec = {
  id: 'PwmDisplay',
  title: 'Display: PWM',
  transitions: () => ({}),
  cards: [{
    component: 'BlockAddressCard',
    props: {
      settingsKey: 'pwm',
      compatible: [blockTypes.ActuatorPwm],
      label: 'PWM',
    },
  }],
  size: () => [SIZE_X, SIZE_Y],
  interactHandler: (part: PersistentPart) => showDrivingBlockDialog(part, 'pwm'),
};

export default spec;
