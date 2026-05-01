import { useMemo, useState } from "react";
import { ScanPicker } from "@/components/scan-picker";
import { StockTable } from "@/components/stock-table";
import { SummaryCards } from "@/components/summary-cards";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/cn";
import { TAB_CONFIG, TABS_WITH_AI } from "@/lib/format";
import {
	PERIOD_FIELD,
	type Period,
	type ScanResult,
	type Stock,
	type TabKey,
} from "@/lib/types";

type DashboardProps = {
	scans: ScanResult[];
};

const TAB_KEYS: TabKey[] = [
	"watchlist",
	"big_drops",
	"big_gains",
	"down_streaks",
	"up_streaks",
	"parabolic",
	"top_performers",
];

const PERIODS: { value: Period; label: string }[] = [
	{ value: "1d", label: "1D" },
	{ value: "1w", label: "1W" },
	{ value: "1m", label: "1M" },
	{ value: "3m", label: "3M" },
	{ value: "6m", label: "6M" },
	{ value: "ytd", label: "YTD" },
	{ value: "1y", label: "1Y" },
	{ value: "5y", label: "5Y" },
	{ value: "10y", label: "10Y" },
];

const TOP_N = 50;

export const Dashboard = ({ scans }: DashboardProps) => {
	const [scanIndex, setScanIndex] = useState(0);
	const [period, setPeriod] = useState<Period>("1m");
	const scan = scans[scanIndex];

	const topPerformers = useMemo<Stock[]>(() => {
		if (!scan?.all_stocks) return [];
		const field = PERIOD_FIELD[period];
		return [...scan.all_stocks]
			.sort((a, b) => (b[field] as number) - (a[field] as number))
			.slice(0, TOP_N);
	}, [scan, period]);

	if (!scan) {
		return (
			<div className="flex h-screen items-center justify-center text-text-tertiary">
				No scan data found. Run scan.py to generate data.
			</div>
		);
	}

	const tabCount = (key: TabKey): number => {
		if (key === "top_performers") return scan.all_stocks?.length ?? 0;
		return scan[key].length;
	};

	return (
		<div className="min-h-screen bg-background px-6 py-6">
			<header className="mb-6 flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold tracking-tight text-text-primary">
						Bullish
					</h1>
					<p className="text-sm text-text-tertiary">
						Momentum & mean-reversion scanner
					</p>
				</div>
				<ScanPicker
					timestamps={scans.map((s) => s.timestamp)}
					selected={scanIndex}
					onSelect={setScanIndex}
				/>
			</header>

			<section className="mb-6">
				<SummaryCards scan={scan} />
			</section>

			<Tabs defaultValue="watchlist">
				<TabsList>
					{TAB_KEYS.map((key) => (
						<TabsTrigger key={key} value={key}>
							{TAB_CONFIG[key].label}
							<span className="ml-1.5 text-text-tertiary">{tabCount(key)}</span>
						</TabsTrigger>
					))}
				</TabsList>

				{TAB_KEYS.map((key) => {
					if (key === "top_performers") {
						return (
							<TabsContent key={key} value={key}>
								<div className="mb-3 flex items-center gap-1.5">
									{PERIODS.map((p) => (
										<button
											key={p.value}
											type="button"
											onClick={() => setPeriod(p.value)}
											className={cn(
												"rounded-md px-3 py-1 text-xs font-semibold transition-colors",
												period === p.value
													? "bg-white/10 text-text-primary"
													: "text-text-tertiary hover:bg-white/5 hover:text-text-secondary",
											)}
										>
											{p.label}
										</button>
									))}
									<span className="ml-auto text-xs text-text-tertiary">
										Top {Math.min(TOP_N, topPerformers.length)} of{" "}
										{scan.all_stocks?.length ?? 0}
									</span>
								</div>
								<StockTable
									stocks={topPerformers}
									columns={TAB_CONFIG[key].columns}
									showAI={false}
									period={period}
								/>
							</TabsContent>
						);
					}

					return (
						<TabsContent key={key} value={key}>
							<StockTable
								stocks={scan[key]}
								columns={TAB_CONFIG[key].columns}
								showAI={TABS_WITH_AI.includes(key)}
							/>
						</TabsContent>
					);
				})}
			</Tabs>
		</div>
	);
};
