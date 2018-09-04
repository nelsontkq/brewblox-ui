import { RootStore } from '@/store/state';
import { Block } from '@/store/blocks/state';
import { DeviceService } from '@/store/services/state';

import { deviceServices } from '@/store/services/getters';
import { allBlocksFromService } from '@/store/blocks/getters';
import { VueConstructor } from 'vue';

import { allTypes, createByType, descriptionByType } from '@/features/feature-by-type';

function getBlocksFromServices(
  services: DeviceService[],
  store: RootStore,
  type: string,
): Block[] {
  return services
    .map(service => allBlocksFromService(store, service.id, type))
    .reduce((acc, sensors) => [...acc, ...sensors], []);
}

export function blocksByWidgetType(store: RootStore, type: WidgetType): Block[] {
  const services = deviceServices(store);
  return getBlocksFromServices(services, store, type);
}

export const widgetComponents: { [name: string]: VueConstructor } = allTypes
  .filter(createByType)
  .reduce((coll: any, type: string) => {
    coll[type] = createByType(type);
    return coll;
  }, {});

export const widgetDescriptions: { [name: string]: string } = allTypes
  .reduce((coll: any, type: string) => {
    coll[type] = descriptionByType(type);
    return coll;
  }, {});
