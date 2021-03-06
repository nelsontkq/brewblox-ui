<script lang="ts">
import mapValues from 'lodash/mapValues';
import UrlSafeString from 'url-safe-string';
import { Component } from 'vue-property-decorator';

import { dashboardIdRules } from '@/helpers/dashboards';
import { ruleValidator, suggestId } from '@/helpers/functional';
import { blockIdRules } from '@/plugins/spark/helpers';

import WizardTaskBase from '../components/WizardTaskBase';
import { withPrefix } from '../helpers';
import { RimsBlockNames, RimsConfig } from './types';


@Component
export default class RimsNamingTask extends WizardTaskBase<RimsConfig> {
  chosenNames: Partial<RimsBlockNames> = {};
  idGenerator = new UrlSafeString();

  get defaultNames(): RimsBlockNames {
    return {
      kettleSensor: 'Kettle Sensor',
      kettleSetpoint: 'Kettle Setpoint',
      kettlePid: 'Kettle PID',
      tubeSensor: 'Tube Sensor',
      tubeDriver: 'Tube Setpoint Driver',
      tubeSetpoint: 'Tube Setpoint',
      tubePid: 'Tube PID',
      tubePwm: 'Tube PWM',
      tubeAct: 'Tube Actuator',
      pumpAct: 'Pump Actuator',
    };
  }

  get serviceId(): string {
    return this.config.serviceId;
  }

  get prefix(): string {
    return this.config.prefix ?? 'RIMS';
  }

  set prefix(prefix: string) {
    this.updateConfig({ ...this.config, prefix });
  }

  get dashboardTitle(): string {
    return this.config.dashboardTitle ?? 'RIMS';
  }

  set dashboardTitle(dashboardTitle: string) {
    this.updateConfig({ ...this.config, dashboardTitle });
  }

  get dashboardId(): string {
    return this.config.dashboardId
      ?? suggestId(this.idGenerator.generate(this.dashboardTitle), ruleValidator(this.dashboardIdRules));
  }

  set dashboardId(dashboardId: string) {
    this.updateConfig({ ...this.config, dashboardId });
  }

  get dashboardIdRules(): InputRule[] {
    return dashboardIdRules();
  }

  get names(): RimsBlockNames {
    return {
      ...mapValues(this.defaultNames,
        v => suggestId(withPrefix(this.prefix, v), ruleValidator(blockIdRules(this.serviceId)))),
      ...this.chosenNames,
    };
  }

  get nameRules(): InputRule[] {
    return [
      ...blockIdRules(this.serviceId),
      v => Object.values(this.names)
        .filter(n => n === v).length < 2 || "Name can't be a duplicate",
    ];
  }

  get valuesOk(): boolean {
    return [
      this.dashboardTitle,
      ruleValidator(this.dashboardIdRules)(this.dashboardId),
      Object.values(this.names).every(ruleValidator(this.nameRules)),
    ]
      .every(Boolean);
  }

  updateName(key: string, val: string): void {
    this.$set(this.chosenNames, key, val.trim());
  }

  clearKey(key: string): void {
    this.$delete(this.config, key);
    this.updateConfig(this.config);
  }

  clearName(key: string): void {
    this.$delete(this.chosenNames, key);
  }

  taskDone(): void {
    this.updateConfig({
      ...this.config,
      prefix: this.prefix,
      dashboardId: new UrlSafeString().generate(this.dashboardTitle),
      dashboardTitle: this.dashboardTitle,
      names: this.names,
      widgets: [],
      createdBlocks: [],
      changedBlocks: [],
      renamedBlocks: {},
    });
    this.next();
  }
}
</script>

<template>
  <ActionCardBody>
    <q-card-section>
      <q-item class="text-weight-light">
        <q-item-section>
          <q-item-label class="text-subtitle1">
            Name your new dashboard and blocks
          </q-item-label>
        </q-item-section>
      </q-item>

      <!-- Generic settings -->
      <QuickStartNameField
        v-model="dashboardTitle"
        label="Dashboard name"
        @clear="clearKey('dashboardTitle')"
      >
        <template #help>
          The name for the new dashboard.
        </template>
      </QuickStartNameField>
      <QuickStartPrefixField
        v-model="prefix"
        @clear="clearKey('prefix')"
      />

      <!-- Block names -->
      <q-expansion-item label="Generated names" icon="mdi-tag-multiple" dense>
        <QuickStartNameField
          v-model="dashboardId"
          label="Dashboard ID"
          :rules="dashboardIdRules"
          @clear="clearKey('dashboardId')"
        >
          <template #help>
            The unique identifier for your dashboard.
            <br> By default, this is an URL-safe version of the dashboard title.
          </template>
        </QuickStartNameField>
        <QuickStartNameField
          v-for="(nVal, nKey) in names"
          :key="nKey"
          :value="nVal"
          :label="defaultNames[nKey]"
          :rules="nameRules"
          @clear="clearName(nKey)"
          @input="v => updateName(nKey, v)"
        />
      </q-expansion-item>
    </q-card-section>

    <template #actions>
      <q-btn unelevated label="Back" @click="back" />
      <q-space />
      <q-btn :disable="!valuesOk" unelevated label="Next" color="primary" @click="taskDone" />
    </template>
  </ActionCardBody>
</template>
