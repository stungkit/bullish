import {
	ArrowDown,
	ArrowUp,
	ChevronDown,
	ChevronRight,
	ChevronsUpDown,
} from "lucide-react";
import { useMemo, useState } from "react";
import { AiBadge } from "@/components/ai-badge";
import { RsiGauge } from "@/components/rsi-gauge";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/cn";
import {
	formatPct,
	formatPrice,
	pctColor,
	ratingColor,
	ratingLabel,
	verdictBadgeClasses,
	verdictLabel,
} from "@/lib/format";
import {
	type ColumnDef,
	type ColumnKey,
	PERIOD_FIELD,
	type Period,
	type Stock,
} from "@/lib/types";

type StockTableProps = {
	stocks: Stock[];
	columns: ColumnDef[];
	showAI: boolean;
	period?: Period;
};

const alignClass = (align: string): string => {
	if (align === "right") return "text-right";
	if (align === "center") return "text-center";

	return "text-left";
};

const justifyClass = (align: string): string => {
	if (align === "right") return "justify-end";
	if (align === "center") return "justify-center";

	return "justify-start";
};

const RATING_RANK: Record<string, number> = {
	strong_buy: 5,
	buy: 4,
	hold: 3,
	sell: 2,
	strong_sell: 1,
};

const VERDICT_RANK: Record<string, number> = {
	good_buy: 4,
	neutral: 3,
	weak: 2,
	extended: 1,
	overheated: 0,
};

type SortDir = "asc" | "desc";

const sortValue = (
	stock: Stock,
	key: ColumnKey,
	period?: Period,
): number | string => {
	switch (key) {
		case "ticker":
			return stock.ticker.toLowerCase();
		case "name":
			return stock.name.toLowerCase();
		case "rating":
			return RATING_RANK[stock.rating?.toLowerCase()] ?? 0;
		case "buy_verdict":
			return VERDICT_RANK[stock.buy_verdict] ?? 0;
		case "period_return":
			return period ? (stock[PERIOD_FIELD[period]] as number) : 0;
		case "price":
			return stock.price;
		case "ath":
			return stock.ath;
		case "pct_from_ath":
			return stock.pct_from_ath;
		case "fair_value":
			return stock.fair_value;
		case "upside":
			return stock.upside;
		case "rsi":
			return stock.rsi;
		case "change_1d":
			return stock.change_1d;
		case "streak":
			return stock.streak;
		case "roc_30d":
			return stock.roc_30d;
		default:
			return 0;
	}
};

const cellContent = (
	stock: Stock,
	key: ColumnKey,
	period?: Period,
): React.ReactNode => {
	switch (key) {
		case "ticker":
			return (
				<span className="font-semibold tracking-wide">{stock.ticker}</span>
			);
		case "name":
			return (
				<span className="max-w-48 truncate text-text-secondary">
					{stock.name}
				</span>
			);
		case "price":
			return formatPrice(stock.price);
		case "ath":
			return formatPrice(stock.ath);
		case "pct_from_ath":
			return (
				<span className={pctColor(stock.pct_from_ath)}>
					{formatPct(stock.pct_from_ath)}
				</span>
			);
		case "fair_value":
			return stock.fair_value > 0 ? (
				formatPrice(stock.fair_value)
			) : (
				<span className="text-text-tertiary">—</span>
			);
		case "upside":
			return stock.fair_value > 0 ? (
				<span className={pctColor(stock.upside)}>
					{formatPct(stock.upside)}
				</span>
			) : (
				<span className="text-text-tertiary">—</span>
			);
		case "rating":
			return stock.rating ? (
				<span
					className={cn("text-xs font-semibold", ratingColor(stock.rating))}
				>
					{ratingLabel(stock.rating)}
				</span>
			) : (
				<span className="text-text-tertiary">—</span>
			);
		case "rsi":
			return <RsiGauge value={stock.rsi} />;
		case "change_1d":
			return (
				<span className={pctColor(stock.change_1d)}>
					{formatPct(stock.change_1d)}
				</span>
			);
		case "streak":
			return (
				<span className={pctColor(stock.streak)}>
					{stock.streak > 0 ? `+${stock.streak}` : stock.streak}
				</span>
			);
		case "roc_30d":
			return (
				<span className={pctColor(stock.roc_30d)}>
					{formatPct(stock.roc_30d)}
				</span>
			);
		case "period_return": {
			const value = period ? (stock[PERIOD_FIELD[period]] as number) : 0;
			return (
				<span className={cn("font-semibold", pctColor(value))}>
					{formatPct(value)}
				</span>
			);
		}
		case "buy_verdict":
			return (
				<span
					className={cn(
						"rounded-md px-2 py-0.5 text-xs font-semibold",
						verdictBadgeClasses(stock.buy_verdict),
					)}
				>
					{verdictLabel(stock.buy_verdict)}
				</span>
			);
		default:
			return null;
	}
};

