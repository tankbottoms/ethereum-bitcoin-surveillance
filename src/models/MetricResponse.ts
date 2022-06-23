export interface MetricsResponse {
  symbol: string;
  name: string;
  price_usd: number;
  volume_last_24_hours: number;
  current_marketcap_usd: number;
  latest_news_title?: string;
  latest_news_content?: string;
  tag?: string;
  sector?: string;
}
