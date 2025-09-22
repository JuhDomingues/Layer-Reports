# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Meta Ads Insights Dashboard - a web application for visualizing and analyzing Meta Ads (Facebook Ads) reports. It's built with vanilla HTML, CSS, and JavaScript using Chart.js for data visualization.

## Development Commands

### Running the Project
Since this is a static web application, no build process is required:

```bash
# Option 1: Using Python's built-in server (recommended)
python -m http.server 8000

# Option 2: Using Node.js http-server 
npx http-server

# Option 3: Using PHP
php -S localhost:8000
```

Access the application at `http://localhost:8000`

### No Build/Test/Lint Commands
This project does not include:
- Build processes (it's vanilla HTML/CSS/JS)
- Test suites 
- Linting configuration
- Package management (uses CDN dependencies)

## Architecture

### File Structure
```
Layer/
├── index.html              # Main application page
├── css/style.css          # All styling (mobile-first responsive design)
├── js/
│   ├── main.js            # Main application logic and UI interactions
│   └── meta-api.js        # Simulated Meta Ads API integration
└── assets/images/         # Static image resources
```
778309504913999
### Core Components

**MetaAdsInsights Class (main.js)**
- Main application controller managing dashboard state
- Handles all user interactions (date filtering, search, export)
- Manages Chart.js instances for data visualization
- Generates and displays mock campaign data

**MetaAdsAPI Class (meta-api.js)**
- Simulates Meta Ads Graph API responses
- Provides mock data for campaigns, insights, and audience data
- Designed to be easily replaceable with real API integration
- Includes error handling and authentication simulation

### Data Flow
1. Application initializes with `generateMockData()`
2. KPI cards populate from calculated totals 
3. Charts render using Chart.js with time-series data
4. Campaign table displays with search/filter capabilities
5. Data refreshes simulate API calls with loading states

### Key Features
- **Responsive Design**: Mobile-first CSS with breakpoints at 768px, 1024px, 1200px
- **Interactive Charts**: Line chart for performance over time, doughnut chart for campaign distribution
- **Real-time Filtering**: Date range selection (7/30/90 days) regenerates all data
- **CSV Export**: Client-side data export functionality
- **Loading States**: Simulated API delays with overlay spinner

### Styling System
- Uses Inter font family and Meta blue color scheme (#1877f2)
- CSS Grid for KPI cards layout (responsive: 4→3→2→1 columns)
- Flexbox for header/sidebar navigation
- Custom scrollbars and hover animations
- Status badges with semantic colors (green/yellow/red)

### Mock Data Structure
Campaign objects include:
- Basic info: name, status (active/paused/inactive)  
- Metrics: impressions, clicks, CTR, CPC, conversions, spend
- Time-series data generated for configurable date ranges
- Realistic Meta Ads field names and value ranges

## Integration Notes

### To Connect Real Meta Ads API
1. Replace mock methods in `MetaAdsAPI` class with actual Graph API calls
2. Implement OAuth 2.0 authentication flow 
3. Update field mappings to match real API response structure
4. Add proper error handling for API rate limits and failures

### Adding New Metrics
1. Add KPI card HTML structure in `index.html`
2. Update `updateKPIs()` method in `main.js` 
3. Extend mock data generation in `generateMockData()`
4. Add corresponding CSS styling following existing card patterns

### Customization
- Primary colors defined in CSS custom properties
- Chart.js configurations centralized in setup methods
- All text labels easily replaceable for internationalization
- Responsive breakpoints clearly defined in media queries