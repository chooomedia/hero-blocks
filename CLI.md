# 🛠️ Matt Interfaces CLI

**Development & Build Tool for Hero Blocks**

## Quick Start

```bash
# Make executable (first time only)
chmod +x mi-cli.sh

# Show help
./mi-cli.sh help
```

## Commands

### Build Assets

```bash
# Full build (Storefront + Admin)
./mi-cli.sh build

# Admin only (faster for UI development)
./mi-cli.sh build admin

# Storefront only (theme compile)
./mi-cli.sh build storefront
```

### Clear Cache

```bash
./mi-cli.sh cache
```

### Create New CMS Block

Interactive wizard to create a new CMS block with all required files:

```bash
./mi-cli.sh create-block
```

**Generated Structure:**
```
src/Resources/app/administration/src/module/sw-cms/blocks/[category]/[block-name]/
├── index.js              # Block registration
├── component/            # Admin preview component
│   ├── index.js
│   ├── sw-cms-block-[name].html.twig
│   └── sw-cms-block-[name].scss
├── preview/              # Sidebar preview
│   ├── index.js
│   ├── sw-cms-preview-[name].html.twig
│   └── sw-cms-preview-[name].scss
└── config/               # Block configuration
    ├── index.js
    ├── sw-cms-block-config-[name].html.twig
    └── sw-cms-block-config-[name].scss

src/Resources/views/storefront/block/
└── cms-block-[name].html.twig
```

**Available Categories:**
- `text` - Text-only blocks
- `image` - Image blocks
- `text-image` - Text & image blocks
- `commerce` - Product/commerce blocks
- `video` - Video blocks
- `form` - Form blocks
- `sidebar` - Sidebar blocks
- `html` - Custom HTML blocks

### Create Release

```bash
./mi-cli.sh release
```

### Run Tests

```bash
./mi-cli.sh test
```

## After Creating a Block

1. **Import in main.js:**
   ```javascript
   import './module/sw-cms/blocks/[category]/[block-name]/index.js';
   ```

2. **Add Snippets:**
   ```json
   // de-DE.json & en-GB.json
   "[blockNameCamel]": { "label": "Block Label" }
   ```

3. **Add Enable Toggle (optional):**
   ```xml
   <!-- config.xml -->
   <name>enable[BlockNamePascal]</name>
   ```

4. **Build:**
   ```bash
   ./mi-cli.sh build admin
   ```

## Examples

```bash
# Create a testimonial block in text-image category
./mi-cli.sh create-block
# → Select: 3 (text-image)
# → Enter: hero-testimonial

# Quick admin rebuild after changes
./mi-cli.sh build admin

# Full rebuild before commit
./mi-cli.sh build
```

---

*Powered by [Matt Interfaces](https://matt-interfaces.ch)*
