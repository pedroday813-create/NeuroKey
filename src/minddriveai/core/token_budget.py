from __future__ import annotations

from dataclasses import dataclass


@dataclass
class CostEstimate:
    input_cost: str
    output_cost: str
    total_cost: str


class CostCalculator:
    def estimate(
        self,
        input_tokens: int,
        output_tokens: int,
        price_per_million_input: float | None,
        price_per_million_output: float | None,
    ) -> CostEstimate:
        if price_per_million_input is None or price_per_million_output is None:
            return CostEstimate("não especificado", "não especificado", "não especificado")
        in_cost = (input_tokens / 1_000_000) * price_per_million_input
        out_cost = (output_tokens / 1_000_000) * price_per_million_output
        total = in_cost + out_cost
        return CostEstimate(f"{in_cost:.6f}", f"{out_cost:.6f}", f"{total:.6f}")
