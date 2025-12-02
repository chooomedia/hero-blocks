/**
 * Hero Video Extended Block - Admin Component
 * 
 * Reactive preview in CMS Editor with overlay positioning
 */
import template from './sw-cms-block-hero-video-extended.html.twig';
import './sw-cms-block-hero-video-extended.scss';

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
            videoUrl: null,
            posterUrl: null,
        };
    },

    computed: {
        mediaRepository() {
            return this.repositoryFactory.create('media');
        },

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

        videoMediaId() {
            return this.block?.customFields?.videoMediaId || null;
        },

        posterMediaId() {
            return this.block?.customFields?.posterMediaId || null;
        },

        overlayClasses() {
            return {
                'sw-cms-block-hero-video-extended__overlay--top-left': this.overlayPosition === 'top-left',
                'sw-cms-block-hero-video-extended__overlay--middle-left': this.overlayPosition === 'middle-left',
                'sw-cms-block-hero-video-extended__overlay--bottom-left': this.overlayPosition === 'bottom-left',
                'sw-cms-block-hero-video-extended__overlay--top-right': this.overlayPosition === 'top-right',
                'sw-cms-block-hero-video-extended__overlay--middle-right': this.overlayPosition === 'middle-right',
                'sw-cms-block-hero-video-extended__overlay--bottom-right': this.overlayPosition === 'bottom-right',
            };
        },

        overlayStyles() {
            const styles = {};
            
            if (this.overlayBackgroundColor) {
                styles.backgroundColor = this.overlayBackgroundColor;
            }
            
            if (this.overlayTextColor) {
                styles.color = this.overlayTextColor;
            }
            
            return styles;
        },

        hasOverlayContent() {
            return this.overlayHeadline || this.overlayText;
        },
    },

    watch: {
        videoMediaId: {
            handler(newValue) {
                if (newValue) {
                    this.loadVideoMedia(newValue);
                } else {
                    this.videoUrl = null;
                }
            },
            immediate: true,
        },
        posterMediaId: {
            handler(newValue) {
                if (newValue) {
                    this.loadPosterMedia(newValue);
                } else {
                    this.posterUrl = null;
                }
            },
            immediate: true,
        },
    },

    methods: {
        async loadVideoMedia(mediaId) {
            if (!mediaId) {
                this.videoUrl = null;
                return;
            }

            try {
                const media = await this.mediaRepository.get(mediaId, Shopware.Context.api);
                if (media) {
                    this.videoUrl = media.url;
                }
            } catch (e) {
                console.warn('[Hero Video Extended] Could not load video media:', e);
                this.videoUrl = null;
            }
        },

        async loadPosterMedia(mediaId) {
            if (!mediaId) {
                this.posterUrl = null;
                return;
            }

            try {
                const media = await this.mediaRepository.get(mediaId, Shopware.Context.api);
                if (media) {
                    this.posterUrl = media.url;
                }
            } catch (e) {
                console.warn('[Hero Video Extended] Could not load poster media:', e);
                this.posterUrl = null;
            }
        },
    },
};
