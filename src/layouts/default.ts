import Vue from 'vue';
import Component from 'vue-class-component';

import byOrder from '@/core/byOrder';

import { allDashboards, isFetching } from '@/store/dashboards/getters';

@Component
class LayoutDefault extends Vue {
  leftDrawerOpen: boolean = false;

  get dashboards() {
    return [...allDashboards(this.$store)].sort(byOrder);
  }

  get isFetching() {
    return isFetching(this.$store);
  }

  toggleDrawer() {
    this.leftDrawerOpen = !this.leftDrawerOpen;
  }
}

export default LayoutDefault;