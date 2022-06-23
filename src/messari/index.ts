import { MetricsService } from './metric-service';
import { MetricsResponse } from '../models/MetricResponse';
import { TagResponse } from '../models/TagResponse';
import { SectorResponse } from '../models/SectorResponse';
import { AggregateResponse } from '../models/AggregateResponse';
import { logger } from '../utils';

const metricsService: MetricsService = new MetricsService();

/**
 * Single asset metrics to for a given asset and the latest news associated with given asset
 */
export const getAssetBySymbol = async (symbol: string): Promise<MetricsResponse | undefined> => {
  try {
    return await metricsService.getCoinMetrics(symbol);
  } catch (err) {
    // @ts-ignore
    logger.error({ message: err.message });
    return undefined;
  }
};

/**
 * Aggregate metrics which takes in as query parameter for tags or sectors.
 * As examples: ?sectors=gaming or ?tags=defi,oracle
 * You can define multiple tags or sectors to aggregate.
 */
export const getAggregate = async (tags: string, sectors: string): Promise<AggregateResponse | undefined> => {
  const tags_parsed = tags === undefined ? undefined : tags.split(',').toLocaleString().toLowerCase();

  const sectors_parsed = sectors === undefined ? undefined : sectors.split(',').toLocaleString().toLowerCase();

  try {
    return await metricsService.getAggregateMetrics(tags_parsed, sectors_parsed);
  } catch (err) {
    // @ts-ignore
    logger.error({ message: err.message });
    return undefined;
  }
};

/**
 * Return all available tags
 */
export const getTags = async (): Promise<TagResponse | undefined> => {
  try {
    return await metricsService.getTags();
  } catch (erro) {
    // @ts-ignore
    logger.error({ message: err.message });
    return undefined;
  }
};

/**
 * Return all available sectors
 */
export const getSectors = async (): Promise<SectorResponse | undefined> => {
  try {
    return await metricsService.getSectors();
  } catch (err) {
    // @ts-ignore
    logger.error({ message: err.message });
    return undefined;
  }
};
