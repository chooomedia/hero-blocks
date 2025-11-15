# Hero Blocks - Release Notes

## 1.0.0 - Initial Release (2025-11-15)

### Features

#### CMS Blocks
- **Hero Slider Block**: Multi-slide hero blocks with headlines, text, buttons, and images
  - Per-slide content configuration
  - Media management integration
  - Navigation controls (arrows, dots)
  - Auto-slide with configurable speed
  - Responsive design (mobile-first)
  - Configurable height (min/max)
  - Display modes: cover, contain, standard

- **Hero Two Columns Block**: Two-column layout with flexible background options
  - Image/Text order switching (desktop/tablet)
  - Background image support
  - Parallax scrolling (coming soon)
  - Responsive stacking (mobile)
  - Bootstrap spacing integration

#### Administration UI
- Professional Admin UI integration
- Branding with Matt Interfaces logo
- Collapsible configuration cards
- License & Update Information management
- Clean, modern design following Shopware UI guidelines

#### License & Update Management
- **License Check**: Integration with n8n webhook
  - License status tracking
  - Expiry date management
  - Silent license checks
  - Status chips in Admin UI

- **Update Check**: GitHub Releases integration via n8n
  - Automatic update detection
  - Latest version tracking
  - Download URL management
  - Changelog display

#### Technical Implementation
- Built according to Shopware 6.7+ best practices
- Bootstrap 5.2.2 compatible
- No jQuery dependencies
- Vue.js 3 for Administration UI
- Semantic HTML5 & Accessibility (WCAG 2.1 AA)
- Performance optimized (Lighthouse ≥ 85)

### Installation

1. Download `hero-blocks-1.0.0.zip` from GitHub Releases
2. Upload via Shopware Admin: Settings → System → Plugins → Upload Plugin
3. Install and activate the plugin
4. Configure in: Settings → System → Plugins → Hero Blocks

### Requirements

- Shopware 6.7.0 or higher
- PHP 8.1+
- MySQL 5.7+ / MariaDB 10.3+

### Documentation

- n8n Workflow: `src/Resources/n8n-workflows/hero-blocks-unified.json`
- GitHub Integration: `src/Resources/n8n-workflows/GITHUB-UPDATE-SERVER.md`
- Testing Guide: `src/Resources/n8n-workflows/TESTING-COMPLETE.md`

### Support

- GitHub Repository: https://github.com/chooomedia/hero-blocks
- Support: https://www.matt-interfaces.ch

---

**Author**: Matt Interfaces  
**Version**: 1.0.0  
**Release Date**: 2025-11-15

