<script lang="ts">
import { uid } from 'quasar';
import { Component, Prop } from 'vue-property-decorator';

import CrudComponent from '@/components/CrudComponent';
import { createDialog } from '@/helpers/dialog';
import { filterById, spliceById } from '@/helpers/functional';
import { deepCopy } from '@/helpers/units/parseObject';
import { deserialize, serialize } from '@/helpers/units/parseObject';
import { sparkStore } from '@/plugins/spark/store';
import { BlockAddress } from '@/plugins/spark/types';

import QuickActionChange from './QuickActionChange.vue';
import { BlockChange, QuickActionsConfig, Step } from './types';

@Component({
  components: {
    QuickActionChange,
  },
})
export default class QuickActionsFull extends CrudComponent<QuickActionsConfig> {
  draggingStep = false;
  editableChanges: Mapped<boolean> = {};

  @Prop({ type: String })
  readonly openStep!: string;

  get defaultServiceId(): string | null {
    return this.config.serviceId ?? null;
  }

  get steps(): Step[] {
    return deserialize(this.config.steps);
  }

  saveSteps(steps: Step[] = this.steps): void {
    this.config.steps = serialize(steps);
    this.saveConfig();
  }

  saveStep(step: Step): void {
    spliceById(this.steps, step);
    this.saveSteps();
  }

  addStep(): void {
    const stepName = 'New Step';
    createDialog({
      title: 'Add a Step',
      cancel: true,
      prompt: {
        model: stepName,
        type: 'text',
      },
    })
      .onOk(name => {
        this.steps.push({ name, id: uid(), changes: [] });
        this.saveSteps();
      });
  }

  duplicateStep(step: Step): void {
    this.steps.push({
      id: uid(),
      name: `${step.name} (copy)`,
      changes: step.changes.map(change => ({ ...deepCopy(change), id: uid() })),
    });
    this.saveSteps();
  }

  renameStep(step: Step): void {
    const stepName = step.name;
    createDialog({
      title: 'Change Step name',
      message: `Choose a new name for '${step.name}'`,
      cancel: true,
      prompt: {
        model: stepName,
        type: 'text',
      },
    })
      .onOk(newName => {
        if (newName !== stepName) {
          step.name = newName;
          this.saveStep(step);
        }
      });
  }

  startRemoveStep(step: Step): void {
    createDialog({
      title: 'Remove Step',
      message: `Are you sure you want to remove ${step.name}?`,
      ok: 'Confirm',
      cancel: 'Cancel',
    })
      .onOk(() => this.saveSteps(filterById(this.steps, step)));
  }

  startAddChange(step: Step): void {
    createDialog({
      component: 'BlockAddressDialog',
      title: 'Choose a Block',
      value: {
        id: null,
        serviceId: this.defaultServiceId,
        type: null,
      },
      anyService: true,
      clearable: false,
      blockFilter: block => {
        const spec = sparkStore.spec(block);
        return !!spec && spec.changes.length > 0;
      },
      parent: this,
    })
      .onOk((addr: BlockAddress) => {
        if (!addr || !addr.id) { return; }
        step.changes.push({
          id: uid(),
          blockId: addr.id,
          serviceId: addr.serviceId,
          data: {},
          confirmed: {},
        });
        this.saveStep(step);
      });
  }

  saveChanges(step: Step, changes: BlockChange[]): void {
    step.changes = changes;
    this.saveStep(step);
  }

  saveChange(step: Step, change: BlockChange): void {
    spliceById(step.changes, change);
    this.saveStep(step);
  }

  removeChange(step: Step, change: BlockChange): void {
    spliceById(step.changes, change, false);
    this.saveStep(step);
  }

  startSwitchBlock(step: Step, change: BlockChange): void {
    const serviceId = change.serviceId ?? this.defaultServiceId;
    const currentBlock = sparkStore.blockById(serviceId, change.blockId);
    createDialog({
      component: 'BlockAddressDialog',
      parent: this,
      title: `Switch target block '${change.blockId}'`,
      value: currentBlock,
      anyService: true,
      blockFilter: block => currentBlock === null || block.type === currentBlock.type,
    })
      .onOk((addr: BlockAddress) => {
        change.blockId = addr.id;
        change.serviceId = addr.serviceId;
        this.saveChange(step, change);
      });
  }
}
</script>

<template>
  <div class="widget-lg">
    <slot name="warnings" />

    <div class="widget-body column">
      <draggable
        :disabled="$dense"
        :value="steps"
        @input="saveSteps"
        @start="draggingStep=true"
        @end="draggingStep=false"
      >
        <q-expansion-item
          v-for="step in steps"
          :key="step.id"
          :label="step.name"
          :default-opened="openStep === step.id"
          :disable="draggingStep"
          header-style="font-size: 120%"
          group="steps"
          icon="mdi-format-list-checks"
          class="step-container q-mr-md q-mb-sm depth-1"
        >
          <draggable :disabled="$dense" :value="step.changes" @input="v => saveChanges(step, v)">
            <QuickActionChange
              v-for="change in step.changes"
              :key="`change--${step.id}--${change.id}`"
              :default-service-id="defaultServiceId"
              :value="change"
              class="q-mr-sm q-my-xs"
              @input="saveChange(step, change)"
              @remove="removeChange(step, change)"
              @switch="startSwitchBlock(step, change)"
            />
          </draggable>
          <div class="row justify-end q-px-md q-py-sm step-actions">
            <q-btn
              size="sm"
              label="Add Block"
              icon="mdi-cube"
              flat
              @click="startAddChange(step)"
            />
            <q-btn
              size="sm"
              label="Copy"
              icon="file_copy"
              flat
              @click="duplicateStep(step)"
            />
            <q-btn
              size="sm"
              label="Rename"
              icon="edit"
              flat
              @click="renameStep(step)"
            />
            <q-btn
              size="sm"
              label="Remove"
              icon="delete"
              flat
              @click="startRemoveStep(step)"
            />
          </div>
        </q-expansion-item>
      </draggable>
      <q-item>
        <q-space />
        <q-item-section class="col-auto">
          <q-btn fab-mini color="secondary" icon="add" @click="addStep">
            <q-tooltip>Add Step</q-tooltip>
          </q-btn>
        </q-item-section>
      </q-item>
    </div>
  </div>
</template>

<style scoped>
.step-container:nth-child(odd) {
  border-left: 2px solid dodgerblue;
}
.step-container:nth-child(even) {
  border-left: 2px solid red;
}
</style>
