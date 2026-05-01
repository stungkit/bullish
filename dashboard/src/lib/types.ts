export type Stock = {
	ticker: string;
	name: string;
	price: number;
	ath: number;
	market_cap: number;
	sector: string;
	pct_from_ath: number;
	change_1d: number;
	streak: number;
	rsi: number;
	roc_30d: number;
	rs_vs_qqq: number;
	vol_surge: number;
	pct_vs_50dma: number;
	is_52w_high: boolean | number;
	signal: string;
	ai_assessment: string;
	fair_value: number;
	upside: number;
	rating: string;
	fv_vs_ath: number;
	roc_1d: number;
	roc_1w: number;
	roc_1m: number;
	roc_3m: number;
	roc_6m: number;
	roc_ytd: number;
	roc_1y: number;
	roc_5y: number;
	roc_10y: number;
	buy_verdict: string;
};

export type ScanResult = {
	timestamp: string;
	qqq_30d_return: number;
	total_stocks: number;
	watchlist: Stock[];
	big_drops: Stock[];
	big_gains: Stock[];
	down_streaks: Stock[];
	up_streaks: Stock[];
	parabolic: Stock[];
	all_stocks: Stock[];
};

export type TabKey =
	| "watchlist"
	| "big_drops"
	| "big_gains"
	| "down_streaks"
	| "up_streaks"
	| "parabolic"
	| "top_performers";

export type Period =
	| "1d"
	| "1w"
	| "1m"
	| "3m"
	| "6m"
	| "ytd"
	| "1y"
	| "5y"
	| "10y";

export const PERIOD_FIELD: Record<Period, keyof Stock> = {
	"1d": "roc_1d",
	"1w": "roc_1w",
	"1m": "roc_1m",
	"3m": "roc_3m",
	"6m": "roc_6m",
	ytd: "roc_ytd",
	"1y": "roc_1y",
	"5y": "roc_5y",
	"10y": "roc_10y",
};

export type ColumnKey =
	| "ticker"
	| "name"
	| "price"
	| "ath"
	| "pct_from_ath"
	| "fair_value"
	| "upside"
	| "rating"
	| "rsi"
	| "change_1d"
	| "streak"
	| "roc_30d"
	| "period_return"
	| "buy_verdict";

export type ColumnDef = {
	key: ColumnKey;
	label: string;
	align: "left" | "right" | "center";
	tooltip?: string;
};
