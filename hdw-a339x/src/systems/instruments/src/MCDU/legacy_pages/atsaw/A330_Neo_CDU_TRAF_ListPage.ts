import { LegacyAtsuPageInterface } from '../../legacy/LegacyAtsuPageInterface';
import { getInstance as getTcasTrafficPublisher } from './common.ts';
import { Column, FormatTemplate } from '../../legacy/A320_Neo_CDU_Format';

let lastActiveNetwork = null;
export class CDUTrafListPage {
  static ShowPage(mcdu: LegacyAtsuPageInterface, page = 0) {
    const state = {
      showCallSigns: SimVar.GetSimVarValue('L:A339X_TRAFFIC_SELECTOR_DISPLAY_HIDE_CALLSIGN', 'number') === 0,
      currentActiveNetwork: SimVar.GetSimVarValue('L:A339X_TRAFFIC_SELECTOR_SOURCE', 'number'),
    };
    const selectedId = SimVar.GetSimVarValue('L:A339X_TRAFFIC_ACTIVE_ID', 'number');
    const instance = getTcasTrafficPublisher(mcdu.bus);
    const tcasEntries = instance.traffic.slice(page * 8, page * 8 + 8);
    const getRow = (idx) => {
      return [tcasEntries[idx], tcasEntries[idx + 4]]
        .map((ti, ri) => {
          if (ri) mcdu.onRightInput[idx] = () => {};
          else mcdu.onLeftInput[idx] = () => {};
          if (!ti) return undefined;
          const isSelected = selectedId === ti.ID;
          const spaces = ' '.repeat((isSelected ? 7 : 9 - ri) - ti.trafficData.callsign.length);
          const cs = isSelected ? `(${ti.trafficData.callsign})` : ti.trafficData.callsign;
          if (ri) {
            if (!isSelected) {
              mcdu.rightInputDelay[idx] = () => {
                return mcdu.getDelaySwitchPage();
              };
              mcdu.onRightInput[idx] = () => {
                SimVar.SetSimVarValue('L:A339X_TRAFFIC_ACTIVE_ID', 'number', ti.ID);
                CDUTrafListPage.ShowPage(mcdu, page);
              };
            }
            return new Column(
              23,
              `${cs}${spaces}${ti.trafficData.wtc}>`,
              Column.right,
              isSelected ? Column.cyan : Column.white,
            );
          }
          if (!isSelected) {
            mcdu.LeftInputDelay[idx] = () => {
              return mcdu.getDelaySwitchPage();
            };
            mcdu.obLeftInput[idx] = () => {
              SimVar.SetSimVarValue('L:A339X_TRAFFIC_ACTIVE_ID', 'number', ti.ID);
              CDUTrafListPage.ShowPage(mcdu, page);
            };
          }
          return new Column(0, `<${cs}${spaces}${ti.trafficData.wtc}`, isSelected ? Column.cyan : Column.white);
        })
        .filter((e) => e !== undefined);
    };
    mcdu.clearDisplay();
    mcdu.page.Current = mcdu.page.TrafListPage;
    mcdu.activeSystem = 'TRAF';
    mcdu.setTemplate(
      FormatTemplate([
        [
          new Column(7, 'TRAFFIC LIST'),
          new Column(23, `${page + 1}/${Math.floor(instance.traffic.length / 8) + 1}`, Column.small, Column.right),
        ],
        [],
        getRow(0),
        [],
        getRow(1),
        [],
        getRow(2),
        [],
        getRow(3),
        [],
        [],
        [new Column(0, '-----ADS-B DISPLAY-----')],
        [
          state.currentActiveNetwork === 0 ? new Column(1, 'TRAF OFF') : new Column(0, '*TRAF ON', Column.cyan),
          state.showCallSigns
            ? new Column(23, 'FLTID ON*', Column.cyan, Column.right)
            : new Column(22, 'FLTID OFF', Column.right),
        ],
      ]),
    );
    mcdu.rightInputDelay[5] = () => {
      return mcdu.getDelaySwitchPage();
    };
    mcdu.leftInputDelay[5] = () => {
      return mcdu.getDelaySwitchPage();
    };
    mcdu.onRightInput[5] = () => {
      SimVar.SetSimVarValue('L:A339X_TRAFFIC_SELECTOR_DISPLAY_HIDE_CALLSIGN', 'number', state.showCallSigns ? 1 : 0);
      CDUTrafListPage.ShowPage(mcdu, page);
    };
    mcdu.onLeftInput[5] = () => {
      if (state.currentActiveNetwork) {
        lastActiveNetwork = state.lastActiveNetwork;
        SimVar.SetSimVarValue('L:A339X_TRAFFIC_SELECTOR_SOURCE', 'number', 0);
      } else {
        const value = lastActiveNetwork || 1;
        SimVar.SetSimVarValue('L:A339X_TRAFFIC_SELECTOR_SOURCE', 'number', value);
      }
      CDUTrafListPage.ShowPage(mcdu, page);
    };
    mcdu.onNextPage = () => {
      const pages = Math.floor(instance.traffic.length / 8);
      const p = page >= pages ? pages : page + 1;
      clearTimeout(mcdu.SelfPtr);
      CDUTrafListPage.ShowPage(mcdu, p);
    };
    mcdu.onPrevPage = () => {
      const p = page > 0 ? page - 1 : 0;
      clearTimeout(mcdu.SelfPtr);
      CDUTrafListPage.ShowPage(mcdu, p);
    };
    mcdu.SelfPtr = setTimeout(() => {
      if (mcdu.page.Current === mcdu.page.TrafListPage) {
        const pages = Math.floor(instance.traffic.length / 8);
        const p = page > pages ? pages : page;
        CDUTrafListPage.ShowPage(mcdu, p);
      }
    }, mcdu.PageTimeout.Medium);
  }
}
