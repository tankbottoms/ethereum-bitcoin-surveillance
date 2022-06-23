import Web3 from 'web3';
import { ETH_URI } from '../config';

export class EventData {
  constructor(
    public readonly returnValues: any,
    public readonly event: string,
    public readonly signature: string,
    public readonly txHash: string,
    public readonly address: string,
    public readonly block: number,
  ) {}
}

export interface EventHandlingResult {
  readonly block: number;
  readonly address: string;
  readonly txHash: string;
  readonly result?: any;
  readonly error?: any;
}

export type EventHandler = (data: EventData) => Promise<any>;

export class EventReader {
  private _web3: Web3 | undefined = undefined;

  constructor(web3Provider: string) {
    this._web3 = new Web3(web3Provider);
  }

  get web3() {
    return this._web3;
  }

  async read(
    contractAddress: string,
    contractAbi: any,
    eventName: string,
    handler: EventHandler,
    fromBlock?: number,
    toBlock?: number,
  ): Promise<EventHandlingResult[]> {
    return new Promise((resolve, reject) => {
      if (this._web3 === undefined) {
        reject('Web3 provider unset!');
      } else {
        // Get contract instance
        const contract = new this._web3.eth.Contract(contractAbi, contractAddress, {
          from: '', // from address not required when calling getPastEvents method
          data: '',
        });
        contract
          .getPastEvents('allEvents', {
            fromBlock: fromBlock ? fromBlock : 0,
            toBlock: toBlock ? toBlock : 'latest',
          })
          .then(events => {
            const handlingPromises: Promise<EventHandlingResult>[] = [];
            for (const evt of events) {
              if (evt.event === eventName) {
                handlingPromises.push(
                  handler(
                    new EventData(
                      evt.returnValues,
                      eventName,
                      evt.signature.toLocaleLowerCase(),
                      evt.transactionHash.toLowerCase(),
                      evt.address.toLocaleLowerCase(),
                      evt.blockNumber,
                    ),
                  )
                    .then(
                      v =>
                        <EventHandlingResult>{
                          block: evt.blockNumber,
                          address: evt.address.toLocaleLowerCase(),
                          txHash: evt.transactionHash.toLocaleLowerCase(),
                          result: v,
                        },
                    )
                    .catch(
                      err =>
                        <EventHandlingResult>{
                          block: evt.blockNumber,
                          address: evt.address.toLocaleLowerCase(),
                          txHash: evt.transactionHash.toLocaleLowerCase(),
                          error: err,
                        },
                    ),
                );
              }
            }

            Promise.all(handlingPromises.values())
              .then(handlingResults => {
                resolve(handlingResults);
              })
              .catch(err => {
                reject(`Error in promises union: ${err.toString()}`);
              });
          })
          .catch(err => {
            reject(`Error in calling contract.getPastEvents('${eventName}'): ${err.toString()}`);
          });
      }
    });
  }
}
