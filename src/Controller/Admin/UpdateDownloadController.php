<?php declare(strict_types=1);

namespace HeroBlocks\Controller\Admin;

use HeroBlocks\Service\UpdateCheckService;
use Shopware\Core\Framework\Context;
use Shopware\Core\Framework\DataAbstractionLayer\EntityRepository;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Criteria;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Filter\EqualsFilter;
use Shopware\Core\Framework\Plugin\PluginEntity;
use Shopware\Core\Framework\Plugin\PluginLifecycleService;
use Shopware\Core\Framework\Plugin\PluginManagementService;
use Shopware\Core\Framework\Plugin\PluginService;
use Shopware\Core\System\SystemConfig\SystemConfigService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Contracts\HttpClient\HttpClientInterface;
use Psr\Log\LoggerInterface;
use Composer\IO\NullIO;

/**
 * Update Download Controller
 * 
 * API-Endpunkt zum Download und Installieren von Plugin-Updates
 * Gemäß Shopware Best Practices für Plugin-Downloads
 */
#[Route(defaults: ['_routeScope' => ['api'], '_acl' => ['system.plugin_maintain']])]
class UpdateDownloadController extends AbstractController
{
    private UpdateCheckService $updateCheckService;
    private SystemConfigService $systemConfigService;
    private PluginManagementService $pluginManagementService;
    private PluginService $pluginService;
    private PluginLifecycleService $pluginLifecycleService;
    private EntityRepository $pluginRepository;
    private HttpClientInterface $httpClient;
    private LoggerInterface $logger;

    public function __construct(
        UpdateCheckService $updateCheckService,
        SystemConfigService $systemConfigService,
        PluginManagementService $pluginManagementService,
        PluginService $pluginService,
        PluginLifecycleService $pluginLifecycleService,
        EntityRepository $pluginRepository,
        HttpClientInterface $httpClient,
        LoggerInterface $logger
    ) {
        $this->updateCheckService = $updateCheckService;
        $this->systemConfigService = $systemConfigService;
        $this->pluginManagementService = $pluginManagementService;
        $this->pluginService = $pluginService;
        $this->pluginLifecycleService = $pluginLifecycleService;
        $this->pluginRepository = $pluginRepository;
        $this->httpClient = $httpClient;
        $this->logger = $logger;
    }

    /**
     * Downloadt und installiert Plugin-Update von downloadUrl
     * 
     * POST /api/_action/hero-blocks/update-download
     */
    #[Route(
        path: '/api/_action/hero-blocks/update-download',
        name: 'api.action.hero-blocks.update-download',
        methods: ['POST']
    )]
    public function downloadAndInstallUpdate(Request $request, Context $context): JsonResponse
    {
        try {
            // WICHTIG: Prüfe ob License abgelaufen ist
            $licenseStatus = $this->systemConfigService->get('HeroBlocks.config.licenseStatus');
            $isLicenseExpired = ($licenseStatus === 'expired');
            
            if ($isLicenseExpired) {
                return new JsonResponse([
                    'success' => false,
                    'error' => 'License expired - Updates können nicht mehr heruntergeladen werden. Bitte verlängern Sie Ihre Lizenz.',
                ], 403);
            }

            // Hole downloadUrl aus System Config
            $downloadUrl = $this->systemConfigService->get('HeroBlocks.config.updateDownloadUrl');
            
            if (empty($downloadUrl)) {
                return new JsonResponse([
                    'success' => false,
                    'error' => 'No download URL available. Please check for updates first.',
                ], 400);
            }

            $this->logger->info('Update download: Starting download from URL', [
                'url' => $downloadUrl,
            ]);

            // WICHTIG: Lade ZIP von GitHub Release herunter
            $tempFileName = tempnam(sys_get_temp_dir(), 'hero-blocks-update-');
            if (!\is_string($tempFileName)) {
                throw new \RuntimeException('Failed to create temporary file');
            }

            try {
                // Download ZIP von GitHub Release
                $response = $this->httpClient->request('GET', $downloadUrl, [
                    'timeout' => 300, // 5 Minuten für große ZIP-Dateien
                    'headers' => [
                        'User-Agent' => 'Shopware-HeroBlocks-Plugin/1.0.0',
                        'Accept' => 'application/zip, application/octet-stream',
                    ],
                ]);

                if ($response->getStatusCode() !== 200) {
                    throw new \RuntimeException('Failed to download update: HTTP ' . $response->getStatusCode());
                }

                // Speichere Response in temporäre Datei
                file_put_contents($tempFileName, $response->getContent());
                
                if (!file_exists($tempFileName) || filesize($tempFileName) === 0) {
                    throw new \RuntimeException('Downloaded file is empty or does not exist');
                }

                $this->logger->info('Update download: File downloaded successfully', [
                    'file' => $tempFileName,
                    'size' => filesize($tempFileName),
                ]);

                // WICHTIG: Erstelle UploadedFile aus temporärer Datei
                // Shopware PluginManagementService benötigt UploadedFile
                $originalName = basename($downloadUrl) ?: 'hero-blocks-update.zip';
                $uploadedFile = new UploadedFile(
                    $tempFileName,
                    $originalName,
                    'application/zip',
                    null,
                    true // Test mode = false (echte Datei)
                );

                // WICHTIG: Extrahieren und Plugin aktualisieren
                $this->pluginManagementService->uploadPlugin($uploadedFile, $context);

                $this->logger->info('Update download: Plugin extracted successfully');

                // WICHTIG: Plugin Refresh (erkennt neue Version)
                $this->pluginService->refreshPlugins($context, new NullIO());

                // WICHTIG: Plugin Update durchführen (wenn Upgrade-Version vorhanden)
                $criteria = new Criteria();
                $criteria->addFilter(
                    new EqualsFilter(
                        'baseClass',
                        'HeroBlocks\\HeroBlocks'
                    )
                );
                
                $plugin = $this->pluginRepository->search($criteria, $context)->first();
                
                if ($plugin && $plugin->getUpgradeVersion()) {
                    $this->logger->info('Update download: Upgrading plugin', [
                        'from' => $plugin->getVersion(),
                        'to' => $plugin->getUpgradeVersion(),
                    ]);
                    
                    $this->pluginLifecycleService->updatePlugin($plugin, $context);
                }

                // WICHTIG: Update-Flags zurücksetzen
                $this->systemConfigService->set('HeroBlocks.config.updateAvailable', false);
                $this->systemConfigService->set('HeroBlocks.config.latestVersion', null);
                $this->systemConfigService->set('HeroBlocks.config.updateDownloadUrl', null);

                return new JsonResponse([
                    'success' => true,
                    'message' => 'Update downloaded and installed successfully',
                ]);

            } finally {
                // WICHTIG: Temporäre Datei löschen
                if (file_exists($tempFileName)) {
                    @unlink($tempFileName);
                }
            }

        } catch (\Exception $e) {
            $this->logger->error('Update download failed', [
                'error' => $e->getMessage(),
                'errorType' => get_class($e),
                'trace' => $e->getTraceAsString(),
            ]);

            return new JsonResponse([
                'success' => false,
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
