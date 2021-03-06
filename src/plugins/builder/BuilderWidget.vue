<script lang="ts">
import { debounce, uid } from 'quasar';
import { Component, Watch } from 'vue-property-decorator';

import WidgetBase from '@/components/WidgetBase';
import { spliceById } from '@/helpers/functional';

import { calculateNormalizedFlows } from './calculateFlows';
import { defaultLayoutHeight, defaultLayoutWidth, deprecatedTypes } from './getters';
import { asPersistentPart, asStatePart, squares } from './helpers';
import { builderStore } from './store';
import { BuilderConfig, BuilderLayout, FlowPart, PartUpdater, PersistentPart } from './types';

@Component
export default class BuilderWidget extends WidgetBase<BuilderConfig> {
  squares = squares;

  flowParts: FlowPart[] = [];
  debouncedCalculate: Function = () => { };

  @Watch('layout')
  watchLayout(): void {
    this.debouncedCalculate();
  }

  created(): void {
    this.migrate();
    this.debouncedCalculate = debounce(this.calculate, 200, false);
    this.debouncedCalculate();
  }

  get allLayouts(): BuilderLayout[] {
    return builderStore.layouts;
  }

  get layoutIds(): string[] {
    return this.config.layoutIds ?? [];
  }

  get layouts(): BuilderLayout[] {
    return this.layoutIds
      .map(id => builderStore.layoutById(id))
      .filter(v => v !== null) as BuilderLayout[];
  }

  get layout(): BuilderLayout | null {
    return builderStore.layoutById(this.config.currentLayoutId);
  }

  isActive(layout: BuilderLayout): boolean {
    return this.layoutIds.includes(layout.id);
  }

  showLayout(layout: BuilderLayout | null): void {
    this.saveConfig({
      ...this.config,
      currentLayoutId: layout ? layout.id : null,
    });
  }

  selectLayout(layout: BuilderLayout, selected: boolean): void {
    const filtered = this.layoutIds.filter(v => v !== layout.id);
    this.config.layoutIds = selected
      ? [layout.id, ...filtered]
      : filtered;
    this.saveConfig(this.config);
  }

  get gridHeight(): number {
    return squares(this.layout?.height ?? 10);
  }

  get gridWidth(): number {
    return squares(this.layout?.width ?? 10);
  }

  startEditor(): void {
    if (!this.$dense) {
      this.$router.push(`/builder/${this.layout?.id ?? ''}`);
    }
  }

  get gridViewBox(): string {
    return [0, 0, this.gridWidth, this.gridHeight]
      .join(' ');
  }

  async saveParts(parts: PersistentPart[]): Promise<void> {
    if (!this.layout) {
      return;
    }

    // first set local value, to avoid jitters caused by the period between action and vueX refresh
    this.layout.parts = parts.map(asPersistentPart);
    await builderStore.saveLayout(this.layout);
    this.debouncedCalculate();
  }

  async savePart(part: PersistentPart): Promise<void> {
    await this.saveParts(spliceById(this.parts, part));
  }

  get parts(): PersistentPart[] {
    if (!this.layout) {
      return [];
    }
    const sizes: Mapped<number> = {};
    return this.layout.parts
      .map(part => {
        const actual: PersistentPart = {
          id: uid(),
          rotate: 0,
          settings: {},
          flipped: false,
          ...part,
          type: deprecatedTypes[part.type] ?? part.type,
        };
        const [sizeX, sizeY] = builderStore.spec(actual).size(actual);
        sizes[part.id] = sizeX * sizeY;
        return actual;
      })
      // Sort parts to render largest first
      // This improves clickability of overlapping parts
      .sort((a, b) => sizes[b.id] - sizes[a.id]);
  }

  get updater(): PartUpdater {
    return {
      updatePart: this.savePart,
    };
  }

  isClickable(part): boolean {
    return !!builderStore.spec(part).interactHandler;
  }

  interact(part: FlowPart): void {
    builderStore.spec(part).interactHandler?.(part, this.updater);
  }

  edit(part: FlowPart): void {
    if (!this.isClickable(part)) {
      this.startEditor();
    }
  }

  async calculate(): Promise<void> {
    await this.$nextTick();
    this.flowParts = calculateNormalizedFlows(this.parts.map(asStatePart));
  }

  async migrate(): Promise<void> {
    const oldParts: PersistentPart[] = (this.config as any).parts;
    if (oldParts) {
      const id = uid();
      await builderStore.createLayout({
        id,
        title: `${this.widget.title} layout`,
        width: defaultLayoutWidth,
        height: defaultLayoutHeight,
        parts: oldParts,
      });
      this.config.layoutIds.push(id);
      this.config.currentLayoutId = id;
      this.$delete(this.config, 'parts');
      this.saveConfig(this.config);
    }
  }
}
</script>

<template>
  <CardWrapper no-scroll v-bind="{context}">
    <template #toolbar>
      <component :is="toolbarComponent" :crud="crud">
        <ActionMenu icon="mdi-format-list-bulleted" dense round>
          <template #menus>
            <q-list>
              <q-select
                :value="layout"
                :options="allLayouts"
                label="Active layout"
                item-aligned
                option-label="title"
                option-value="id"
                @input="v => showLayout(v)"
              >
                <template #option="scope">
                  <q-item v-bind="scope.itemProps" v-on="scope.itemEvents">
                    <q-item-section>{{ scope.opt.title }}</q-item-section>
                    <q-item-section class="col-auto">
                      <q-btn
                        v-if="isActive(scope.opt)"
                        flat
                        round
                        icon="mdi-star"
                        color="amber"
                        @click.stop="selectLayout(scope.opt, false)"
                      />
                      <q-btn
                        v-else
                        flat
                        round
                        icon="mdi-star-outline"
                        @click.stop="selectLayout(scope.opt, true)"
                      />
                    </q-item-section>
                  </q-item>
                </template>
              </q-select>
              <ActionItem
                v-for="v in layouts"
                :key="v.id"
                :label="v.title"
                :active="layout && layout.id === v.id"
                no-close
                @click="showLayout(v)"
              />
            </q-list>
          </template>
        </ActionMenu>
        <template #actions>
          <ActionItem v-if="!$dense" icon="mdi-tools" label="Edit layout" @click="startEditor" />
        </template>
      </component>
    </template>

    <div class="fit" @dblclick="startEditor">
      <span v-if="parts.length === 0" class="absolute-center">
        {{ layout === null ? 'No layout selected' : 'Layout is empty' }}
      </span>
      <svg ref="grid" :viewBox="gridViewBox" class="fit q-pa-md">
        <g
          v-for="part in flowParts"
          :key="part.id"
          :transform="`translate(${squares(part.x)}, ${squares(part.y)})`"
          :class="{ pointer: isClickable(part), [part.type]: true }"
          @click="interact(part)"
          @dblclick.stop="edit(part)"
        >
          <PartWrapper :part="part" @update:part="savePart" @dirty="debouncedCalculate" />
        </g>
      </svg>
    </div>
  </CardWrapper>
</template>

<style lang="sass" scoped>
@import './grid.sass'
</style>
