import template from './sw-cms-el-config-hero-timeline.html.twig';
import './sw-cms-el-config-hero-timeline.scss';

const { Mixin } = Shopware;
const Criteria = Shopware.Data.Criteria;

export default {
    template,

    inject: ['repositoryFactory'],

    mixins: [Mixin.getByName('cms-element'), Mixin.getByName('notification')],

    emits: ['element-update'],

    props: {
        element: {
            type: Object,
            required: true,
        },
    },

    data() {
        return {
            mediaModalIsOpen: false,
            mediaModalItemIndex: null,
        };
    },

    computed: {
        mediaRepository() {
            return this.repositoryFactory.create('media');
        },

        timelineItems() {
            if (!this.element?.config?.timelineItems) {
                return [];
            }
            return this.element.config.timelineItems.value || [];
        },

        uploadTag() {
            return `cms-hero-timeline-${this.element?.id || 'new'}`;
        },

        defaultFolderName() {
            return this.cmsPageState?.pageEntityName || 'cms_page';
        },

        mediaCriteria() {
            return new Criteria(1, 100);
        },
    },

    created() {
        this.initElementConfig('hero-timeline');
        // Sicherstellen, dass timelineItems existiert
        if (!this.element.config) {
            this.element.config = {};
        }
        if (!this.element.config.timelineItems) {
            this.element.config.timelineItems = {
                source: 'static',
                value: [],
            };
        }
        if (!this.element.config.timelineItems.value) {
            this.element.config.timelineItems.value = [];
        }
    },

    methods: {
        emitUpdate() {
            this.$emit('element-update', this.element);
        },

        addTimelineItem() {
            if (!this.element.config.timelineItems.value) {
                this.element.config.timelineItems.value = [];
            }
            this.element.config.timelineItems.value.push({
                year: '',
                title: '',
                text: '',
                media: [],
            });
            this.emitUpdate();
        },

        removeTimelineItem(index) {
            if (index < 0 || index >= this.timelineItems.length) {
                return;
            }
            this.element.config.timelineItems.value.splice(index, 1);
            this.emitUpdate();
        },

        onOpenMediaModal(index) {
            this.mediaModalItemIndex = index;
            this.mediaModalIsOpen = true;
        },

        onCloseMediaModal() {
            this.mediaModalIsOpen = false;
            this.mediaModalItemIndex = null;
        },

        async onMediaSelectionChange(selection) {
            if (this.mediaModalItemIndex === null) {
                return;
            }

            const item = this.timelineItems[this.mediaModalItemIndex];
            if (!item) {
                return;
            }

            // Media als einfaches Array ohne entity-Referenz speichern
            item.media = selection.map((media) => ({
                mediaId: media.id,
                mediaUrl: media.url,
            }));

            this.emitUpdate();
            this.onCloseMediaModal();
        },

        removeMediaFromItem(itemIndex, mediaIndex) {
            const item = this.timelineItems[itemIndex];
            if (!item || !item.media) {
                return;
            }
            item.media.splice(mediaIndex, 1);
            this.emitUpdate();
        },

        async loadMediaItems(mediaIds = []) {
            if (!mediaIds.length) {
                return [];
            }

            const criteria = this.mediaCriteria;
            criteria.setIds(mediaIds);

            try {
                return await this.mediaRepository.search(criteria);
            } catch (error) {
                console.error('[HeroTimeline] loadMediaItems failed', error);
                return [];
            }
        },
    },
};
