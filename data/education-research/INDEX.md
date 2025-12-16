# Education Research Data Sources - Index

## Overview
This document indexes education research data sources for creating viral educational content for school marketing.

---

## 1. What Works Clearinghouse (WWC)
**Source:** U.S. Institute of Education Sciences
**URL:** https://ies.ed.gov/ncee/wwc/StudyFindings
**Access:** Downloadable CSV/Excel (no API)

### What's Available
- **10,000+ education studies** reviewed since 2002
- Effect sizes and outcome measures
- Evidence tier ratings (like clinical trial phases)
- Intervention types and study characteristics

### Data Fields
- Study name, publication year
- Intervention name and description
- Outcome domain (reading, math, behavior, etc.)
- Effect size (standardized)
- Sample size
- WWC rating (Meets Standards, Meets Standards With Reservations, Does Not Meet)
- ESSA Evidence Tier

### Viral Content Potential
- "This teaching method improved reading by X% according to rigorous studies"
- "What actually works in education (backed by 10,000 studies)"
- Compare interventions: "Method A beats Method B by 3 months of learning"

---

## 2. EEF Teaching & Learning Toolkit
**Source:** Education Endowment Foundation (UK)
**URL:** https://educationendowmentfoundation.org.uk/education-evidence/teaching-learning-toolkit
**Access:** Web scraping or manual (no API)

### What's Available
- **30+ teaching approaches** rated
- Impact measured in "months of additional progress"
- Cost rating ($ to $$$$$)
- Evidence strength rating

### Key Data Points (2024/2025 updates)
| Intervention | Months Progress | Cost | Evidence |
|-------------|-----------------|------|----------|
| Metacognition & self-regulation | +8 months | $ | High |
| Feedback | +8 months | $ | High |
| Reading comprehension strategies | +6 months | $ | High |
| Homework (secondary) | +5 months | $ | Low |
| Homework (primary) | +3 months | $ | Low |
| Collaborative learning | +5 months | $ | High |
| Peer tutoring | +5 months | $ | High |
| Mentoring | 0 months | $$ | Low |
| Reducing class size | +3 months | $$$$$ | Low |

### Viral Content Potential
- "The #1 thing that helps kids learn (+8 months) costs almost nothing"
- "Expensive doesn't mean effective: Class size reduction vs Feedback"
- "What teachers know that parents don't about homework"

---

## 3. Urban Institute Education Data Portal
**Source:** Urban Institute
**URL:** https://educationdata.urban.org/documentation/
**Access:** REST API (no auth required)

### What's Available
- **Every U.S. school** - directory, enrollment, demographics
- College Scorecard data
- Civil Rights Data Collection
- Small Area Income and Poverty Estimates

### API Endpoints (verified working)
```
https://educationdata.urban.org/api/v1/schools/ccd/directory/{year}/
https://educationdata.urban.org/api/v1/schools/ccd/enrollment/{year}/grade-{n}/
```

### Sample Data Fields
- School name, address, coordinates
- Enrollment by grade
- Free/reduced lunch counts
- Teacher FTE
- Charter/magnet status
- Urban/rural locale

### Viral Content Potential
- Compare schools across states/districts
- Map visualizations
- "Schools near you" tools

---

## 4. Our World in Data - Education
**Source:** Our World in Data
**URL:** https://ourworldindata.org/quality-of-education
**Access:** CSV download (append .csv to any chart URL)

### What's Available
- **PISA test scores** by country (math, reading, science)
- Harmonized learning outcomes (global comparison)
- Education spending vs outcomes
- Learning-adjusted years of schooling
- Historical education data (decades)

### Sample Data (Harmonized Test Scores)
| Country | Score | Year |
|---------|-------|------|
| Singapore | 575+ | 2020 |
| Thailand | ~430 | 2020 |
| Afghanistan | 355 | 2020 |
| OECD Mean | 500 | - |

Scale: 300 = minimal, 500 = OECD average, 625 = advanced

### Viral Content Potential
- Country comparisons: "Why do Finnish kids outperform American kids?"
- Spending vs outcomes: "Throwing money at education doesn't work"
- Historical trends: "Are kids getting smarter or dumber?"

---

## 5. AEA RCT Registry
**Source:** American Economic Association
**URL:** https://www.socialscienceregistry.org/
**Access:** Monthly data dumps on Harvard Dataverse

### What's Available
- **11,350 randomized controlled trials** in social sciences
- Many education-focused studies
- Pre-registration data (prevents publication bias)
- 170 countries covered

### Viral Content Potential
- "What happens when you actually test education ideas rigorously"
- Track which popular education trends have evidence

---

## 6. UNICEF Data
**Source:** UNICEF
**URL:** https://data.unicef.org/sdmx-api-documentation/
**Access:** SDMX REST API (no auth)

### What's Available
- Early childhood development indicators
- Out-of-school children rates
- Learning proficiency by country
- Child wellbeing indicators

### API Endpoint
```
https://sdmx.data.unicef.org/ws/public/sdmxapi/rest/dataflow
```

### Viral Content Potential
- Child development comparisons across countries
- "X million children can't read by age 10"

---

## 7. UNESCO UIS Education API
**Source:** UNESCO Institute for Statistics
**URL:** https://apiportal.uis.unesco.org/
**Access:** API (free key required)

### What's Available
- **4,000+ education indicators**
- Global enrollment rates
- Literacy rates
- Teacher statistics
- Education spending

---

## Quick Reference: Data for Viral Content

### For "What Works" Content
1. EEF Toolkit - months of progress by intervention
2. What Works Clearinghouse - rigorous study outcomes
3. AEA RCT Registry - trial results

### For Country Comparisons
1. Our World in Data - PISA scores, learning outcomes
2. UNESCO UIS - enrollment, literacy
3. UNICEF - child development

### For U.S. School Data
1. Urban Institute API - school-level data

### For Screen Time / Outdoor / Nature
- Limited direct data in these sources
- Need: ABCD Study (NIMH), CDC data, custom research
