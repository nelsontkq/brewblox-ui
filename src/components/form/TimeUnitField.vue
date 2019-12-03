<script lang="ts">
import { Component, Emit, Prop } from 'vue-property-decorator';

import FieldBase from '@/components/FieldBase';
import { createDialog } from '@/helpers/dialog';
import { Unit } from '@/helpers/units';

@Component
export default class TimeUnitField extends FieldBase {

  @Prop({ type: Object, required: true, validator: v => v instanceof Unit })
  public readonly value!: Unit;

  @Prop({ type: String, default: 'duration' })
  public readonly label!: string;

  @Emit('input')
  public change(v: Unit): Unit {
    return v;
  }

  openDialog(): void {
    if (this.readonly) {
      return;
    }

    createDialog({
      component: 'TimeUnitDialog',
      title: this.title,
      message: this.message,
      html: this.html,
      parent: this,
      value: this.value,
      label: this.label,
      rules: this.rules,
    })
      .onOk(this.change);
  }
}
</script>

<template>
  <LabeledField v-bind="{...$attrs, ...$props}" @click="openDialog">
    <slot name="value">
      {{ value | unitDuration }}
    </slot>
  </LabeledField>
</template>