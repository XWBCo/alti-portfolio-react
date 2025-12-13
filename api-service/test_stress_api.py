"""
Quick test script for stress testing API endpoints
Run this after starting the API with: python main.py
"""

import sys
import requests
import json

API_URL = "http://127.0.0.1:8001"

def test_scenarios_endpoint():
    """Test GET /api/stress/scenarios"""
    print("\n" + "="*80)
    print("TEST 1: Get Available Scenarios")
    print("="*80)

    try:
        response = requests.get(f"{API_URL}/api/stress/scenarios", timeout=5)

        if response.status_code == 200:
            data = response.json()
            print(f"✓ Status: {response.status_code}")
            print(f"✓ Success: {data.get('success')}")
            print(f"✓ Scenarios count: {data['data']['count']}")
            print("\nScenarios:")
            for scenario in data['data']['scenarios'][:3]:
                print(f"  - {scenario['name']} ({scenario['type']})")
            return True
        else:
            print(f"✗ Failed with status {response.status_code}")
            print(f"  Response: {response.text}")
            return False

    except requests.exceptions.ConnectionError:
        print("✗ Connection refused - is the API running?")
        print("  Start it with: python main.py")
        return False
    except Exception as e:
        print(f"✗ Error: {e}")
        return False


def test_apply_endpoint():
    """Test POST /api/stress/apply"""
    print("\n" + "="*80)
    print("TEST 2: Apply Historical Scenarios")
    print("="*80)

    # Use real asset names from the loaded data
    portfolio = {
        "US Government": 0.30,
        "Global Equity": 0.35,
        "EM Equity": 0.15,
        "Global Credit": 0.20
    }

    benchmark = {
        "US Government": 0.40,
        "Global Equity": 0.60
    }

    payload = {
        "portfolio": portfolio,
        "benchmark": benchmark,
        "use_default_scenarios": True
    }

    try:
        response = requests.post(
            f"{API_URL}/api/stress/apply",
            json=payload,
            timeout=10
        )

        if response.status_code == 200:
            data = response.json()
            print(f"✓ Status: {response.status_code}")
            print(f"✓ Success: {data.get('success')}")

            if data['success']:
                summary = data['data']['summary']
                print(f"\nSummary:")
                print(f"  Scenarios analyzed: {summary.get('scenarios_analyzed', 'N/A')}")
                print(f"  Average return: {summary.get('average_return', 'N/A')}%")
                print(f"  Worst return: {summary.get('worst_return', 'N/A')}%")

                if data['data']['worst_scenarios']:
                    print(f"\nWorst scenario: {data['data']['worst_scenarios'][0]['scenario']}")
                    print(f"  Return: {data['data']['worst_scenarios'][0]['total_return']}%")
            return True
        else:
            print(f"✗ Failed with status {response.status_code}")
            print(f"  Response: {response.text[:500]}")
            return False

    except Exception as e:
        print(f"✗ Error: {e}")
        return False


def test_custom_scenario():
    """Test POST /api/stress/custom"""
    print("\n" + "="*80)
    print("TEST 3: Apply Custom Scenario")
    print("="*80)

    portfolio = {
        "US Government": 0.30,
        "Global Equity": 0.70
    }

    shocks = {
        "US Government": 0.05,   # Bonds up 5%
        "Global Equity": -0.20   # Equities down 20%
    }

    payload = {
        "portfolio": portfolio,
        "scenario_name": "Test Custom Scenario",
        "shock_magnitudes": shocks
    }

    try:
        response = requests.post(
            f"{API_URL}/api/stress/custom",
            json=payload,
            timeout=5
        )

        if response.status_code == 200:
            data = response.json()
            print(f"✓ Status: {response.status_code}")
            print(f"✓ Success: {data.get('success')}")

            if data['success']:
                result = data['data']
                print(f"\nResults:")
                print(f"  Direct impact: {result.get('direct_impact', 'N/A')}%")
                print(f"  Assets affected: {result.get('assets_affected', 'N/A')}")
            return True
        else:
            print(f"✗ Failed with status {response.status_code}")
            print(f"  Response: {response.text[:500]}")
            return False

    except Exception as e:
        print(f"✗ Error: {e}")
        return False


def test_hypothetical_scenario():
    """Test POST /api/stress/hypothetical"""
    print("\n" + "="*80)
    print("TEST 4: Apply Hypothetical Scenario")
    print("="*80)

    portfolio = {
        "US Government": 0.30,
        "Global Equity": 0.50,
        "EM Equity": 0.20
    }

    payload = {
        "portfolio": portfolio,
        "scenario_type": "mild_recession"
    }

    try:
        response = requests.post(
            f"{API_URL}/api/stress/hypothetical",
            json=payload,
            timeout=5
        )

        if response.status_code == 200:
            data = response.json()
            print(f"✓ Status: {response.status_code}")
            print(f"✓ Success: {data.get('success')}")

            if data['success']:
                result = data['data']
                print(f"\nResults:")
                print(f"  Scenario type: {result.get('scenario_type', 'N/A')}")
                print(f"  Direct impact: {result.get('direct_impact', 'N/A')}%")
                print(f"\nShocks applied:")
                for asset, shock in list(result.get('shocks', {}).items())[:3]:
                    print(f"    {asset}: {shock*100:.1f}%")
            return True
        else:
            print(f"✗ Failed with status {response.status_code}")
            print(f"  Response: {response.text[:500]}")
            return False

    except Exception as e:
        print(f"✗ Error: {e}")
        return False


def run_all_tests():
    """Run all stress testing API tests"""
    print("\n" + "="*80)
    print("STRESS TESTING API - QUICK TESTS")
    print("="*80)
    print("\nTesting stress testing endpoints with real data...")

    results = []

    results.append(("Scenarios Endpoint", test_scenarios_endpoint()))
    results.append(("Apply Scenarios", test_apply_endpoint()))
    results.append(("Custom Scenario", test_custom_scenario()))
    results.append(("Hypothetical Scenario", test_hypothetical_scenario()))

    # Summary
    print("\n" + "="*80)
    print("TEST SUMMARY")
    print("="*80)

    for name, passed in results:
        status = "✓ PASS" if passed else "✗ FAIL"
        print(f"{status:8} - {name}")

    total = len(results)
    passed = sum(1 for _, p in results if p)
    print(f"\n{passed}/{total} tests passed")

    if passed == total:
        print("\n✓ All stress testing endpoints working correctly!")
        return 0
    else:
        print("\n✗ Some tests failed. Check the API logs for details.")
        return 1


if __name__ == "__main__":
    exit_code = run_all_tests()
    sys.exit(exit_code)
