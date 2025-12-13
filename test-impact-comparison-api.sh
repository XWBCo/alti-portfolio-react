#!/bin/bash

# Test the impact comparison API endpoint

echo "Testing Impact Comparison Report API"
echo "====================================="
echo ""

# Test 1: GET sample ESG report (backward compatibility)
echo "Test 1: GET sample ESG report (backward compatibility)"
curl -s -I "http://localhost:3000/impact-analytics/api/reports/generate?format=pdf" | head -5
echo ""

# Test 2: GET sample impact comparison report
echo "Test 2: GET sample impact comparison report"
curl -s -I "http://localhost:3000/impact-analytics/api/reports/generate?type=impact-comparison&format=pdf" | head -5
echo ""

# Test 3: POST ESG report (backward compatibility)
echo "Test 3: POST ESG report (backward compatibility)"
curl -s -X POST "http://localhost:3000/impact-analytics/api/reports/generate?format=html" \
  -H "Content-Type: application/json" \
  -d '{
    "client_name": "Test Client",
    "metrics": {
      "climate_scope12": [1.8, 40.0],
      "climate_scope3": [80.0, 145.0],
      "climate_performance_env": [75.0, 68.0],
      "climate_performance_temp": [1.9, 2.2],
      "natural_capital": [75.0, 48.0],
      "water_recycled_ratio": 45.0,
      "waste_recycling_ratio": 58.0,
      "social": [73.0, 7.0, 35.0, 60.0],
      "governance": [80.0, 82.0, 68.0, 85.0]
    },
    "benchmark": {
      "climate_scope12": [1.9, 45.2],
      "climate_scope3": [89.5, 156.3],
      "climate_performance_env": [72.0, 65.0],
      "climate_performance_temp": [2.1, 2.4],
      "natural_capital": [68.0, 45.0],
      "water_recycled_ratio": 42.0,
      "waste_recycling_ratio": 55.0,
      "social": [71.0, 8.5, 32.0, 58.0],
      "governance": [75.0, 78.0, 62.0, 82.0]
    }
  }' | head -20
echo ""

# Test 4: POST impact comparison report
echo "Test 4: POST impact comparison report"
curl -s -X POST "http://localhost:3000/impact-analytics/api/reports/generate?type=impact-comparison&format=html" \
  -H "Content-Type: application/json" \
  -d '{
    "client_name": "Test Impact Comparison",
    "comparison_data": {}
  }' | head -30
echo ""

echo "====================================="
echo "Test script complete"
