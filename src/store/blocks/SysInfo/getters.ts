import { RootStore } from '../../state';

import { allBlocksFromService, blockById } from '../getters';

import { SysInfoBlock } from './SysInfo';

export const typeName = 'SysInfo';

export const getById = (store: RootStore, id: string) =>
  blockById<SysInfoBlock>(store, id, typeName);

export const getAll = (store: RootStore, serviceId: string) =>
  allBlocksFromService<SysInfoBlock>(store, serviceId, typeName);
