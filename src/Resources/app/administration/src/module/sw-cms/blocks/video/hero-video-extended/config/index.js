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
 * WICHTIG: Folgt EXAKT dem gleichen Pattern wie Hero Two Columns für customFields Persistenz
 * - Direktes Setzen von customFields (KEIN Helper-Funktion)
 * - Kein $emit('block-update')
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

        // Overlay Settings
        overlayPosition() {
            return this.block?.customFields?.overlayPosition || 'bottom-right';
        },

        overlayBackgroundColor() {
            return this.block?.customFields?.overlayBackgroundColor || '';
        },

        overlayTextColor() {
            return this.block?.customFields?.overlayTextColor || '#ffffff';
        },

        overlayHeadline() {
            return this.block?.customFields?.overlayHeadline || '';
        },

        overlayText() {
            return this.block?.customFields?.overlayText || '';
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
         * WICHTIG: Folgt EXAKT dem gleichen Pattern wie Hero Two Columns
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

            const defaults = {
                videoMediaId: null,
                posterMediaId: null,
                autoplay: true,
                loop: true,
                muted: true,
                overlayPosition: 'bottom-right',
                overlayBackgroundColor: '',
                overlayTextColor: '#ffffff',
                overlayHeadline: '',
                overlayText: '',
                enableScrollAnimation: true,
                minHeight: '500px',
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
            
            console.log('[Hero Video Extended Config] initializeBlockConfig - customFields:', JSON.stringify(this.block.customFields));
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

        onOverlayHeadlineChange(value) {
            if (!this.block) return;
            if (!this.block.customFields) this.block.customFields = {};
            this.block.customFields.overlayHeadline = value;
        },

        onOverlayTextChange(value) {
            if (!this.block) return;
            if (!this.block.customFields) this.block.customFields = {};
            this.block.customFields.overlayText = value;
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
