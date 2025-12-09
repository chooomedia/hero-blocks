import template from './sw-cms-el-hero-timeline.html.twig';
import './sw-cms-el-hero-timeline.scss';

const { Mixin } = Shopware;

/**
 * Hero Timeline Element Component
 * 
 * Displays the timeline in the CMS editor with reactive data updates.
 * When items are added/removed in the config, this preview updates automatically.
 */
export default {
    template,

    mixins: [
        Mixin.getByName('cms-element'),
    ],

    props: {
        element: {
            type: Object,
            required: true,
        },
    },

    data() {
        return {
            activeIndex: 0,
        };
    },

    created() {
        // Initialize element config if not present
        this.initElementConfig('hero-timeline');
        
        // Debug: Log element data
        console.log('[HeroTimeline Component] created - element:', this.element);
        console.log('[HeroTimeline Component] created - element.config:', this.element?.config);
        console.log('[HeroTimeline Component] created - element.config.timelineItems:', this.element?.config?.timelineItems);
    },

    computed: {
        /**
         * Get timeline items from element data or config
         * Reactive: Updates when config changes
         * Priority: data > config > empty array
         */
        timelineItems() {
            // Debug logging
            console.log('[HeroTimeline Component] timelineItems computed');
            console.log('[HeroTimeline Component] element.data:', this.element?.data);
            console.log('[HeroTimeline Component] element.config:', this.element?.config);
            console.log('[HeroTimeline Component] element.config.timelineItems:', this.element?.config?.timelineItems);
            
            // First check element.data (from TypeDataResolver)
            if (this.element?.data?.timelineItems && Array.isArray(this.element.data.timelineItems) && this.element.data.timelineItems.length > 0) {
                console.log('[HeroTimeline Component] Using element.data.timelineItems:', this.element.data.timelineItems);
                return this.element.data.timelineItems;
            }
            // Then check element.config (from database)
            if (this.element?.config?.timelineItems?.value && Array.isArray(this.element.config.timelineItems.value)) {
                console.log('[HeroTimeline Component] Using element.config.timelineItems.value:', this.element.config.timelineItems.value);
                return this.element.config.timelineItems.value;
            }
            console.log('[HeroTimeline Component] No timeline items found, returning empty array');
            return [];
        },

        /**
         * Check if we have items to display
         */
        hasItems() {
            return this.timelineItems.length > 0;
        },

        /**
         * Get the currently active item
         */
        activeItem() {
            if (!this.hasItems) {
                return null;
            }
            return this.timelineItems[this.activeIndex] || this.timelineItems[0];
        },
    },

    watch: {
        /**
         * Reset active index when items change
         */
        'timelineItems.length'(newLength) {
            if (this.activeIndex >= newLength) {
                this.activeIndex = Math.max(0, newLength - 1);
            }
        },
    },

    methods: {
        /**
         * Set active timeline item
         */
        setActiveItem(index) {
            if (index >= 0 && index < this.timelineItems.length) {
                this.activeIndex = index;
            }
        },

        /**
         * Check if item is active
         */
        isActive(index) {
            return this.activeIndex === index;
        },

        /**
         * Get media count for an item
         */
        getMediaCount(item) {
            if (!item.media || !Array.isArray(item.media)) {
                return 0;
            }
            return item.media.length;
        },

        /**
         * Get first media URL for preview
         * Supports both 'url' and 'mediaUrl' property names
         */
        getFirstMediaUrl(item) {
            if (!item.media || !Array.isArray(item.media) || item.media.length === 0) {
                return null;
            }
            const firstMedia = item.media[0];
            // Support both property names: url (from media entity) and mediaUrl (from config)
            return firstMedia?.url || firstMedia?.mediaUrl || firstMedia?.thumbnails?.[0]?.url || null;
        },

        /**
         * Get text preview (truncated)
         */
        getTextPreview(item) {
            const text = item.text || this.$tc('sw-cms.elements.heroTimeline.placeholder.text');
            // Strip HTML tags and truncate
            const plainText = text.replace(/<[^>]*>/g, '');
            if (plainText.length > 150) {
                return plainText.substring(0, 150) + '...';
            }
            return plainText;
        },
    },
};
