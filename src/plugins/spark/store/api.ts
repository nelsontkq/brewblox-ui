
import http, { intercept } from '@/helpers/http';
import notify from '@/helpers/notify';

import { asBlock, asDataBlock } from '../helpers';
import { ApiSparkStatus, Block, DataBlock, SparkExported, SparkStatus, UserUnits } from '../types';

export const fetchBlocks = async (serviceId: string): Promise<Block[]> =>
  http.get<DataBlock[]>(`/${encodeURIComponent(serviceId)}/objects`)
    .then(resp => resp.data.map((block: DataBlock) => asBlock(block, serviceId)))
    .catch(intercept(`Failed to fetch blocks from ${serviceId}`));

export const fetchBlock = async (block: Block): Promise<Block> =>
  http.get<DataBlock>(`/${encodeURIComponent(block.serviceId)}/objects/${encodeURIComponent(block.id)}`)
    .then(resp => asBlock(resp.data, block.serviceId))
    .catch(intercept(`Failed to fetch ${block.id}`));

export const fetchStoredBlock = async (serviceId: string, id: string | number): Promise<Block> =>
  http.get<DataBlock>(`/${encodeURIComponent(serviceId)}/stored_objects/${encodeURIComponent(id)}`)
    .then(resp => asBlock(resp.data, serviceId))
    .catch(intercept(`Failed to fetch stored block ${id}`));

export const createBlock = async (block: Block): Promise<Block> =>
  http.post<DataBlock>(
    `/${encodeURIComponent(block.serviceId)}/objects`,
    asDataBlock(block),
  )
    .then(resp => asBlock(resp.data, block.serviceId))
    .catch(intercept(`Failed to create ${block.id}`));

export const persistBlock = async (block: Block): Promise<Block> =>
  http.put<DataBlock>(
    `/${encodeURIComponent(block.serviceId)}/objects/${encodeURIComponent(block.id)}`,
    asDataBlock(block),
  )
    .then(resp => asBlock(resp.data, block.serviceId))
    .catch(intercept(`Failed to persist ${block.id}`));

export const renameBlock =
  async (serviceId: string, currentId: string, newId: string): Promise<any> =>
    http.put(
      `/${encodeURIComponent(serviceId)}/aliases/${encodeURIComponent(currentId)}`,
      { id: newId },
    )
      .catch(intercept(`Failed to rename ${currentId}`));

export const deleteBlock = async (block: Block): Promise<string> =>
  http.delete<DataBlock>(
    `/${encodeURIComponent(block.serviceId)}/objects/${encodeURIComponent(block.id)}`,
    asDataBlock(block),
  )
    .then(resp => resp.data.id)
    .catch(intercept(`Failed to delete ${block.id}`));

export const clearBlocks = async (serviceId: string): Promise<any> =>
  http.delete(`/${encodeURIComponent(serviceId)}/objects`, {})
    .catch(intercept(`Failed to clear blocks on ${serviceId}`));

export const cleanUnusedNames = async (serviceId: string): Promise<string[]> =>
  http.delete<string[]>(`/${encodeURIComponent(serviceId)}/unused_names`)
    .then(resp => resp.data)
    .catch(intercept(`Failed to clean unused block names on ${serviceId}`));

export const fetchUnits = async (serviceId: string): Promise<UserUnits> =>
  http.get<UserUnits>(`/${encodeURIComponent(serviceId)}/codec/units`)
    .then(resp => resp.data)
    .catch(intercept(`Failed to fetch unit settings on ${serviceId}`));

export const persistUnits = async (serviceId: string, units: UserUnits): Promise<UserUnits> =>
  http.put<UserUnits>(`/${encodeURIComponent(serviceId)}/codec/units`, units)
    .then(resp => resp.data)
    .catch(intercept(`Failed to persist unit settings on ${serviceId}`));

export const fetchCompatibleUnits = async (serviceId: string): Promise<Mapped<string[]>> =>
  http.get<Mapped<string[]>>(`/${encodeURIComponent(serviceId)}/codec/unit_alternatives`)
    .then(resp => resp.data)
    .catch(intercept(`Failed to fetch unit alternatives on ${serviceId}`));

export const fetchCompatibleTypes = async (serviceId: string): Promise<Mapped<string[]>> =>
  http.get<Mapped<string[]>>(`/${encodeURIComponent(serviceId)}/codec/compatible_types`)
    .then(resp => resp.data)
    .catch(intercept(`Failed to fetch compatible types on ${serviceId}`));

export const fetchDiscoveredBlocks = async (serviceId: string): Promise<string[]> =>
  http.get<string[]>(`/${encodeURIComponent(serviceId)}/discover_objects`)
    .then(resp => resp.data)
    .catch(intercept(`Failed to discover objects on ${serviceId}`));

export const validateService = async (serviceId: string): Promise<boolean> =>
  http.get(`/${encodeURIComponent(serviceId)}/_service/status`)
    .then(resp => resp.data.status === 'ok')
    .catch(() => false);

const unknownStatus = (): ApiSparkStatus => ({
  connect: false,
  handshake: false,
  synchronize: false,
  compatible: true, // no idea - assume yes
  latest: true, // no idea - assume yes
  valid: true, // no idea - assume yes
  info: [],
  address: null,
});

export const fetchSparkStatus = async (serviceId: string): Promise<SparkStatus> => {
  try {
    const resp = await http.get<ApiSparkStatus>(`/${encodeURIComponent(serviceId)}/system/status`);
    return {
      ...resp.data,
      serviceId,
      available: true,
    };
  } catch (error) {
    notify.warn(`Unable to fetch Spark status: ${error}`, { shown: false });
    return {
      ...unknownStatus(),
      serviceId,
      available: false,
    };
  }
};

export const flashFirmware = async (serviceId: string): Promise<any> =>
  http.post(`/${encodeURIComponent(serviceId)}/system/flash`, {})
    .then(resp => resp.data)
    .catch(intercept(`Failed to update firmware on ${serviceId}`));

export const serviceExport = async (serviceId: string): Promise<SparkExported> =>
  http.get<SparkExported>(`/${encodeURIComponent(serviceId)}/export_objects`)
    .then(resp => resp.data)
    .catch(intercept(`Failed to fetch stored blocks from ${serviceId}`));

export const serviceImport = async (serviceId: string, exported: SparkExported): Promise<string[]> =>
  http.post<string[]>(`/${encodeURIComponent(serviceId)}/import_objects`, exported)
    .then(resp => resp.data)
    .catch(intercept(`Failed to reset stored blocks in ${serviceId}`));

export const reboot = async (serviceId: string): Promise<any> =>
  http.get(`/${encodeURIComponent(serviceId)}/system/reboot`, {})
    .then(resp => resp.data)
    .catch(intercept(`Failed to reboot ${serviceId}`));
