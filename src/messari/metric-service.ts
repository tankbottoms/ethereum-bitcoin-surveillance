import { APIService } from './service';
import { MetricsResponse } from '../models/MetricResponse';
import { AggregateResponse } from '../models/AggregateResponse';
import { TagResponse } from '../models/TagResponse';
import { SectorResponse } from '../models/SectorResponse';
import { logger } from '../utils/logger';
import {
  MESSARI_AGGREGATE_URL,
  MESSARI_COIN_METRIC_URL,
  MESSARI_COIN_NEWS_URL,
  AGGREGATE_MARKETCAP_LIMIT,
} from '../config';

const CACHE_TTL = 10 * 60 * 1000;

// eslint-disable-next-line no-shadow
enum AggregateType {
  ALL,
  TAG,
  SECTOR,
}

export class MetricsService extends APIService {
  rawAggregateResponseCache: any;
  cacheTimeStamp: Date;
  aggregateMetricsCache: AggregateResponse | undefined;

  constructor() {
    super();
    this.cacheTimeStamp = new Date();
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.populateCache();
  }

  private async populateCache() {
    if (!this.rawAggregateResponseCache || new Date().getTime() - this.cacheTimeStamp.getTime() > CACHE_TTL) {
      this.cacheTimeStamp = new Date();
      this.rawAggregateResponseCache = await super.get(MESSARI_AGGREGATE_URL);
      this.aggregateMetricsCache = this.aggregateBy(AggregateType.ALL, []);
      logger.debug('Cache populated.');
    }
  }

  public async getCoinMetrics(coin: string): Promise<MetricsResponse> {
    const rawResponse = await super.get(`${MESSARI_COIN_METRIC_URL}${coin}/metrics`);
    const rawNewsResponse = await super.get(`${MESSARI_COIN_NEWS_URL}${coin}`);

    const market_data = rawResponse.data.market_data;
    const marketcap_data = rawResponse.data.marketcap;

    let newsTitle;
    let newsContent;
    if (rawNewsResponse.data && rawNewsResponse.data[0]) {
      newsTitle = rawNewsResponse.data[0].title;
      newsContent = rawNewsResponse.data[0].content;
    }

    const metricsResponse: MetricsResponse = {
      symbol: rawResponse.data.symbol,
      name: rawResponse.data.name,
      price_usd: market_data.price_usd,
      volume_last_24_hours: market_data.volume_last_24_hours,
      current_marketcap_usd: marketcap_data.current_marketcap_usd,
      latest_news_title: newsTitle,
      latest_news_content: newsContent,
    };

    return metricsResponse;
  }

  public async getAggregateMetrics(tags: any, sectors: any): Promise<AggregateResponse> {
    await this.populateCache();

    if (tags) {
      return this.aggregateBy(AggregateType.TAG, tags);
    } else if (sectors) {
      return this.aggregateBy(AggregateType.SECTOR, sectors);
    } else {
      return this.aggregateBy(AggregateType.ALL, []);
    }
  }

  private aggregateBy(aggregateType: AggregateType, tagOrSectors: string[]): AggregateResponse {
    let aggregateMarketCap = 0;
    let aggregateVolume = 0;
    const metricsResponses: MetricsResponse[] = [];

    for (const coinData of this.rawAggregateResponseCache.data) {
      if (this.shouldAggregate(coinData, aggregateType, tagOrSectors)) {
        aggregateMarketCap += coinData.metrics.marketcap.current_marketcap_usd;
        aggregateVolume += coinData.metrics.market_data.volume_last_24_hours;

        const metricsResponse: MetricsResponse = {
          symbol: coinData.symbol,
          name: coinData.name,
          price_usd: coinData.metrics.market_data.price_usd,
          volume_last_24_hours: coinData.metrics.market_data.volume_last_24_hours,
          current_marketcap_usd: coinData.metrics.marketcap.current_marketcap_usd,
          tag: coinData.profile.tag,
          sector: coinData.profile.sector,
        };

        metricsResponses.push(metricsResponse);
      }
    }

    const aggregateResponse: AggregateResponse = {
      aggregate_type: `${AggregateType[aggregateType].toLowerCase()} - ${tagOrSectors.toString()}`,
      aggregate_market_cap: aggregateMarketCap,
      aggregate_volume_last_24_hours: aggregateVolume,
      marketcap_dominance_vs_global_percent:
        this.aggregateMetricsCache === undefined
          ? 0
          : (aggregateMarketCap / this.aggregateMetricsCache.aggregate_market_cap) * 100,
      volume_dominance_vs_global_percent:
        this.aggregateMetricsCache === undefined
          ? 0
          : (aggregateVolume / this.aggregateMetricsCache.aggregate_volume_last_24_hours) * 100,
      coins: metricsResponses,
    };

    return aggregateResponse;
  }

  private shouldAggregate(coinData: any, aggregateType: AggregateType, tagOrSectors: string[]) {
    if (
      aggregateType === AggregateType.ALL &&
      coinData.metrics.marketcap.current_marketcap_usd >= AGGREGATE_MARKETCAP_LIMIT
    ) {
      return true;
    }

    if (
      aggregateType === AggregateType.TAG &&
      coinData.profile.tag &&
      tagOrSectors.includes(coinData.profile.tag.toLowerCase())
    ) {
      return true;
    }

    if (
      aggregateType === AggregateType.SECTOR &&
      coinData.profile.sector &&
      tagOrSectors.includes(coinData.profile.sector.toLowerCase())
    ) {
      return true;
    }

    return false;
  }

  public async getTags(): Promise<TagResponse> {
    await this.populateCache();
    const tags: Set<string> = new Set();

    for (const coinData of this.rawAggregateResponseCache.data) {
      if (coinData.profile.tag && !tags.has(coinData.profile.tag)) {
        tags.add(coinData.profile.tag);
      }
    }

    const tagsResponse: TagResponse = {
      tags: Array.from(tags),
    };

    return tagsResponse;
  }

  public async getSectors(): Promise<SectorResponse> {
    await this.populateCache();
    const sectors: Set<string> = new Set();

    for (const coinData of this.rawAggregateResponseCache.data) {
      if (coinData.profile.sector && !sectors.has(coinData.profile.sector)) {
        sectors.add(coinData.profile.sector);
      }
    }

    const sectorsResponse: SectorResponse = {
      sectors: Array.from(sectors),
    };

    return sectorsResponse;
  }
}
