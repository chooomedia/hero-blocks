/**
 * Hero Video Extended Block - Preview Component (Sidebar)
 * 
 * WICHTIG: Zeigt Vorschau wie große Vorschau mit schrägem Overlay unten rechts
 */
import template from './sw-cms-preview-hero-video-extended.html.twig';
import './sw-cms-preview-hero-video-extended.scss';

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

        overlayHeadline() {
            return this.block?.customFields?.overlayHeadline || 'Hero Video';
        },

        overlayText() {
            return this.block?.customFields?.overlayText || 'Extended';
        },

        videoMediaId() {
            return this.block?.customFields?.videoMediaId || null;
        },

        posterMediaId() {
            return this.block?.customFields?.posterMediaId || null;
        },

        hasVideo() {
            return !!this.videoUrl || !!this.videoMediaId;
        },

        hasPoster() {
            return !!this.posterUrl || !!this.posterMediaId;
        },

        overlayClasses() {
            return {
                [`sw-cms-preview-hero-video-extended__overlay--${this.overlayPosition}`]: true,
            };
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
                this.posterUrl = null;
            }
        },
    },
};
