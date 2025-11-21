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
        $tempFileName = null;
        $restructuredZipPath = null;
        
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
            $fileContent = $response->getContent();
            if (empty($fileContent)) {
                throw new \RuntimeException('Downloaded file is empty');
            }
            
            file_put_contents($tempFileName, $fileContent);
            
            if (!file_exists($tempFileName) || filesize($tempFileName) === 0) {
                throw new \RuntimeException('Downloaded file is empty or does not exist');
            }

            $this->logger->info('Update download: File downloaded successfully', [
                'file' => $tempFileName,
                'size' => filesize($tempFileName),
            ]);

                // WICHTIG: Prüfe ob ZIP-Datei gültig ist (vor Restrukturierung)
            $zip = new \ZipArchive();
            if ($zip->open($tempFileName) !== true) {
                throw new \RuntimeException('Invalid ZIP file format');
            }
            $zip->close();

            // WICHTIG: Restrukturiere ZIP für Shopware (GitHub ZIPs haben falsche Struktur)
            // GitHub ZIPs: hero-blocks-1.0.2/HeroBlocks/composer.json
            // Shopware braucht: HeroBlocks/composer.json (Plugin-Name als Root)
            try {
                $restructuredZipPath = $this->restructureZipForShopware($tempFileName);
                $zipToUse = $restructuredZipPath ?? $tempFileName; // Fallback auf Original wenn Restrukturierung fehlschlägt
                
                if ($restructuredZipPath === null) {
                    $this->logger->warning('Update download: ZIP restructuring failed, using original ZIP');
                } else {
                    $this->logger->info('Update download: ZIP restructured for Shopware', [
                        'original' => $tempFileName,
                        'restructured' => $restructuredZipPath,
                    ]);
                }
            } catch (\Exception $restructureException) {
                $this->logger->warning('Update download: ZIP restructuring exception', [
                    'error' => $restructureException->getMessage(),
                ]);
                $zipToUse = $tempFileName; // Fallback auf Original
            }

            // WICHTIG: Erstelle UploadedFile aus ZIP (restrukturiert oder original)
            // Shopware PluginManagementService benötigt UploadedFile
            $originalName = basename(parse_url($downloadUrl, PHP_URL_PATH)) ?: 'hero-blocks-update.zip';
            $uploadedFile = new UploadedFile(
                $zipToUse,
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

        } catch (\Exception $e) {
            $this->logger->error('Update download failed', [
                'error' => $e->getMessage(),
                'errorType' => get_class($e),
                'trace' => $e->getTraceAsString(),
            ]);

            // User-freundliche Fehlermeldung
            $errorMessage = $e->getMessage();
            if (str_contains($errorMessage, 'HTTP')) {
                $errorMessage = 'Download fehlgeschlagen. Bitte prüfen Sie Ihre Internetverbindung und versuchen Sie es erneut.';
            } elseif (str_contains($errorMessage, 'ZIP')) {
                $errorMessage = 'ZIP-Datei ist ungültig. Bitte kontaktieren Sie den Support.';
            }

            return new JsonResponse([
                'success' => false,
                'error' => $errorMessage,
                'errorDetails' => $e->getMessage(), // Für Debugging
            ], 500);
        } finally {
            // WICHTIG: Temporäre Dateien löschen
            if ($tempFileName !== null && file_exists($tempFileName)) {
                @unlink($tempFileName);
            }
            if ($restructuredZipPath !== null && file_exists($restructuredZipPath)) {
                @unlink($restructuredZipPath);
            }
        }
    }

    /**
     * Restrukturiert ZIP-Archiv für Shopware-Kompatibilität
     * 
     * GitHub Release ZIPs haben Struktur: hero-blocks-1.0.2/HeroBlocks/composer.json
     * Shopware benötigt: HeroBlocks/composer.json (Plugin-Name als Root)
     * 
     * @param string $zipPath Pfad zur originalen ZIP-Datei
     * @return string|null Pfad zur restrukturierten ZIP-Datei oder null bei Fehler
     */
    private function restructureZipForShopware(string $zipPath): ?string
    {
        try {
            $zip = new \ZipArchive();
            
            if ($zip->open($zipPath) !== true) {
                $this->logger->error('Update download: Failed to open ZIP archive', [
                    'path' => $zipPath,
                ]);
                return null;
            }

            // Prüfe ob ZIP leer ist
            if ($zip->numFiles === 0) {
                $zip->close();
                $this->logger->error('Update download: ZIP archive is empty');
                return null;
            }

            // Prüfe erste Eintrag im ZIP (sollte Plugin-Verzeichnis sein)
            $firstEntry = $zip->statIndex(0);
            if ($firstEntry === false) {
                $zip->close();
                $this->logger->error('Update download: Failed to read first ZIP entry');
                return null;
            }

            $firstEntryName = $firstEntry['name'];
            $this->logger->info('Update download: Analyzing ZIP structure', [
                'first_entry' => $firstEntryName,
                'total_files' => $zip->numFiles,
            ]);

            // Prüfe ob ZIP bereits korrekte Struktur hat (HeroBlocks/composer.json)
            $pluginName = 'HeroBlocks';
            $composerPath = $pluginName . '/composer.json';
            
            if ($zip->statName($composerPath) !== false) {
                // ZIP hat bereits korrekte Struktur
                $zip->close();
                $this->logger->info('Update download: ZIP already has correct structure');
                return $zipPath;
            }

            // Finde Plugin-Verzeichnis im ZIP (suche nach composer.json mit Plugin-Name)
            $pluginDirectory = null;
            $rootPrefix = null;
            
            // Liste alle Dateien für Debugging
            $allEntries = [];
            for ($i = 0; $i < $zip->numFiles && $i < 50; $i++) { // Limitiere auf 50 für Performance
                $entry = $zip->statIndex($i);
                if ($entry !== false) {
                    $allEntries[] = $entry['name'];
                }
            }
            
            $this->logger->info('Update download: Analyzing ZIP entries', [
                'total_files' => $zip->numFiles,
                'first_50_entries' => $allEntries,
            ]);
            
            // Suche nach composer.json im Plugin-Verzeichnis
            // WICHTIG: Suche nach composer.json, das im Plugin-Verzeichnis liegt
            for ($i = 0; $i < $zip->numFiles; $i++) {
                $entry = $zip->statIndex($i);
                if ($entry === false) {
                    continue;
                }

                $entryName = $entry['name'];
                
                // Suche nach composer.json (kann in verschiedenen Pfaden sein)
                // Normalisiere Pfad (entferne führende/trailing slashes)
                $normalizedPath = trim($entryName, '/');
                
                if (str_ends_with($normalizedPath, 'composer.json')) {
                    // Extrahiere Plugin-Verzeichnis
                    // Beispiele:
                    // - hero-blocks-1.0.2/HeroBlocks/composer.json -> HeroBlocks
                    // - hero-blocks-1.0.2/hero-blocks/composer.json -> hero-blocks
                    // - HeroBlocks/composer.json -> HeroBlocks (korrekt)
                    $parts = explode('/', $normalizedPath);
                    
                    if (count($parts) >= 2) {
                        // Letzter Teil ist composer.json, vorletzter ist Plugin-Verzeichnis
                        $foundPluginDir = $parts[count($parts) - 2];
                        
                        // Prüfe ob es HeroBlocks oder ähnlich ist (case-insensitive)
                        // WICHTIG: Akzeptiere verschiedene Varianten des Plugin-Namens
                        if (strcasecmp($foundPluginDir, $pluginName) === 0 || 
                            strcasecmp($foundPluginDir, 'hero-blocks') === 0 ||
                            strcasecmp($foundPluginDir, 'heroblocks') === 0) {
                            $pluginDirectory = $foundPluginDir;
                            // Root-Prefix ist alles vor dem Plugin-Verzeichnis
                            $rootPrefixParts = array_slice($parts, 0, -2);
                            $rootPrefix = !empty($rootPrefixParts) ? implode('/', $rootPrefixParts) . '/' : '';
                            
                            $this->logger->info('Update download: Found composer.json in plugin directory', [
                                'composer_path' => $entryName,
                                'plugin_directory' => $pluginDirectory,
                                'root_prefix' => $rootPrefix,
                            ]);
                            break;
                        }
                    }
                }
            }

            // Fallback: Versuche direkt nach Plugin-Name zu suchen
            if ($pluginDirectory === null) {
                $this->logger->warning('Update download: composer.json with plugin name not found, trying direct search');
                
                for ($i = 0; $i < $zip->numFiles; $i++) {
                    $entry = $zip->statIndex($i);
                    if ($entry === false) {
                        continue;
                    }
                    
                    $entryName = $entry['name'];
                    $parts = explode('/', trim($entryName, '/'));
                    
                    // Suche nach Verzeichnis mit Plugin-Name
                    foreach ($parts as $idx => $part) {
                        if (strcasecmp($part, $pluginName) === 0 || 
                            strcasecmp($part, 'hero-blocks') === 0) {
                            $pluginDirectory = $part;
                            $rootPrefix = implode('/', array_slice($parts, 0, $idx));
                            if (!empty($rootPrefix)) {
                                $rootPrefix .= '/';
                            }
                            break 2;
                        }
                    }
                }
            }

            if ($pluginDirectory === null) {
                $zip->close();
                $this->logger->error('Update download: Plugin directory not found in ZIP', [
                    'expected' => $pluginName,
                    'first_entry' => $firstEntryName,
                    'sample_entries' => array_slice($allEntries, 0, 10),
                ]);
                return null;
            }

            if ($rootPrefix === null) {
                $rootPrefix = $firstEntryName; // Fallback auf ersten Eintrag
            }
            
            $this->logger->info('Update download: Found plugin directory', [
                'plugin_directory' => $pluginDirectory,
                'root_prefix' => $rootPrefix,
            ]);

            // Erstelle neue restrukturierte ZIP-Datei
            $restructuredZipPath = sys_get_temp_dir() . '/' . uniqid('hero-blocks-restructured-', true) . '.zip';
            $newZip = new \ZipArchive();
            
            if ($newZip->open($restructuredZipPath, \ZipArchive::CREATE | \ZipArchive::OVERWRITE) !== true) {
                $zip->close();
                return null;
            }

            // Kopiere alle Dateien aus Plugin-Verzeichnis ins Root der neuen ZIP
            // WICHTIG: Verwende $pluginDirectory (gefunden) statt $pluginName (erwartet)
            $pluginPrefix = $rootPrefix . $pluginDirectory . '/'; // z.B. hero-blocks-1.0.2/HeroBlocks/
            
            $this->logger->info('Update download: Copying files from plugin directory', [
                'plugin_prefix' => $pluginPrefix,
                'plugin_directory' => $pluginDirectory,
                'root_prefix' => $rootPrefix,
            ]);

            $filesCopied = 0;
            for ($i = 0; $i < $zip->numFiles; $i++) {
                $entry = $zip->statIndex($i);
                if ($entry === false) {
                    continue;
                }

                $entryName = $entry['name'];
                
                // Nur Dateien aus Plugin-Verzeichnis kopieren
                if (!str_starts_with($entryName, $pluginPrefix)) {
                    continue;
                }

                // Entferne Root-Prefix (hero-blocks-1.0.2/HeroBlocks/src/ -> HeroBlocks/src/)
                // WICHTIG: Behalte Plugin-Name als Root
                $newEntryName = str_replace($rootPrefix, '', $entryName);
                
                // WICHTIG: Normalisiere Pfad (entferne doppelte Slashes)
                $newEntryName = str_replace('//', '/', $newEntryName);
                
                // Prüfe ob es ein Verzeichnis oder eine Datei ist
                if (str_ends_with($entryName, '/')) {
                    // Verzeichnis - nur hinzufügen wenn nicht leer
                    if ($newEntryName !== '/' && $newEntryName !== '') {
                        $newZip->addEmptyDir(rtrim($newEntryName, '/'));
                    }
                } else {
                    // Datei
                    $fileContent = $zip->getFromIndex($i);
                    if ($fileContent !== false) {
                        $newZip->addFromString($newEntryName, $fileContent);
                        $filesCopied++;
                    }
                }
            }
            
            $this->logger->info('Update download: Files copied to restructured ZIP', [
                'files_copied' => $filesCopied,
            ]);

            // WICHTIG: Prüfe ob neue ZIP korrekte Struktur hat
            // Shopware erwartet: PluginName/composer.json (z.B. HeroBlocks/composer.json)
            // Verwende $pluginDirectory (gefunden) statt $pluginName (erwartet) für Flexibilität
            $expectedComposerPath = $pluginDirectory . '/composer.json';
            
            if ($newZip->statName($expectedComposerPath) === false) {
                // Fallback: Prüfe auch mit erwartetem Plugin-Namen
                if ($newZip->statName($composerPath) === false) {
                    // Liste alle Einträge für Debugging
                    $allNewEntries = [];
                    for ($j = 0; $j < $newZip->numFiles && $j < 20; $j++) {
                        $newEntry = $newZip->statIndex($j);
                        if ($newEntry !== false) {
                            $allNewEntries[] = $newEntry['name'];
                        }
                    }
                    
                    $newZip->close();
                    $zip->close();
                    @unlink($restructuredZipPath);
                    $this->logger->error('Update download: Restructured ZIP missing composer.json', [
                        'expected' => $expectedComposerPath,
                        'fallback_expected' => $composerPath,
                        'files_copied' => $filesCopied,
                        'sample_entries' => $allNewEntries,
                    ]);
                    return null;
                }
            }

            $newZip->close();
            $zip->close();

            $this->logger->info('Update download: ZIP restructured successfully', [
                'original' => $zipPath,
                'restructured' => $restructuredZipPath,
                'plugin_directory' => $pluginDirectory,
            ]);

            return $restructuredZipPath;
            
        } catch (\Exception $e) {
            // WICHTIG: Schließe ZIP-Archive bei Fehler
            if (isset($zip) && $zip instanceof \ZipArchive) {
                @$zip->close();
            }
            if (isset($newZip) && $newZip instanceof \ZipArchive) {
                @$newZip->close();
            }
            
            $this->logger->error('Update download: ZIP restructuring exception', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            
            return null;
        }
    }
}
