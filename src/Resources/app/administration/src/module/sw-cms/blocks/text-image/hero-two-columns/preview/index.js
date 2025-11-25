import template from './sw-cms-preview-hero-two-columns.html.twig';
import './sw-cms-preview-hero-two-columns.scss';

export default {
    template,

    inject: ['repositoryFactory'],

    props: {
        block: {
            type: Object,
            required: false,
            default() {
                return {};
            },
        },
    },

    data() {
        return {
            backgroundImageLeftUrl: null,
            backgroundImageRightUrl: null,
        };
    },

    computed: {
        assetFilter() {
            return Shopware.Filter.getByName('asset');
        },

        mediaRepository() {
            return this.repositoryFactory.create('media');
        },

        // WICHTIG: Layout-Einstellungen aus block.customFields lesen (NICHT block.config!)
        layoutDesktop() {
            if (!this.block || !this.block.customFields) {
                return 'image-left';
            }
            return this.block.customFields.layoutDesktop || this.block.customFields.layout || 'image-left';
        },

        layoutTablet() {
            if (!this.block || !this.block.customFields) {
                return 'image-left';
            }
            return this.block.customFields.layoutTablet || this.block.customFields.layout || 'image-left';
        },

        layout() {
            if (!this.block || !this.block.customFields) {
                return 'image-left';
            }
            return this.block.customFields.layout || 'image-left';
        },

        // WICHTIG: CSS-Klassen für Reihenfolge basierend auf Layout
        previewClasses() {
            // Desktop/Tablet: layoutDesktop bestimmt die Reihenfolge
            // Mobile: layout bestimmt die Reihenfolge
            const isTextLeft = this.layoutDesktop === 'text-left';
            
            return {
                'is--text-left': isTextLeft,
                'is--image-left': !isTextLeft,
            };
        },

        // WICHTIG: Prüft ob Background Left vorhanden ist (Image oder CSS)
        hasBackgroundLeft() {
            if (!this.block || !this.block.customFields) {
                return false;
            }
            const useCss = this.block.customFields.backgroundLeftUseCss === true;
            if (useCss) {
                return !!this.block.customFields.backgroundLeftCss;
            }
            return !!this.backgroundImageLeftUrl;
        },

        // WICHTIG: Prüft ob Background Right vorhanden ist (Image oder CSS)
        hasBackgroundRight() {
            if (!this.block || !this.block.customFields) {
                return false;
            }
            const useCss = this.block.customFields.backgroundRightUseCss === true;
            if (useCss) {
                return !!this.block.customFields.backgroundRightCss;
            }
            return !!this.backgroundImageRightUrl;
        },

        // WICHTIG: Style für Background Left (Image oder CSS Code)
        backgroundLeftStyle() {
            if (!this.block || !this.block.customFields) {
                return {};
            }
            const useCss = this.block.customFields.backgroundLeftUseCss === true;
            if (useCss) {
                // CSS Code verwenden
                const cssCode = this.block.customFields.backgroundLeftCss || '';
                return {
                    background: cssCode,
                    zIndex: 0,
                };
            }
            // Image verwenden
            if (this.backgroundImageLeftUrl) {
                return {
                    backgroundImage: `url(${this.backgroundImageLeftUrl})`,
                    zIndex: 0,
                };
            }
            return {};
        },

        // WICHTIG: Style für Background Right (Image oder CSS Code)
        backgroundRightStyle() {
            if (!this.block || !this.block.customFields) {
                return {};
            }
            const useCss = this.block.customFields.backgroundRightUseCss === true;
            if (useCss) {
                // CSS Code verwenden
                const cssCode = this.block.customFields.backgroundRightCss || '';
                return {
                    background: cssCode,
                    zIndex: 0,
                };
            }
            // Image verwenden
            if (this.backgroundImageRightUrl) {
                return {
                    backgroundImage: `url(${this.backgroundImageRightUrl})`,
                    zIndex: 0,
                };
            }
            return {};
        },
    },

    // WICHTIG: Watch block.customFields Änderungen für reaktive Updates
    watch: {
        'block.customFields.layoutDesktop': {
            handler() {
                this.$forceUpdate();
            },
            immediate: false,
        },
        'block.customFields.layoutTablet': {
            handler() {
                this.$forceUpdate();
            },
            immediate: false,
        },
        'block.customFields.layout': {
            handler() {
                this.$forceUpdate();
            },
            immediate: false,
        },
        // Deep watch für alle customFields Änderungen
        'block.customFields': {
            handler() {
                this.loadBackgroundImages();
                this.$forceUpdate();
            },
            deep: true,
            immediate: false,
        },
    },

    created() {
        this.loadBackgroundImages();
    },

    methods: {
        /**
         * Lädt Background Images für Preview
         * WICHTIG: Nur wenn CSS Code NICHT verwendet wird
         */
        async loadBackgroundImages() {
            if (!this.block || !this.block.customFields) {
                return;
            }

            const backgroundMode = this.block.customFields.backgroundMode || 'none';
            
            if (backgroundMode === 'two-images') {
                // Background Image Left (nur wenn CSS Code nicht verwendet wird)
                const useCssLeft = this.block.customFields.backgroundLeftUseCss === true;
                if (!useCssLeft && this.block.customFields.backgroundImageLeft) {
                    await this.loadMediaUrl(this.block.customFields.backgroundImageLeft, 'left');
                } else {
                    this.backgroundImageLeftUrl = null;
                }

                // Background Image Right (nur wenn CSS Code nicht verwendet wird)
                const useCssRight = this.block.customFields.backgroundRightUseCss === true;
                if (!useCssRight && this.block.customFields.backgroundImageRight) {
                    await this.loadMediaUrl(this.block.customFields.backgroundImageRight, 'right');
                } else {
                    this.backgroundImageRightUrl = null;
                }
            } else {
                this.backgroundImageLeftUrl = null;
                this.backgroundImageRightUrl = null;
            }
        },

        /**
         * Lädt Media-URL aus Media-ID
         */
        async loadMediaUrl(mediaId, side) {
            try {
                const media = await this.mediaRepository.get(mediaId, Shopware.Context.api);
                if (media && media.url) {
                    if (side === 'left') {
                        this.backgroundImageLeftUrl = media.url;
                    } else if (side === 'right') {
                        this.backgroundImageRightUrl = media.url;
                    }
                }
            } catch (error) {
                // Media nicht gefunden - ignoriere Fehler
                if (side === 'left') {
                    this.backgroundImageLeftUrl = null;
                } else if (side === 'right') {
                    this.backgroundImageRightUrl = null;
                }
            }
        },
    },
};

