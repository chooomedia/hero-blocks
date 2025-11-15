# HorexHeroSlider Plugin

HOREX Hero Slider CMS Block Plugin für Shopware 6.7+

**Erstellt gemäß:**

- [Ninja Army Tutorial](https://ninja-army.hashnode.dev/how-to-create-a-cms-block-in-shopware-6)
- [GitHub Real World CMS](https://github.com/NinjaArmy/shopware-real-world-cms)

## ✅ Status

**Plugin aktiviert und funktionsfähig!**

## 📦 Inhalt

- ✅ Administration Module (CMS Block/Elements Registrierung)
- ✅ Storefront Templates (Block/Element Rendering)
- ✅ Benutzerdefinierte Hero Slider Funktionalität

## 🎯 Verwendung im Admin

1. Gehe zu Erlebniswelten: `http://localhost/admin#/sw/cms/detail/[ID]`
2. Suche nach **"Horex Hero Slider"** in der Sidebar (Kategorie: Image)
3. Füge Block hinzu und konfiguriere:
   - Bilder hochladen
   - Headline & Text
   - 2x CTA Buttons (Text + URL)
   - Auto-Slide Einstellungen

## 📁 Struktur

```
src/Resources/
├── app/administration/src/
│   ├── main.js                                    # Admin-Entry Point
│   └── module/sw-cms/
│       ├── blocks/image/horex-hero-slider/       # Block Registrierung
│       └── elements/horex-hero-slider/          # Element Konfiguration
└── views/storefront/
    ├── block/cms-block-horex-hero-slider.html.twig
    └── element/cms-element-horex-hero-slider.html.twig
```

## 🚀 Installation

Plugin ist bereits aktiviert. Zum Neubauen:

```bash
docker exec horex-shopware bash -c "cd /var/www/html && php bin/console plugin:refresh && php bin/console cache:clear"
```

## 📝 Nächste Schritte

1. ✅ Plugin ist aktiv
2. ✅ Administration Module sind geladen
3. 🧪 **JETZT: In Admin testen!**
