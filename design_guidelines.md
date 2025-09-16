# Neo-Brutalist Financial Command Center - Design Guidelines

## Design Approach: Reference-Based Neo-Brutalist System
**Justification**: This is a specialized aesthetic requirement calling for Neo-Brutalist design principles - harsh, uncompromising, and functionally aggressive visual language that matches the "brutally honest" financial management philosophy.

## Core Design Elements

### A. Color Palette
**Dark Mode Primary** (Default):
- Background: 0 0% 8% (deep charcoal)
- Surface: 0 0% 12% (elevated dark surface)
- Primary: 0 0% 95% (harsh white for text/borders)
- Danger: 0 84% 60% (brutal red for negative values)
- Success: 142 76% 36% (muted green for positive values)
- Warning: 45 93% 47% (amber for alerts)

**Light Mode** (Optional toggle):
- Background: 0 0% 98% (stark white)
- Surface: 0 0% 94% (subtle gray)
- Primary: 0 0% 5% (harsh black)
- Same accent colors maintained

### B. Typography
- **Primary**: Inter (Google Fonts) - geometric, brutalist-friendly
- **Monospace**: JetBrains Mono for financial data/tables
- **Sizes**: Aggressive hierarchy - 48px headlines, 16px body, 14px data
- **Weight**: Bold (700) for emphasis, Regular (400) for content

### C. Layout System
**Tailwind Spacing Primitives**: 2, 4, 6, 8, 12, 16, 24 units
- Harsh geometric spacing with intentional asymmetry
- Dense information layouts with minimal padding
- Sharp rectangular containers with no rounded corners

### D. Component Library

**Core Elements**:
- **Borders**: Thick 3-4px black borders on all containers
- **Shadows**: Harsh drop shadows (8px offset, no blur) in black
- **Cards**: Rectangular with thick borders, no border-radius
- **Tables**: Dense data tables with alternating row colors
- **Charts**: Geometric bar charts and line graphs with sharp angles

**Navigation**:
- Brutal sidebar with thick separators
- Sharp rectangular navigation items
- High contrast active states

**Forms**:
- Input fields with thick borders and harsh focus states
- Brutal validation messages in red
- "Kill switches" for subscriptions with danger styling

**Data Displays**:
- Dense financial tables with monospace numbers
- Harsh color coding for positive/negative values
- Geometric progress bars for collection rates
- Sharp-edged status indicators

**Overlays**:
- Modal dialogs with thick black borders
- No backdrop blur - harsh overlay states
- Sharp-edged tooltips for data points

### E. Animations
**Minimal and Harsh**:
- Sharp state transitions (100ms duration)
- No easing curves - linear transitions only
- Color changes for status updates
- No decorative animations - function-only

## Neo-Brutalist Specific Guidelines

**Visual Hierarchy**: Use size, weight, and harsh contrast rather than subtle spacing
**Asymmetry**: Intentionally offset elements for visual tension
**Information Density**: Pack data efficiently - no wasted whitespace
**Honest Feedback**: Harsh red for overdue payments, unforgiving validation messages
**Geometric Shapes**: Rectangle-only design language, no organic curves
**High Contrast**: Black/white with strategic color accents only

## Images
This financial command center should be primarily data-driven with minimal imagery:
- **No Hero Image**: This is a utility-first dashboard
- **Icon Usage**: Material Icons for harsh geometric symbols
- **Data Visualization**: Custom geometric charts and graphs
- **Status Indicators**: Sharp-edged colored rectangles for payment status

## Responsive Behavior
- Mobile: Stack brutal cards vertically, maintain thick borders
- Desktop: Multi-column dense layouts with harsh geometric alignment
- Maintain Neo-Brutalist aesthetic integrity across all breakpoints