/**
 * Hero Video Extended Block - Config Component
 * 
 * Settings:
 * - Video upload via Media Manager
 * - Poster image
 * - Autoplay, Loop, Muted
 * - Overlay position, colors, text
 * - Scroll animation
 */
import template from './sw-cms-block-config-hero-video-extended.html.twig';
import './sw-cms-block-config-hero-video-extended.scss';

const { Mixin } = Shopware;

export default {
    template,

    inject: ['repositoryFactory'],

    mixins: [
        Mixin.getByName('cms-state'),
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

        // Video Settings
        videoMediaId: {
            get() {
                return this.block?.customFields?.videoMediaId || null;
            },
            set(value) {
                this.updateCustomField('videoMediaId', value);
            },
        },

        posterMediaId: {
            get() {
                return this.block?.customFields?.posterMediaId || null;
            },
            set(value) {
                this.updateCustomField('posterMediaId', value);
            },
        },

        autoplay: {
            get() {
                return this.block?.customFields?.autoplay !== false;
            },
            set(value) {
                this.updateCustomField('autoplay', value);
            },
        },

        loop: {
            get() {
                return this.block?.customFields?.loop !== false;
            },
            set(value) {
                this.updateCustomField('loop', value);
            },
        },

        muted: {
            get() {
                return this.block?.customFields?.muted !== false;
            },
            set(value) {
                this.updateCustomField('muted', value);
            },
        },

        // Overlay Settings
        overlayPosition: {
            get() {
                return this.block?.customFields?.overlayPosition || 'bottom-right';
            },
            set(value) {
                this.updateCustomField('overlayPosition', value);
            },
        },

        overlayBackgroundColor: {
            get() {
                return this.block?.customFields?.overlayBackgroundColor || '';
            },
            set(value) {
                this.updateCustomField('overlayBackgroundColor', value);
            },
        },

        overlayTextColor: {
            get() {
                return this.block?.customFields?.overlayTextColor || '#ffffff';
            },
            set(value) {
                this.updateCustomField('overlayTextColor', value);
            },
        },

        overlayHeadline: {
            get() {
                return this.block?.customFields?.overlayHeadline || '';
            },
            set(value) {
                this.updateCustomField('overlayHeadline', value);
            },
        },

        overlayText: {
            get() {
                return this.block?.customFields?.overlayText || '';
            },
            set(value) {
                this.updateCustomField('overlayText', value);
            },
        },

        enableScrollAnimation: {
            get() {
                return this.block?.customFields?.enableScrollAnimation !== false;
            },
            set(value) {
                this.updateCustomField('enableScrollAnimation', value);
            },
        },

        minHeight: {
            get() {
                return this.block?.customFields?.minHeight || '500px';
            },
            set(value) {
                this.updateCustomField('minHeight', value);
            },
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
    },

    watch: {
        'block.type': {
            handler() {
                this.initializeBlockConfig();
            },
            immediate: true,
        },
        videoMediaId: {
            handler(newValue) {
                if (newValue) {
                    this.loadVideoMedia(newValue);
                } else {
                    this.videoMedia = null;
                }
            },
            immediate: true,
        },
        posterMediaId: {
            handler(newValue) {
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
        initializeBlockConfig() {
            if (!this.block) {
                return;
            }

            if (!this.block.customFields) {
                this.block.customFields = {};
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

            Object.keys(defaults).forEach((key) => {
                if (this.block.customFields[key] === undefined) {
                    this.block.customFields[key] = defaults[key];
                }
            });
        },

        updateCustomField(key, value) {
            if (!this.block) {
                return;
            }

            if (!this.block.customFields) {
                this.block.customFields = {};
            }

            this.block.customFields[key] = value;
            this.$emit('block-update');
        },

        async loadVideoMedia(mediaId) {
            if (!mediaId) {
                this.videoMedia = null;
                return;
            }

            try {
                this.videoMedia = await this.mediaRepository.get(mediaId, Shopware.Context.api);
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
            } catch (e) {
                console.warn('[Hero Video Extended Config] Could not load poster media:', e);
                this.posterMedia = null;
            }
        },

        onVideoSelectionChange(selection) {
            if (selection && selection.length > 0) {
                const media = selection[0];
                
                // Check file size (warn if > 2MB)
                if (media.fileSize && media.fileSize > 2 * 1024 * 1024) {
                    this.showFileSizeWarning = true;
                } else {
                    this.showFileSizeWarning = false;
                }
                
                this.videoMediaId = media.id;
                this.videoMedia = media;
            }
        },

        onVideoUploadFinish({ targetId }) {
            this.videoMediaId = targetId;
            this.loadVideoMedia(targetId);
        },

        onRemoveVideo() {
            this.videoMediaId = null;
            this.videoMedia = null;
            this.showFileSizeWarning = false;
        },

        onPosterSelectionChange(selection) {
            if (selection && selection.length > 0) {
                this.posterMediaId = selection[0].id;
                this.posterMedia = selection[0];
            }
        },

        onPosterUploadFinish({ targetId }) {
            this.posterMediaId = targetId;
            this.loadPosterMedia(targetId);
        },

        onRemovePoster() {
            this.posterMediaId = null;
            this.posterMedia = null;
        },

        onOverlayTextChange(value) {
            this.updateCustomField('overlayText', value);
        },

        dismissFileSizeWarning() {
            this.showFileSizeWarning = false;
        },
    },
};
