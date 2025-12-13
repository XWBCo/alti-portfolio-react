"""
Stress Testing API Examples
Demonstrates how to use the stress testing endpoints
"""

import requests
import json

# API Base URL
API_URL = "http://127.0.0.1:8001"

# Sample portfolio (AlTi-style portfolio)
SAMPLE_PORTFOLIO = {
    "Asset_1": 0.15,  # US Equity
    "Asset_2": 0.12,  # Intl Equity
    "Asset_3": 0.08,  # EM Equity
    "Asset_4": 0.20,  # US Bonds
    "Asset_5": 0.10,  # Credit
    "Asset_6": 0.10,  # Real Estate
    "Asset_7": 0.08,  # Commodities
    "Asset_8": 0.05,  # Gold
    "Asset_9": 0.07,  # Private Equity
    "Asset_10": 0.05,  # Hedge Funds
}

# Sample benchmark (60/40 portfolio)
SAMPLE_BENCHMARK = {
    "Asset_1": 0.35,  # US Equity
    "Asset_2": 0.15,  # Intl Equity
    "Asset_3": 0.10,  # EM Equity
    "Asset_4": 0.30,  # US Bonds
    "Asset_5": 0.10,  # Credit
}


def example_1_get_available_scenarios():
    """Example 1: Get list of available historical scenarios."""
    print("\n" + "="*80)
    print("EXAMPLE 1: Get Available Historical Scenarios")
    print("="*80)

    response = requests.get(f"{API_URL}/api/stress/scenarios")
    data = response.json()

    if data["success"]:
        print(f"\n✓ Found {data['data']['count']} historical scenarios:\n")
        for scenario in data["data"]["scenarios"]:
            print(f"  • {scenario['name']}")
            print(f"    Type: {scenario['type']}")
            print(f"    Period: {scenario['start']} to {scenario['end']}")
            print(f"    Description: {scenario['description']}\n")
    else:
        print(f"✗ Error: {data.get('error')}")

    return data


def example_2_apply_historical_scenarios():
    """Example 2: Apply historical stress scenarios to portfolio."""
    print("\n" + "="*80)
    print("EXAMPLE 2: Apply Historical Stress Scenarios")
    print("="*80)

    payload = {
        "portfolio": SAMPLE_PORTFOLIO,
        "benchmark": SAMPLE_BENCHMARK,
        "use_default_scenarios": True
    }

    response = requests.post(
        f"{API_URL}/api/stress/apply",
        json=payload
    )
    data = response.json()

    if data["success"]:
        summary = data["data"]["summary"]
        print("\n✓ Stress Test Summary:")
        print(f"  • Scenarios analyzed: {summary['scenarios_analyzed']}")
        print(f"  • Average return: {summary['average_return']:.2f}%")
        print(f"  • Worst return: {summary['worst_return']:.2f}%")
        print(f"  • Best return: {summary['best_return']:.2f}%")
        print(f"  • Average max drawdown: {summary['average_max_drawdown']:.2f}%")

        print("\n  Worst 5 Scenarios:")
        for i, scenario in enumerate(data["data"]["worst_scenarios"][:5], 1):
            print(f"\n  {i}. {scenario['scenario']}")
            print(f"     Portfolio Return: {scenario['total_return']:.2f}%")
            print(f"     Max Drawdown: {scenario['max_drawdown']:.2f}%")
            print(f"     Volatility: {scenario['volatility']:.2f}%")
            if "benchmark_return" in scenario:
                print(f"     Benchmark Return: {scenario['benchmark_return']:.2f}%")
                print(f"     Excess Return: {scenario['excess_return']:.2f}%")
    else:
        print(f"✗ Error: {data.get('error')}")

    return data


def example_3_custom_scenario():
    """Example 3: Create and apply a custom shock scenario."""
    print("\n" + "="*80)
    print("EXAMPLE 3: Apply Custom Shock Scenario")
    print("="*80)

    # Define custom shocks (2008-style crisis)
    custom_shocks = {
        "Asset_1": -0.35,   # US Equity down 35%
        "Asset_2": -0.40,   # Intl Equity down 40%
        "Asset_3": -0.45,   # EM Equity down 45%
        "Asset_4": 0.08,    # US Bonds up 8%
        "Asset_5": -0.20,   # Credit down 20%
        "Asset_6": -0.30,   # Real Estate down 30%
        "Asset_7": -0.15,   # Commodities down 15%
        "Asset_8": 0.15,    # Gold up 15%
        "Asset_9": -0.40,   # Private Equity down 40%
        "Asset_10": -0.15,  # Hedge Funds down 15%
    }

    payload = {
        "portfolio": SAMPLE_PORTFOLIO,
        "benchmark": SAMPLE_BENCHMARK,
        "scenario_name": "Custom 2008-Style Crisis",
        "shock_magnitudes": custom_shocks
    }

    response = requests.post(
        f"{API_URL}/api/stress/custom",
        json=payload
    )
    data = response.json()

    if data["success"]:
        result = data["data"]
        print("\n✓ Custom Scenario Results:")
        print(f"  • Scenario: {result['scenario_name']}")
        print(f"  • Portfolio Impact: {result['direct_impact']:.2f}%")
        print(f"  • Assets Affected: {result['assets_affected']}/{result['total_assets']}")
        if "benchmark_impact" in result:
            print(f"  • Benchmark Impact: {result['benchmark_impact']:.2f}%")
            print(f"  • Excess Impact: {result['excess_impact']:.2f}%")
    else:
        print(f"✗ Error: {data.get('error')}")

    return data


