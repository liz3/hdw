import { NdTraffic, GenericDataListenerSync } from '@flybywiresim/fbw-sdk';
import { BasePublisher, EventBus } from '@microsoft/msfs-sdk';

class TcasTrafficPublisher{
  private readonly events: GenericDataListenerSync[] = [];

  constructor(bus: EventBus){
    this.traffic = [];
    this.events.push(
      new GenericDataListenerSync((ev, data: NdTraffic[]) => {
        this.traffic = data.filter(e => e.trafficData);
      }, 'A32NX_TCAS_TRAFFIC'),
    );
  }
};
let instance = null;
export const getInstance = (bus: EventBus) => {
  if(!instance)
    instance = new TcasTrafficPublisher(bus);
  return instance;
}
