<script lang="ts">
import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';

import { ActuatorPwmBlock } from '@/plugins/spark/block-types';
import { sparkStore } from '@/plugins/spark/store';
import { BlockAddress } from '@/plugins/spark/types';

import { settingsAddress, squares, textTransformation } from '../helpers';
import { PersistentPart } from '../types';


@Component
export default class PwmValues extends Vue {
  squares = squares;

  @Prop({ type: Object, required: true })
  public readonly part!: PersistentPart;

  @Prop({ type: String, default: 'pwm' })
  public readonly settingsKey!: string;

  @Prop({ type: Boolean, default: false })
  public readonly noBorder!: boolean;

  @Prop({ type: Number, default: 0 })
  public readonly startX!: number;

  @Prop({ type: Number, default: 0 })
  public readonly startY!: number;

  get address(): BlockAddress {
    return settingsAddress(this.part, this.settingsKey);
  }

  get block(): ActuatorPwmBlock | null {
    const { serviceId, id } = this.address;
    return sparkStore.blockById(serviceId, id);
  }

  get isBroken(): boolean {
    return this.block == null
      && this.address.id !== null;
  }

  get pwmValue(): number | null {
    return this.block && this.block.data.enabled
      ? this.block.data.value
      : null;
  }

  get transform(): string {
    return textTransformation(this.part, [1, 1]);
  }
}
</script>

<template>
  <g>
    <g class="outline">
      <rect
        v-if="!noBorder"
        :width="squares(1)-2"
        :height="squares(1)-2"
        :x="squares(startX)+1"
        :y="squares(startY)+1"
        rx="6"
        ry="6"
        stroke-width="2px"
      />
    </g>
    <SvgEmbedded
      :x="squares(startX)"
      :y="squares(startY)"
      :transform="transform"
      :width="squares(1)"
      :height="squares(1)"
    >
      <BrokenIcon v-if="isBroken" />
      <UnlinkedIcon v-else-if="!block" />
      <SleepingIcon v-else-if="!block.data.enabled" />
      <template v-else>
        <PwmIcon />
        <div class="col text-bold">
          {{ pwmValue | truncateRound }}
          <small v-if="!!block">%</small>
        </div>
      </template>
    </SvgEmbedded>
  </g>
</template>
