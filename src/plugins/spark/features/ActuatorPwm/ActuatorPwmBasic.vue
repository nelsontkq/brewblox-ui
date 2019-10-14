<script lang="ts">
import { Component } from 'vue-property-decorator';

import BlockCrudComponent from '../../components/BlockCrudComponent';
import { ActuatorPwmBlock } from './types';

@Component
export default class ActuatorPwmBasic extends BlockCrudComponent {
  readonly block!: ActuatorPwmBlock;

  get isConstrained(): boolean {
    return this.block.data.enabled
      && this.block.data.setting !== this.block.data.desiredSetting;
  }
}
</script>

<template>
  <q-card dark v-bind="$attrs">
    <slot name="toolbar" />
    <slot name="warnings" />

    <q-card-section>
      <q-item dark class="align-children">
        <q-item-section>
          <q-item-label caption>
            Setting
          </q-item-label>
          <div :class="{['text-orange']: isConstrained}">
            <SliderField
              :value="block.data.setting"
              :readonly="isDriven"
              style="display: inline-block"
              title="Duty Setting"
              tag="big"
              @input="v => { block.data.desiredSetting = v; saveBlock(); }"
            />
            <small
              v-if="block.data.setting !== null"
              style="display: inline-block"
              class="q-ml-xs"
            >%</small>
          </div>
        </q-item-section>

        <q-item-section>
          <q-item-label caption>
            Duty achieved
          </q-item-label>
          <div>
            <big>{{ block.data.value | round }}</big>
            <small class="q-ml-xs">%</small>
          </div>
        </q-item-section>

        <q-item-section>
          <template v-if="isConstrained">
            <q-item-label caption>
              Unconstrained setting
            </q-item-label>
            <div>
              <big>{{ block.data.desiredSetting | round }}</big>
              <small class="q-ml-xs">%</small>
            </div>
          </template>
        </q-item-section>
      </q-item>

      <q-item dark>
        <q-item-section>
          <DrivenIndicator :block-id="block.id" :service-id="serviceId" />
          <ConstraintsField
            :value="block.data.constrainedBy"
            :service-id="serviceId"
            type="analog"
            @input="v => { block.data.constrainedBy = v; saveBlock(); }"
          />
        </q-item-section>
      </q-item>
    </q-card-section>
  </q-card>
</template>