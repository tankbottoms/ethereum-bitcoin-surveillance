/* eslint-disable no-shadow */
/* eslint-disable import/no-unresolved */
import Web3 from 'web3';
import { logger } from '../utils';
import { WebsocketProvider, provider } from '../../node_modules/web3-core/types';
import { Web3ProviderLike } from '../types';
import { INFURA_HTTPS, INFURA_WS, ARGENT_WALLET } from '../config';
import { Mongo } from '../mongodb';

export enum Web3ProviderType {
  Parity = 'Parity',
  GethHttp = 'GethHttp',
  GethWs = 'GethWs',
  InfuraHttp = 'InfuraHttp',
  InfuraWs = 'InfuraWs',
}

export class Web3Helper {
  private static instance: Web3Helper;
  private static usingSockets: boolean = false;
  private static web3: Web3;

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  constructor() {}

  public static initialize = (): Web3Helper => {
    if (!Web3Helper.instance) return (Web3Helper.instance = new Web3Helper());
    return Web3Helper.instance;
  };

  public static connectWeb3 = (type: Web3ProviderType, host?: string, port?: number): Web3 | undefined => {
    Web3Helper.initialize();
    switch (type) {
      case 'Parity':
        if (host === undefined || port === undefined) return undefined;
        Web3Helper.web3 = new Web3(new Web3.providers.HttpProvider(`http://${host}:${port}`));
        break;
      case 'GethHttp':
        if (host === undefined || port === undefined) return undefined;
        Web3Helper.web3 = new Web3(new Web3.providers.HttpProvider(`http://${host}:${port}`));
        break;
      case 'GethWs':
        Web3Helper.web3 = new Web3(new Web3.providers.WebsocketProvider(`wss://${host}:${port}`));
        break;
      case 'InfuraHttp':
        Web3Helper.web3 = new Web3(new Web3.providers.HttpProvider(INFURA_HTTPS));
        break;
      case 'InfuraWs':
        Web3Helper.web3 = new Web3(new Web3.providers.WebsocketProvider(INFURA_WS));
        Web3Helper.usingSockets = true;
        break;
      default:
        logger.error('Node not supported');
        return undefined;
    }
    return Web3Helper.web3;
  };

  public static isSocketProvider = (): boolean => {
    return Web3Helper.usingSockets;
  };

  public static getHandle = (): Web3 => {
    Web3Helper.initialize();
    if (Web3Helper.web3 === undefined) {
      Web3Helper.connectWeb3(Web3ProviderType.InfuraHttp);
      return Web3Helper.web3;
    } else {
      return Web3Helper.web3;
    }
  };

  public static disconnectWeb3 = (): void => {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    (Web3Helper.web3.currentProvider as provider as WebsocketProvider)?.disconnect(
      1000,
      'Finished using the socket, bye.',
    );
  };
}
