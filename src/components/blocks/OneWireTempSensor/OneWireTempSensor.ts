import Component from 'vue-class-component';

import BlockComponent from '../BlockComponent';

import { getById } from '../../../store/blocks/OneWireTempSensor/getters';
import { persist } from '../../../store/blocks/OneWireTempSensor/actions';

@Component({
  props: {
  id: {
  default: '',
  type: String,
  },
  },
  })
export default class OneWireTempSensor extends BlockComponent {
  addressInput = '';
  offsetInput = 0;

  get blockData() {
    return getById(this.$props.id);
  }

  get settings() {
    return this.blockData.settings;
  }

  get state() {
    return this.blockData.state;
  }

  get loading() {
    return !!this.blockData.isLoading;
  }

  get changed() {
    return this.settings.address !== this.addressInput || this.settings.offset !== this.offsetInput;
  }

  mounted() {
    // set default values
    this.addressInput = this.settings.address;
    this.offsetInput = this.settings.offset;
  }

  save() {
    const settings: { address?: string, offset?: number } = {};

    if (this.addressInput !== this.settings.address) {
      settings.address = this.addressInput;
    }

    if (this.offsetInput !== this.settings.offset) {
      settings.offset = this.offsetInput;
    }

    persist({
      settings,
      id: this.$props.id,
    });
  }
}