def example_4_hypothetical_scenario():
    """Example 4: Generate and apply hypothetical scenario."""
    print("\n" + "="*80)
    print("EXAMPLE 4: Apply Hypothetical Stress Scenario")
    print("="*80)

    scenario_types = [
        "mild_recession",
        "severe_recession",
        "inflation_surge",
        "market_rally"
    ]

    for scenario_type in scenario_types:
        payload = {
            "portfolio": SAMPLE_PORTFOLIO,
            "benchmark": SAMPLE_BENCHMARK,
            "scenario_type": scenario_type
        }

        response = requests.post(
            f"{API_URL}/api/stress/hypothetical",
            json=payload
        )
        data = response.json()

        if data["success"]:
            result = data["data"]
            print(f"\n  ✓ {scenario_type.replace('_', ' ').title()}:")
            print(f"    Portfolio Impact: {result['direct_impact']:.2f}%")
            if "benchmark_impact" in result:
                print(f"    Benchmark Impact: {result['benchmark_impact']:.2f}%")
                print(f"    Excess Impact: {result['excess_impact']:.2f}%")
        else:
            print(f"  ✗ Error for {scenario_type}: {data.get('error')}")


def example_5_stress_contribution():
    """Example 5: Calculate asset-level stress contributions."""
    print("\n" + "="*80)
    print("EXAMPLE 5: Asset-Level Stress Contributions")
    print("="*80)

    # Analyze COVID crisis period
    payload = {
        "portfolio": SAMPLE_PORTFOLIO,
        "scenario_start": "2020-02-01",
        "scenario_end": "2020-03-31"
    }

    response = requests.post(
        f"{API_URL}/api/stress/contribution",
        json=payload
    )
    data = response.json()

    if data["success"]:
        print("\n✓ Asset Contributions during COVID Crisis (Feb-Mar 2020):\n")
        print(f"  {'Asset':<12} {'Weight':<10} {'Return':<12} {'Vol':<12} {'Drawdown':<12}")
        print("  " + "-"*70)

        for contrib in data["data"][:10]:  # Top 10
            print(f"  {contrib['asset']:<12} "
                  f"{contrib['weight']:>8.2f}% "
                  f"{contrib['return_contribution']:>10.2f}% "
                  f"{contrib['volatility_contribution']:>10.2f}% "
                  f"{contrib['drawdown_contribution']:>10.2f}%")
    else:
        print(f"✗ Error: {data.get('error')}")

    return data


def example_6_compare_portfolios():
    """Example 6: Compare multiple portfolio allocations under stress."""
    print("\n" + "="*80)
    print("EXAMPLE 6: Compare Portfolio Allocations Under Stress")
    print("="*80)

    portfolios = {
        "Conservative (30/70)": {
            "Asset_1": 0.15,
            "Asset_2": 0.10,
            "Asset_3": 0.05,
            "Asset_4": 0.40,
            "Asset_5": 0.20,
            "Asset_8": 0.10,
        },
        "Moderate (60/40)": {
            "Asset_1": 0.35,
            "Asset_2": 0.15,
            "Asset_3": 0.10,
            "Asset_4": 0.30,
            "Asset_5": 0.10,
        },
        "Aggressive (80/20)": {
            "Asset_1": 0.45,
            "Asset_2": 0.20,
            "Asset_3": 0.15,
            "Asset_4": 0.15,
            "Asset_5": 0.05,
        }
    }

    comparison_results = {}

    for name, portfolio in portfolios.items():
        payload = {
            "portfolio": portfolio,
            "use_default_scenarios": True
        }

        response = requests.post(
            f"{API_URL}/api/stress/apply",
            json=payload
        )
        data = response.json()

        if data["success"]:
            comparison_results[name] = data["data"]["summary"]

    # Display comparison
    print("\n✓ Portfolio Comparison Across All Scenarios:\n")
    print(f"  {'Portfolio':<25} {'Avg Return':<15} {'Worst Return':<15} {'Avg DD':<15}")
    print("  " + "-"*70)

    for name, summary in comparison_results.items():
        print(f"  {name:<25} "
              f"{summary['average_return']:>13.2f}% "
              f"{summary['worst_return']:>13.2f}% "
              f"{summary['average_max_drawdown']:>13.2f}%")


def run_all_examples():
    """Run all examples sequentially."""
    print("\n" + "="*80)
    print("STRESS TESTING API - COMPREHENSIVE EXAMPLES")
    print("="*80)
    print("\nThese examples demonstrate the stress testing capabilities")
    print("ported from the legacy AlTi Risk Portfolio App.\n")

    try:
        example_1_get_available_scenarios()
        example_2_apply_historical_scenarios()
        example_3_custom_scenario()
        example_4_hypothetical_scenario()
        example_5_stress_contribution()
        example_6_compare_portfolios()

        print("\n" + "="*80)
        print("✓ All examples completed successfully!")
        print("="*80 + "\n")

    except Exception as e:
        print(f"\n✗ Error running examples: {str(e)}")
        print("Make sure the API service is running on http://127.0.0.1:8001\n")


if __name__ == "__main__":
    run_all_examples()
