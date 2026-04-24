# 👥 User Guide - How to Use AI Features

## Quick Start (30 seconds)

1. **Visit**: http://localhost:3000
2. **Look**: Header top-right area
3. **Click**: "🤖 AI Tools" dropdown
4. **Select**: Any of 5 features
5. **Fill**: The form on the left
6. **Click**: Action button
7. **Read**: Results on the right

---

## 🛡️ Feature 1: Fraud Detection

### What it does
Identifies suspicious listings and gives a **trust score (0-100)** with warning flags.

### How to use it

**Step 1**: Click header → "🤖 AI Tools" → "🛡️ Fraud Detection"

**Step 2**: Fill the form
```
Property Title:  [Enter title, e.g., "3BHK Apartment"]
Price (₹):       [Enter price, e.g., "5000000"]
Location:        [Enter location, e.g., "Mumbai"]
```

**Step 3**: Click "📊 Explain Price" button

**Step 4**: View results
```
Trust Score:     85/100 ✅
Risk Level:      Low
Flags:           Suspicious keywords detected: urgent sale
Details:         Title duplicate: No
                 Suspicious keywords: [urgent sale]
                 Price anomaly: No
```

### What the scores mean
- **Trust Score 80-100**: Safe, low-risk listing ✅
- **Trust Score 60-79**: Moderate, review carefully ⚠️
- **Trust Score 0-59**: High risk, avoid listing ❌

### Red flags that lower trust score
- ❌ "urgent sale"
- ❌ "cheap deal"
- ❌ "no broker"
- ❌ "limited offer"
- ❌ Price is too low compared to market

---

## 💰 Feature 2: Why This Price?

### What it does
Explains **why a property has that price** with factors like location, size, and condition.

### How to use it

**Step 1**: Click header → "🤖 AI Tools" → "💰 Why This Price"

**Step 2**: Fill the form
```
Property Title:  [e.g., "3BHK Apartment"]
Price (₹):       [e.g., "8500000"]
Location:        [e.g., "Bangalore"]
Bedrooms:        [e.g., "3"] (optional)
Bathrooms:       [e.g., "2"] (optional)
Area (sq.ft):    [e.g., "1500"] (optional)
```

**Step 3**: Click "📊 Explain Price" button

**Step 4**: View results
```
Price Reason:
"This property is priced at ₹85L. Key value drivers include 
 location, size, and market conditions."

Key Factors:
📈 Location (positive) - Located in Bangalore
📈 Size (positive) - 3 bedrooms, 2 bathrooms
➡️ Market (neutral) - Stable pricing trends
```

### Understanding the factors
- 📈 **Green (Positive)**: Increases property value
- ➡️ **Gray (Neutral)**: Doesn't affect price much
- 📉 **Red (Negative)**: Decreases property value

---

## 🏘️ Feature 3: Neighborhood Report

### What it does
Shows **livability scores** and **18 nearby facilities** (schools, hospitals, shops, transport, etc.)

### How to use it

**Step 1**: Click header → "🤖 AI Tools" → "🏘️ Neighborhood Report"

**Step 2**: Fill the form
```
Location/Area:  [Enter city or area, e.g., "Mumbai"]
```

**Step 3**: Click "🔍 Get Report" button

**Step 4**: View results
```
Livability Score:    78/100 [with progress bar]
Safety Rating:       75/100
Summary:             "Mumbai is a developed neighborhood with 
                      good amenities and public transport"

📍 Nearby Facilities (18 total):
🏫 Schools:
  ✓ St. Xavier's School (0.5 km)
  ✓ Happy Kids Montessori (0.8 km)
  ✓ Delhi Public School (1.2 km)

🏥 Hospitals:
  ✓ Apollo Hospital (0.3 km)
  ✓ Max Healthcare (1.0 km)
  ✓ City Clinic (0.7 km)

🛒 Shopping:
  ✓ Central Market (0.4 km)
  ✓ Local Bazaar (0.2 km)
  ✓ Mall of India (2.5 km)

🚆 Transport:
  ✓ Metro Station (1.2 km)
  ✓ Bus Stand (0.5 km)
  ✓ Taxi/Auto Service (0.1 km)

🏃 Recreation:
  ✓ Central Park (0.6 km)
  ✓ Gym & Fitness Club (0.8 km)
  ✓ Sports Complex (1.5 km)

🍽️ Dining:
  ✓ Fine Dining Restaurant (0.5 km)
  ✓ Cafe Street (0.3 km)
  ✓ Food Court (0.4 km)
```

### Score interpretation
- **80-100**: Excellent neighborhood 🟢
- **60-79**: Good neighborhood 🟡
- **0-59**: Fair neighborhood 🔴

---

## 📊 Feature 4: Market Insights

### What it does
Shows **market trends**, **demand levels**, and **investment ratings** for your location.

### How to use it

**Step 1**: Click header → "🤖 AI Tools" → "📊 Market Insights"

**Step 2**: Fill the form
```
Location:  [Enter city, e.g., "Mumbai"]
```

**Step 3**: Click "🔍 Get Insights" button

