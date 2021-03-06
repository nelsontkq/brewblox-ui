<script lang="ts">
import { Component, Prop } from 'vue-property-decorator';

import { createDialog } from '@/helpers/dialog';
import { mutate } from '@/helpers/functional';
import { Link } from '@/helpers/units';
import { blockTypes, MotorValveBlock } from '@/plugins/spark/block-types';
import { Block, DigitalState, IoChannel, IoPin } from '@/plugins/spark/types';

import BlockCrudComponent from '../BlockCrudComponent';

interface EditableChannel extends IoChannel {
  id: number;
  driver: MotorValveBlock | null;
}

interface ValveArrayBlock extends Block {
  data: {
    pins: IoPin[];
  };
}

const valveType = blockTypes.MotorValve;

@Component
export default class ValveArray extends BlockCrudComponent {
  readonly block!: ValveArrayBlock;

  @Prop({ type: Object, required: true })
  public readonly idEnum!: any;

  @Prop({ type: Object, required: true })
  public readonly nameEnum!: any;

  get claimedChannels(): { [channel: number]: string } {
    return this.sparkModule
      .blocks
      .filter(block => block.type === valveType && block.data.hwDevice.id === this.block.id)
      .reduce((acc, block: MotorValveBlock) => mutate(acc, block.data.startChannel, block.id), {});
  }

  get channels(): EditableChannel[] {
    return this.block.data.pins
      .reduce(
        (acc: EditableChannel[], pin: IoPin, idx: number) => {
          const id = idx + 1;
          if (!this.nameEnum || this.nameEnum[id] !== undefined) {
            const driverId = this.claimedChannels[id];
            const driver = this.sparkModule.blockById(driverId);
            acc.push({ ...pin[this.idEnum[id]], id, driver });
          }
          return acc;
        },
        []
      )
      .reverse();
  }

  saveChannels(): void {
    this.block.data.pins = this.channels
      .map(channel => {
        const { id, state, config } = channel;
        return { [this.idEnum[id]]: { state, config } };
      });
    this.saveBlock();
  }

  channelName(channel): string {
    return this.nameEnum[channel.id];
  }

  driverLink(channel: EditableChannel): Link {
    return new Link(channel.driver?.id ?? null, valveType);
  }

  driverDriven(block: Block): boolean {
    return this.sparkModule
      .drivenChains
      .some((chain: string[]) => chain[0] === block.id);
  }

  driverLimitedBy(block: Block): string {
    return this.sparkModule
      .limiters[block.id]
      ?.join(', ')
      ?? '';
  }

  async saveDriver(channel: EditableChannel, link: Link): Promise<void> {
    if (channel.driver && channel.driver.id === link.id) {
      return;
    }
    if (channel.driver) {
      channel.driver.data.startChannel = 0;
      await this.sparkModule.saveBlock(channel.driver);
    }
    if (link.id) {
      const newDriver = this.sparkModule.blockById<MotorValveBlock>(link.id)!;
      newDriver.data.hwDevice = new Link(this.blockId, this.block.type);
      newDriver.data.startChannel = channel.id;
      await this.sparkModule.saveBlock(newDriver);
    }
  }

  async saveState(channel: EditableChannel, state: DigitalState): Promise<void> {
    if (channel.driver) {
      channel.driver.data.desiredState = state;
      await this.sparkModule.saveBlock(channel.driver);
    }
  }

  createActuator(channel: EditableChannel): void {
    createDialog({
      component: 'BlockWizardDialog',
      parent: this,
      serviceId: this.serviceId,
      initialFeature: valveType,
    })
      .onOk(block => {
        if (block.type === valveType) {
          this.saveDriver(channel, new Link(block.id, valveType));
        }
      });
  }
}
</script>

<template>
  <div class="widget-body column">
    <div
      v-for="channel in channels"
      :key="channel.id"
      class="col row q-gutter-x-sm q-gutter-y-xs q-mt-none items-stretch justify-start"
    >
      <div class="col-auto q-pt-sm self-baseline text-h6 min-width-sm">
        {{ channelName(channel) }}
      </div>
      <div class="col-auto row items-baseline min-width-sm">
        <DigitalStateButton
          v-if="channel.driver"
          :disable="driverDriven(channel.driver)"
          :value="channel.driver.data.desiredState"
          :pending="channel.driver.data.state !== channel.driver.data.desiredState"
          :pending-reason="driverLimitedBy(channel.driver)"
          class="col-auto self-center"
          @input="v => saveState(channel, v)"
        />
        <div v-else class="darkened text-italic q-pa-sm">
          Not set
        </div>
      </div>
      <LinkField
        :value="driverLink(channel)"
        :service-id="serviceId"
        title="Driver"
        label="Driver"
        dense
        class="col-grow"
        @input="link => saveDriver(channel, link)"
      />
    </div>
  </div>
</template>