export const StockTable = ({
	stocks,
	columns,
	showAI,
	period,
}: StockTableProps) => {
	const [expanded, setExpanded] = useState<Set<string>>(new Set());
	const [sortKey, setSortKey] = useState<ColumnKey | null>(null);
	const [sortDir, setSortDir] = useState<SortDir>("desc");

	const toggle = (ticker: string) => {
		setExpanded((prev) => {
			const next = new Set(prev);
			if (next.has(ticker)) next.delete(ticker);
			else next.add(ticker);

			return next;
		});
	};

	const cycleSort = (key: ColumnKey) => {
		if (sortKey !== key) {
			setSortKey(key);
			setSortDir("desc");
			return;
		}
		if (sortDir === "desc") {
			setSortDir("asc");
			return;
		}
		setSortKey(null);
		setSortDir("desc");
	};

	const sortedStocks = useMemo<Stock[]>(() => {
		if (!sortKey) return stocks;
		const dir = sortDir === "asc" ? 1 : -1;
		return [...stocks].sort((a, b) => {
			const va = sortValue(a, sortKey, period);
			const vb = sortValue(b, sortKey, period);
			if (va < vb) return -1 * dir;
			if (va > vb) return 1 * dir;

			return 0;
		});
	}, [stocks, sortKey, sortDir, period]);

	if (stocks.length === 0) {
		return (
			<div className="flex h-32 items-center justify-center text-text-tertiary">
				No stocks in this category
			</div>
		);
	}

	return (
		<Table>
			<TableHeader>
				<TableRow className="group/header border-white/10 hover:bg-transparent">
					{showAI && <TableHead className="w-8" />}
					{columns.map((col) => {
						const active = sortKey === col.key;
						const label = col.tooltip ? (
							<Tooltip content={col.tooltip}>{col.label}</Tooltip>
						) : (
							col.label
						);

						return (
							<TableHead key={col.key} className={alignClass(col.align)}>
								<button
									type="button"
									onClick={() => cycleSort(col.key)}
									className={cn(
										"inline-flex w-full items-center gap-1 transition-colors hover:text-text-primary",
										justifyClass(col.align),
										active ? "text-text-primary" : "",
									)}
								>
									{label}
									{active ? (
										sortDir === "desc" ? (
											<ArrowDown className="h-3 w-3" />
										) : (
											<ArrowUp className="h-3 w-3" />
										)
									) : (
										<ChevronsUpDown className="h-3 w-3 opacity-0 transition-opacity group-hover/header:opacity-40" />
									)}
								</button>
							</TableHead>
						);
					})}
				</TableRow>
			</TableHeader>
			<TableBody>
				{sortedStocks.map((stock) => {
					const hasAI = showAI && !!stock.ai_assessment;
					const isExpanded = expanded.has(stock.ticker);

					return (
						<>
							<TableRow key={stock.ticker}>
								{showAI && (
									<TableCell className="w-8 pr-0">
										{hasAI && (
											<button
												type="button"
												onClick={() => toggle(stock.ticker)}
												className="flex h-5 w-5 items-center justify-center rounded text-text-tertiary hover:text-text-primary"
											>
												{isExpanded ? (
													<ChevronDown className="h-3.5 w-3.5" />
												) : (
													<ChevronRight className="h-3.5 w-3.5" />
												)}
											</button>
										)}
									</TableCell>
								)}
								{columns.map((col) => (
									<TableCell key={col.key} className={alignClass(col.align)}>
										{cellContent(stock, col.key, period)}
									</TableCell>
								))}
							</TableRow>
							{hasAI && isExpanded && (
								<TableRow
									key={`${stock.ticker}-ai`}
									className="hover:bg-transparent"
								>
									<TableCell colSpan={columns.length + 1} className="px-6 py-3">
										<div className="flex items-start gap-3 rounded-lg bg-white/[0.02] px-4 py-3">
											<AiBadge assessment={stock.ai_assessment} />
											<p className="text-sm leading-relaxed text-text-secondary">
												{stock.ai_assessment}
											</p>
										</div>
									</TableCell>
								</TableRow>
							)}
						</>
					);
				})}
			</TableBody>
		</Table>
	);
};