**Step 4**: View results
```
Price Trend:        📈 Upward (prices going up)
Demand Level:       🔴 High (many buyers)
Investment Rating:  9/10 ⭐⭐⭐⭐⭐

Market Details:
  Average Price:     ₹18,000 per sq.ft
  Price Change:      +5% Year-over-Year
  Investment Level:  Strong Growth Potential

Summary:
"Mumbai market is trending upward with high demand. Strong 
 investment potential with consistent price appreciation."
```

### Trend meanings
- **📈 Upward**: Prices increasing, good time to invest
- **📉 Downward**: Prices decreasing, wait for stability
- **➡️ Stable**: Prices steady, predictable market

### Investment ratings
- **8-10 stars**: Excellent investment opportunity ⭐⭐⭐⭐⭐
- **5-7 stars**: Good investment potential ⭐⭐⭐⭐
- **1-4 stars**: Caution, proceed carefully ⭐

---

## ⭐ Feature 5: Recommendations

### What it does
Finds **8 similar properties** that match your preferences with **match scores**.

### How to use it

**Step 1**: Click header → "🤖 AI Tools" → "⭐ Recommendations"

**Step 2**: Fill the preferences form
```
Budget (₹):      [e.g., "8500000"]
Location:        [e.g., "Mumbai"]
Bedrooms:        [e.g., "3"] (optional)
Bathrooms:       [e.g., "2"] (optional)
```

**Step 3**: Click "🔍 Search" button

**Step 4**: View results
```
Found 8 matching properties

Property 1:
  Title:           3BHK Apartment in Mumbai
  Price:           ₹85,00,000
  Details:         3 BHK | 2 Bath | 1,500 sq.ft
  Match Score:     92% 🟢
  Why Recommended: ✓ Within budget range
                   ✓ Matches preferred location: Mumbai
                   ✓ Exact match: 3 BHK
                   ✓ Low traffic congestion

Property 2:
  Title:           3BHK Apartment in Mumbai
  Price:           ₹80,00,000
  Details:         3 BHK | 2 Bath | 1,600 sq.ft
  Match Score:     88% 🟢
  Why Recommended: ✓ Below budget range
                   ✓ Perfect location match
                   ✓ Exact configuration

[... 6 more properties ...]
```

### Understanding match scores
- **80-100%**: Perfect match, highly recommended 🟢
- **60-79%**: Good match, worth considering 🟡
- **0-59%**: Partial match, review carefully 🔴

---

## 💡 Pro Tips

### 1. Use Fraud Detection First
Always check fraud score before visiting a property:
- ✅ Score 80+: Safe to contact seller
- ⚠️ Score 60-79: Ask for more details
- ❌ Score <60: Skip this property

### 2. Check Price Explanation
Before making an offer:
- Understand what factors justify the price
- Compare with similar properties
- Negotiate if factors don't align

### 3. Review Neighborhood
Essential before committing:
- Check livability and safety scores
- Ensure nearby schools/hospitals if needed
- Verify public transport access

### 4. Analyze Market Trends
To time your purchase:
- Uptrend: Act quickly, prices rising
- Downtrend: Wait for stability
- Stable: Good time to negotiate

### 5. Use Recommendations
To find alternatives:
- Get 8 curated suggestions instantly
- Sort by match score
- Compare top 3 matches

---

## ❓ FAQ

**Q: Can I use these features without internet?**
A: No, you need internet to access the web app. But once loaded, APIs are fast.

**Q: Are the results accurate?**
A: Results are based on heuristics and mock data. For real property search, use the main search feature.

**Q: Can I share my results?**
A: Currently, you can take screenshots. Sharing feature coming soon.

**Q: How often is market data updated?**
A: Market data is updated based on historical trends. Real-time updates coming soon.

**Q: What if a feature shows an error?**
A: Reload the page or try another location. If problem persists, contact support.

**Q: Which cities are supported?**
A: Currently: Mumbai, Bangalore, Delhi, Hyderabad, Chennai, Kolkata, Pune, Ahmedabad, Jaipur, Lucknow

**Q: Can I export the reports?**
A: PDF export feature coming soon. Currently can screenshot or copy data.

---

## 🎯 Complete Workflow Example

### Scenario: Buying a 3BHK in Mumbai under ₹85 lakhs

**Step 1: Check for fraud** 🛡️
```
Go to Fraud Detection
Enter property details
If trust score < 80, skip this property
```

**Step 2: Understand the price** 💰
```
Go to Why This Price
Enter property details
Review factors to validate pricing
```

**Step 3: Check neighborhood** 🏘️
```
Go to Neighborhood Report
Enter location
Verify livability score >= 60
Check nearby schools/hospitals/shops
```

**Step 4: Analyze market** 📊
```
Go to Market Insights
Enter city (Mumbai)
If trend is upward, act quickly
If trend is downward, negotiate harder
```

**Step 5: Find alternatives** ⭐
```
Go to Recommendations
Enter budget, location, preferences
Review top 3 matches
Compare with original property
```

**Result**: Informed decision with 5 AI-powered insights! ✅

---

## 📞 Need Help?

- Check this guide again
- Visit `/ai/fraud-detection` for first steps
- Try with different locations/budgets
- Screenshot results for reference

---

## 🎉 Start Exploring Now!

Visit: **http://localhost:3000** → Click "🤖 AI Tools" → Explore any feature!

Happy property hunting! 🏠✨
