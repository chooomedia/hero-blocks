/**
 * Hero Video Extended Block - Config Component
 * 
 * Settings:
 * - Video upload via Media Manager (MP4, WebM)
 * - Poster image
 * - Autoplay, Loop, Muted
 * - Overlay position, colors, text
 * - Scroll animation
 * 
 * WICHTIG: SPRACHABHÄNGIGE TEXTE
 * - Texte (Headline, Content) werden im 'textOverlay' Slot gespeichert (ÜBERSETZBAR)
 * - Andere Einstellungen (Video, Position, Farben) werden in block.customFields gespeichert (NICHT übersetzbar)
 */
import template from './sw-cms-block-config-hero-video-extended.html.twig';
import './sw-cms-block-config-hero-video-extended.scss';

export default {
    template,

    inject: ['repositoryFactory', 'cmsService'],

    // WICHTIG: cms-state Mixin hinzufügen (wie Standard sw-cms-block-config)
    mixins: [
        Shopware.Mixin.getByName('cms-state'),
    ],

    props: {
        block: {
            type: Object,
            required: true,
        },
    },

    data() {
        return {
            videoMedia: null,
            posterMedia: null,
            showFileSizeWarning: false,
        };
    },

    computed: {
        mediaRepository() {
            return this.repositoryFactory.create('media');
        },

        uploadTag() {
            return `hero-video-extended-${this.block?.id || 'new'}`;
        },

        // Content Slot (SPRACHABHÄNGIG) - Slot-Name: "content" für Kompatibilität
        contentSlot() {
            return this.block?.slots?.find(slot => slot.slot === 'content') || null;
        },

        // Video Settings - Direkte Getter ohne Setter (Pattern wie Hero Two Columns)
        videoMediaId() {
            return this.block?.customFields?.videoMediaId || null;
        },

        posterMediaId() {
            return this.block?.customFields?.posterMediaId || null;
        },

        autoplay() {
            return this.block?.customFields?.autoplay !== false;
        },

        loop() {
            return this.block?.customFields?.loop !== false;
        },

        muted() {
            return this.block?.customFields?.muted !== false;
        },

        // Overlay Settings (NICHT übersetzbar - in customFields)
        overlayPosition() {
            return this.block?.customFields?.overlayPosition || 'bottom-right';
        },

        overlayBackgroundColor() {
            return this.block?.customFields?.overlayBackgroundColor || '';
        },

        overlayTextColor() {
            return this.block?.customFields?.overlayTextColor || '#ffffff';
        },

        // SPRACHABHÄNGIG: Overlay Content aus content Slot
        overlayContent: {
            get() {
                return this.contentSlot?.config?.content?.value || '';
            },
            set(value) {
                this.updateElementConfig('content', value);
            },
        },

        enableScrollAnimation() {
            return this.block?.customFields?.enableScrollAnimation !== false;
        },

        minHeight() {
            return this.block?.customFields?.minHeight || '500px';
        },

        positionOptions() {
            return [
                { value: 'top-left', label: this.$tc('sw-cms.blocks.heroBlocks.heroVideoExtended.config.position.topLeft') },
                { value: 'middle-left', label: this.$tc('sw-cms.blocks.heroBlocks.heroVideoExtended.config.position.middleLeft') },
                { value: 'bottom-left', label: this.$tc('sw-cms.blocks.heroBlocks.heroVideoExtended.config.position.bottomLeft') },
                { value: 'top-right', label: this.$tc('sw-cms.blocks.heroBlocks.heroVideoExtended.config.position.topRight') },
                { value: 'middle-right', label: this.$tc('sw-cms.blocks.heroBlocks.heroVideoExtended.config.position.middleRight') },
                { value: 'bottom-right', label: this.$tc('sw-cms.blocks.heroBlocks.heroVideoExtended.config.position.bottomRight') },
            ];
        },
        
        // Akzeptierte Video-Formate
        videoAccept() {
            return 'video/mp4,video/webm';
        },
    },

    watch: {
        'block.type': {
            handler() {
                this.initializeBlockConfig();
            },
            immediate: true,
        },
        // Lade Video-Media wenn ID sich ändert
        'block.customFields.videoMediaId': {
            handler(newValue) {
                console.log('[Hero Video Extended Config] videoMediaId changed:', newValue);
                if (newValue) {
                    this.loadVideoMedia(newValue);
                } else {
                    this.videoMedia = null;
                }
            },
            immediate: true,
        },
        // Lade Poster-Media wenn ID sich ändert
        'block.customFields.posterMediaId': {
            handler(newValue) {
                console.log('[Hero Video Extended Config] posterMediaId changed:', newValue);
                if (newValue) {
                    this.loadPosterMedia(newValue);
                } else {
                    this.posterMedia = null;
                }
            },
            immediate: true,
        },
    },

    created() {
        this.initializeBlockConfig();
    },

    methods: {
        /**
         * Initialisiert Block-Config-Werte
         * WICHTIG: 
         * - customFields für NICHT-übersetzbare Einstellungen (Video, Position, Farben)
         * - textOverlay Slot für ÜBERSETZBARE Texte
         */
        initializeBlockConfig() {
            if (!this.block) {
                return;
            }

            // WICHTIG: Block-Config wird in block.customFields gespeichert (NICHT block.config!)
            // Stelle sicher, dass block.customFields existiert (reaktiv)
            if (!this.block.customFields) {
                if (this.$set) {
                    this.$set(this.block, 'customFields', {});
                } else {
                    this.block.customFields = {};
                }
            }

            // NICHT-übersetzbare Einstellungen (Video, Position, Farben, Animation)
            const defaults = {
                videoMediaId: null,
                posterMediaId: null,
                autoplay: true,
                loop: true,
                muted: true,
                overlayPosition: 'bottom-right',
                overlayBackgroundColor: '',
                overlayTextColor: '#ffffff',
                enableScrollAnimation: true,
                minHeight: '500px',
                // ENTFERNT: overlayHeadline, overlayText - jetzt im textOverlay Slot (SPRACHABHÄNGIG)
            };

            // Initialisiere fehlende Werte (wie Hero Two Columns)
            Object.keys(defaults).forEach((key) => {
                if (this.block.customFields[key] === undefined || this.block.customFields[key] === null) {
                    if (this.$set) {
                        this.$set(this.block.customFields, key, defaults[key]);
                    } else {
                        this.block.customFields[key] = defaults[key];
                    }
                }
            });

            // Initialisiere textOverlay Slot Config
            this.initializeElementConfig();
            
            console.log('[Hero Video Extended Config] initializeBlockConfig - customFields:', JSON.stringify(this.block.customFields));
        },

        /**
         * Initialisiert Element-Config für content Slot (SPRACHABHÄNGIG)
         * WICHTIG: Inline styles für weiße Farbe (konsistent mit hero-image-overlay)
         */
        initializeElementConfig() {
            const slot = this.contentSlot;
            if (!slot) {
                console.log('[Hero Video Extended Config] content slot not found');
                return;
            }

            if (!slot.config) {
                slot.config = {};
            }

            // Default Content mit inline styles für weiße Farbe (wie bei hero-image-overlay)
            const elementDefaults = {
                content: { 
                    source: 'static', 
                    value: '<h2 class="hero-overlay-headline" style="color: #ffffff; margin-bottom: 0.25rem;">Ihre Überschrift</h2><p class="hero-overlay-text" style="color: #ffffff;">Ihr Beschreibungstext hier eingeben...</p>' 
                },
            };

            Object.keys(elementDefaults).forEach((key) => {
                if (!slot.config[key]) {
                    slot.config[key] = elementDefaults[key];
                }
            });
        },

        /**
         * Aktualisiert Element-Config (SPRACHABHÄNGIG)
         */
        updateElementConfig(key, value) {
            const slot = this.contentSlot;
            if (!slot) {
                console.warn('[Hero Video Extended Config] content slot not found');
                return;
            }

            if (!slot.config) {
                slot.config = {};
            }

            if (!slot.config[key]) {
                slot.config[key] = { source: 'static', value: null };
            }

            slot.config[key].value = value;
            this.$emit('block-update');
        },

        async loadVideoMedia(mediaId) {
            if (!mediaId) {
                this.videoMedia = null;
                return;
            }

            try {
                this.videoMedia = await this.mediaRepository.get(mediaId, Shopware.Context.api);
                console.log('[Hero Video Extended Config] Video media loaded:', this.videoMedia?.fileName);
            } catch (e) {
                console.warn('[Hero Video Extended Config] Could not load video media:', e);
                this.videoMedia = null;
            }
        },

        async loadPosterMedia(mediaId) {
            if (!mediaId) {
                this.posterMedia = null;
                return;
            }

            try {
                this.posterMedia = await this.mediaRepository.get(mediaId, Shopware.Context.api);
                console.log('[Hero Video Extended Config] Poster media loaded:', this.posterMedia?.fileName);
            } catch (e) {
                console.warn('[Hero Video Extended Config] Could not load poster media:', e);
                this.posterMedia = null;
            }
        },

        // ========== VIDEO HANDLERS (wie Hero Two Columns onSetBackgroundImage) ==========
        
        onVideoSelectionChange([mediaItem]) {
            console.log('[Hero Video Extended Config] onVideoSelectionChange called:', mediaItem);
            
            if (!this.block) {
                return;
            }
            if (!this.block.customFields) {
                this.block.customFields = {};
            }
            
            const mediaId = (mediaItem && mediaItem.id) ? mediaItem.id : null;
            this.block.customFields.videoMediaId = mediaId;
            
            if (mediaItem) {
                this.videoMedia = mediaItem;
                
                // Check file size (warn if > 2MB)
                if (mediaItem.fileSize && mediaItem.fileSize > 2 * 1024 * 1024) {
                    this.showFileSizeWarning = true;
                } else {
                    this.showFileSizeWarning = false;
                }
            }
            
            console.log('[Hero Video Extended Config] Video selected, mediaId:', mediaId);
        },

        async onVideoUploadFinish(uploadedMedia) {
            console.log('[Hero Video Extended Config] onVideoUploadFinish called:', uploadedMedia);
            
            if (!this.block) {
                return;
            }
            if (!this.block.customFields) {
                this.block.customFields = {};
            }
            
            if (uploadedMedia && uploadedMedia.targetId) {
                this.block.customFields.videoMediaId = uploadedMedia.targetId;
                this.loadVideoMedia(uploadedMedia.targetId);
            }
        },

        onRemoveVideo() {
            console.log('[Hero Video Extended Config] onRemoveVideo called');
            
            if (!this.block || !this.block.customFields) {
                return;
            }
            
            this.block.customFields.videoMediaId = null;
            this.videoMedia = null;
            this.showFileSizeWarning = false;
        },

        // ========== POSTER HANDLERS ==========
        
        onPosterSelectionChange([mediaItem]) {
            console.log('[Hero Video Extended Config] onPosterSelectionChange called:', mediaItem);
            
            if (!this.block) {
                return;
            }
            if (!this.block.customFields) {
                this.block.customFields = {};
            }
            
            const mediaId = (mediaItem && mediaItem.id) ? mediaItem.id : null;
            this.block.customFields.posterMediaId = mediaId;
            
            if (mediaItem) {
                this.posterMedia = mediaItem;
            }
        },

        async onPosterUploadFinish(uploadedMedia) {
            console.log('[Hero Video Extended Config] onPosterUploadFinish called:', uploadedMedia);
            
            if (!this.block) {
                return;
            }
            if (!this.block.customFields) {
                this.block.customFields = {};
            }
            
            if (uploadedMedia && uploadedMedia.targetId) {
                this.block.customFields.posterMediaId = uploadedMedia.targetId;
                this.loadPosterMedia(uploadedMedia.targetId);
            }
        },

        onRemovePoster() {
            console.log('[Hero Video Extended Config] onRemovePoster called');
            
            if (!this.block || !this.block.customFields) {
                return;
            }
            
            this.block.customFields.posterMediaId = null;
            this.posterMedia = null;
        },

        // ========== OTHER SETTINGS HANDLERS (direkt setzen wie Hero Two Columns) ==========

        onAutoplayChange(value) {
            if (!this.block) return;
            if (!this.block.customFields) this.block.customFields = {};
            this.block.customFields.autoplay = value;
        },

        onLoopChange(value) {
            if (!this.block) return;
            if (!this.block.customFields) this.block.customFields = {};
            this.block.customFields.loop = value;
        },

        onMutedChange(value) {
            if (!this.block) return;
            if (!this.block.customFields) this.block.customFields = {};
            this.block.customFields.muted = value;
        },

        onMinHeightChange(value) {
            if (!this.block) return;
            if (!this.block.customFields) this.block.customFields = {};
            this.block.customFields.minHeight = value;
        },

        onOverlayPositionChange(value) {
            if (!this.block) return;
            if (!this.block.customFields) this.block.customFields = {};
            this.block.customFields.overlayPosition = value;
        },

        // SPRACHABHÄNGIG: Overlay Content wird im textOverlay Slot gespeichert
        onOverlayContentChange(value) {
            this.updateElementConfig('content', value);
        },

        onOverlayBackgroundColorChange(value) {
            if (!this.block) return;
            if (!this.block.customFields) this.block.customFields = {};
            this.block.customFields.overlayBackgroundColor = value;
        },

        onOverlayTextColorChange(value) {
            if (!this.block) return;
            if (!this.block.customFields) this.block.customFields = {};
            this.block.customFields.overlayTextColor = value;
        },

        onEnableScrollAnimationChange(value) {
            if (!this.block) return;
            if (!this.block.customFields) this.block.customFields = {};
            this.block.customFields.enableScrollAnimation = value;
        },

        dismissFileSizeWarning() {
            this.showFileSizeWarning = false;
        },
    },
};
