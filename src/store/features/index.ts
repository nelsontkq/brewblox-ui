import isString from 'lodash/isString';
import { Action, Module, VuexModule } from 'vuex-class-modules';

import store from '@/store';

import {
  Crud,
  QuickStartFeature,
  ServiceFeature,
  WatcherFeature,
  WidgetFeature,
  WidgetRemoveAction,
  WidgetRole,
} from './types';

export * from './types';

@Module({ generateMutationSetters: true })
export class FeatureModule extends VuexModule {

  public widgets: WidgetFeature[] = [];
  public quickStarts: QuickStartFeature[] = [];
  public watchers: WatcherFeature[] = [];
  public services: ServiceFeature[] = [];

  public get widgetIds(): string[] {
    return this.widgets.map(v => v.id);
  }

  public get quickStartIds(): string[] {
    return this.quickStarts.map(v => v.id);
  }

  public get watcherIds(): string[] {
    return this.watchers.map(v => v.id);
  }

  public get serviceIds(): string[] {
    return this.services.map(v => v.id);
  }

  public widgetById(id: string): WidgetFeature | null {
    return this.widgets.find(v => v.id === id) ?? null;
  }

  public quickStartById(id: string): QuickStartFeature | null {
    return this.quickStarts.find(v => v.id === id) ?? null;
  }

  public watcherById(id: string): WatcherFeature | null {
    return this.watchers.find(v => v.id === id) ?? null;
  }

  public serviceById(id: string): ServiceFeature | null {
    return this.services.find(v => v.id === id) ?? null;
  }

  public widgetTitle(id: string): string {
    return this.widgetById(id)?.title ?? 'Unknown';
  }

  public widgetRole(id: string): WidgetRole {
    return this.widgetById(id)?.role ?? 'Other';
  }

  public widgetWizard(id: string): string | null {
    const feature = this.widgetById(id);
    if (feature === null) { return null; };
    return isString(feature.wizard)
      ? feature.wizard
      : !!feature.wizard
        ? 'GenericWidgetWizard'
        : null;
  }

  public widgetComponent(crud: Crud, throwInvalid = false): string {
    try {
      const feature = this.widgetById(crud.widget.feature);
      if (!feature) {
        throw new Error(`No feature found for '${crud.widget.feature}'`);
      }
      return isString(feature.component)
        ? feature.component
        : feature.component(crud); // can throw
    } catch (e) {
      if (throwInvalid) { throw e; }
      return 'InvalidWidget';
    }
  }

  public widgetSize(id: string): GridSize {
    return this.widgetById(id)?.widgetSize ?? { cols: 3, rows: 2 };
  }

  public widgetRemoveActions(id: string): WidgetRemoveAction[] {
    return this.widgetById(id)?.removeActions ?? [];
  }

  @Action
  public async registerWidget(feature: WidgetFeature): Promise<void> {
    if (feature.wizard === true && feature.generateConfig === undefined) {
      throw new Error(`Widget feature ${feature.id} must define a generateConfig function to use the default wizard`);
    }
    if (this.widgetById(feature.id)) {
      throw new Error(`Widget feature '${feature.id}' already exists`);
    }
    this.widgets = [...this.widgets, feature];
  }

  @Action
  public async registerQuickStart(feature: QuickStartFeature): Promise<void> {
    if (this.quickStartById(feature.id)) {
      throw new Error(`Widget feature '${feature.id}' already exists`);
    }
    this.quickStarts = [...this.quickStarts, feature];
  }

  @Action
  public async registerWatcher(feature: WatcherFeature): Promise<void> {
    if (this.watcherById(feature.id)) {
      throw new Error(`Watcher feature '${feature.id}' already exists`);
    }
    this.watchers = [...this.watchers, feature];
  }

  @Action
  public async registerService(feature: ServiceFeature): Promise<void> {
    if (this.serviceById(feature.id)) {
      throw new Error(`Service feature '${feature.id}' already exists`);
    }
    this.services = [...this.services, feature];
  }
}

export const featureStore = new FeatureModule({ store, name: 'features' });
