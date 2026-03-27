from minddriveai.core.token_budget import CostCalculator


def test_cost_non_specified() -> None:
    calc = CostCalculator()
    cost = calc.estimate(1000, 500, None, None)
    assert cost.total_cost == "não especificado"
