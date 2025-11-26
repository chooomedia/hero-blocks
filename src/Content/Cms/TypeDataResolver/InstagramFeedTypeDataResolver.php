<?php declare(strict_types=1);

namespace HeroBlocks\Content\Cms\TypeDataResolver;

use Shopware\Core\Content\Cms\Aggregate\CmsSlot\CmsSlotEntity;
use Shopware\Core\Content\Cms\DataResolver\CriteriaCollection;
use Shopware\Core\Content\Cms\DataResolver\Element\AbstractCmsElementResolver;
use Shopware\Core\Content\Cms\DataResolver\Element\ElementDataCollection;
use Shopware\Core\Content\Cms\DataResolver\ResolverContext\ResolverContext;
use Shopware\Core\System\SystemConfig\SystemConfigService;

/**
 * Hero Instagram Feed TypeDataResolver
 * 
 * WICHTIG: Lädt Instagram Posts aus API (oder Cache/Demo-Daten)
 * Gemäß Shopware Best Practices für Custom CMS Element Resolver
 */
class InstagramFeedTypeDataResolver extends AbstractCmsElementResolver
{
    private SystemConfigService $systemConfigService;

    public function __construct(SystemConfigService $systemConfigService)
    {
        $this->systemConfigService = $systemConfigService;
    }

    public function getType(): string
    {
        return 'hero-instagram-feed'; // Hero Instagram Feed Block Type
    }

    public function collect(CmsSlotEntity $slot, ResolverContext $resolverContext): ?CriteriaCollection
    {
        // WICHTIG: Instagram Posts kommen von externer API, nicht aus DAL
        // Daher keine CriteriaCollection nötig
        return null;
    }

    public function enrich(CmsSlotEntity $slot, ResolverContext $resolverContext, ElementDataCollection $result): void
    {
        // WICHTIG: Hole Block-Config aus customFields (wurde in Admin gesetzt)
        $block = $slot->getBlock();
        if (!$block) {
            return;
        }

        $customFields = $block->getCustomFields();
        if (!$customFields) {
            $customFields = [];
        }

        // Config-Werte aus Block customFields
        $postLimit = $customFields['postLimit'] ?? $this->getSystemConfigPostLimit();
        $displayMode = $customFields['displayMode'] ?? 'grid';
        $columns = $customFields['columns'] ?? 4;
        $showCaptions = $customFields['showCaptions'] ?? true;
        $showLikes = $customFields['showLikes'] ?? false;
        $showComments = $customFields['showComments'] ?? false;

        // WICHTIG: Instagram Posts laden (aus Cache, API oder Demo-Daten)
        $instagramPosts = $this->loadInstagramPosts($postLimit);

        // WICHTIG: Daten in slot.data speichern (für Template-Zugriff)
        $data = new \stdClass();
        $data->instagramPosts = $instagramPosts;
        $data->config = [
            'postLimit' => $postLimit,
            'displayMode' => $displayMode,
            'columns' => $columns,
            'showCaptions' => $showCaptions,
            'showLikes' => $showLikes,
            'showComments' => $showComments,
        ];

        $slot->setData($data);
    }

    /**
     * Lade Instagram Posts aus API, Cache oder Demo-Daten
     * 
     * WICHTIG: In Production mit Instagram Graph API arbeiten
     * Für Development: Demo-Daten verwenden
     */
    private function loadInstagramPosts(int $limit): array
    {
        // WICHTIG: Prüfe ob Instagram API Credentials vorhanden sind
        $instagramAccessToken = $this->systemConfigService->get('HeroBlocks.config.instagramAccessToken');
        $instagramUserId = $this->systemConfigService->get('HeroBlocks.config.instagramUserId');

        if ($instagramAccessToken && $instagramUserId) {
            // TODO: Instagram Graph API Call implementieren
            // https://developers.facebook.com/docs/instagram-basic-display-api
            return $this->loadInstagramPostsFromApi($instagramAccessToken, $instagramUserId, $limit);
        }

        // Fallback: Demo-Daten für Development/Testing
        return $this->getDemoPosts($limit);
    }

    /**
     * Lade Instagram Posts von API (Production)
     * 
     * WICHTIG: Instagram Graph API Dokumentation:
     * https://developers.facebook.com/docs/instagram-basic-display-api/reference/media
     */
    private function loadInstagramPostsFromApi(string $accessToken, string $userId, int $limit): array
    {
        try {
            // WICHTIG: Instagram Graph API Endpoint
            $url = "https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp&access_token={$accessToken}&limit={$limit}";

            // WICHTIG: cURL Request (oder Symfony HttpClient)
            $ch = curl_init($url);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
            curl_setopt($ch, CURLOPT_TIMEOUT, 10);
            
            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);

            if ($httpCode !== 200) {
                // API Error - Fallback zu Demo-Daten
                return $this->getDemoPosts($limit);
            }

            $data = json_decode($response, true);
            
            if (!isset($data['data']) || !is_array($data['data'])) {
                // Ungültige Response - Fallback zu Demo-Daten
                return $this->getDemoPosts($limit);
            }

            return array_slice($data['data'], 0, $limit);

        } catch (\Exception $e) {
            // API Error - Fallback zu Demo-Daten
            return $this->getDemoPosts($limit);
        }
    }

    /**
     * Demo-Daten für Development/Testing
     * 
     * WICHTIG: Generiert Platzhalter-Posts mit Shopware Standard-Bildern
     * In Production sollten echte Instagram Posts verwendet werden
     */
    private function getDemoPosts(int $limit): array
    {
        $demoPosts = [];
        
        // Platzhalter-Bilder (Shopware Standard Assets)
        $placeholderImages = [
            '/bundles/administration/static/img/cms/preview_mountain_large.jpg',
            '/bundles/administration/static/img/cms/preview_glasses_large.jpg',
            '/bundles/administration/static/img/cms/preview_plant_large.jpg',
            '/bundles/administration/static/img/cms/preview_camera_large.jpg',
            '/bundles/administration/static/img/cms/preview_mountain_small.jpg',
            '/bundles/administration/static/img/cms/preview_glasses_small.jpg',
        ];

        $captions = [
            'Beautiful mountain view 🏔️ #nature #mountains',
            'Summer vibes ☀️ #fashion #style',
            'Green inspiration 🌿 #plants #interior',
            'Capturing moments 📷 #photography',
            'Adventure awaits ⛰️ #travel #hiking',
            'Urban style 🕶️ #streetwear #fashion',
        ];

        for ($i = 0; $i < $limit; $i++) {
            $index = $i % count($placeholderImages);
            $demoPosts[] = [
                'id' => 'demo_' . ($i + 1),
                'caption' => $captions[$index],
                'media_type' => ($i % 5 === 0) ? 'VIDEO' : 'IMAGE', // Jeder 5. Post ist Video
                'media_url' => $placeholderImages[$index],
                'thumbnail_url' => $placeholderImages[$index],
                'permalink' => 'https://www.instagram.com/p/demo_' . ($i + 1),
                'timestamp' => date('Y-m-d\TH:i:s', strtotime('-' . $i . ' days')),
                'like_count' => rand(100, 10000),
                'comments_count' => rand(5, 500),
            ];
        }

        return $demoPosts;
    }

    /**
     * Hole Post Limit aus System-Config
     */
    private function getSystemConfigPostLimit(): int
    {
        $limit = $this->systemConfigService->get('HeroBlocks.config.instagramFeedLimit');
        return (int) ($limit ?? 12);
    }
}

