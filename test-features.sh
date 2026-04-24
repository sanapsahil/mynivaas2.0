#!/bin/bash

echo "🚀 Testing AI Intelligence Features"
echo "===================================="

BASE_URL="http://localhost:3000"

# Test 1: Fraud Detection
echo ""
echo "📋 Test 1: Fraud Detection API"
curl -X POST "$BASE_URL/api/fraud" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Luxury Apartment in Downtown - URGENT SALE - CHEAP DEAL",
    "description": "Brand new luxury apartment with no broker fees",
    "listedPrice": 5000000,
    "otherTitles": ["Luxury Apartment in Downtown", "Downtown Luxury Apt"],
    "marketAverage": 12000000
  }' 2>/dev/null | jq '.'

# Test 2: Price Explanation
echo ""
echo "📋 Test 2: Price Explanation API"
curl -X POST "$BASE_URL/api/genai/explain-price" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "3BHK Apartment in Bangalore",
    "price": 8500000,
    "location": "Bangalore",
    "bedrooms": 3,
    "bathrooms": 2,
    "areaSqft": 1500,
    "description": "Luxury furnished apartment in prime location"
  }' 2>/dev/null | jq '.'

# Test 3: Neighborhood Report
echo ""
echo "📋 Test 3: Neighborhood Report API"
curl -X POST "$BASE_URL/api/genai/neighborhood-report" \
  -H "Content-Type: application/json" \
  -d '{
    "location": "Bangalore"
  }' 2>/dev/null | jq '.'

# Test 4: Market Insights
echo ""
echo "📋 Test 4: Market Insights API"
curl -X POST "$BASE_URL/api/genai/market-insights" \
  -H "Content-Type: application/json" \
  -d '{
    "location": "Mumbai"
  }' 2>/dev/null | jq '.'

# Test 5: Recommendations
echo ""
echo "📋 Test 5: Recommendations API"
curl -X POST "$BASE_URL/api/recommendations" \
  -H "Content-Type: application/json" \
  -d '{
    "propertyId": "test-123",
    "userPreferences": {
      "minPrice": 5000000,
      "maxPrice": 15000000,
      "bedrooms": 3,
      "location": "Bangalore"
    }
  }' 2>/dev/null | jq '.'

echo ""
echo "✅ All tests completed!"
