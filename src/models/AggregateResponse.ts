import { MetricsResponse } from './MetricResponse';

export interface AggregateResponse {
  aggregate_type: string;
  aggregate_market_cap: number;
  aggregate_volume_last_24_hours: number;
  marketcap_dominance_vs_global_percent: number;
  volume_dominance_vs_global_percent: number;
  coins: MetricsResponse[];
}
