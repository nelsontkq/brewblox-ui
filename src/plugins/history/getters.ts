import { GraphConfig, QueryParams } from './types';

export const defaultPresets = (): QueryParams[] => [
  { duration: '10m' },
  { duration: '1h' },
  { duration: '1d' },
  { duration: '3d' },
  { duration: '7d' },
  { duration: '14d' },
  { duration: '30d' },
];

export const emptyGraphConfig = (): GraphConfig => ({
  layout: {},
  params: {},
  targets: [],
  renames: {},
  axes: {},
  colors: {},
});
