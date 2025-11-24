<?php declare(strict_types=1);

namespace HeroBlocks\Controller\Admin;

use Shopware\Core\Framework\Context;
use Shopware\Core\Framework\Log\Package;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

/**
 * Feature Validation Controller
 * 
 * Prüft Frontend-Funktionalitäten nach Feature-Aktivierung
 * Schritt-für-Schritt-Validierung mit Debugging-Informationen
 */
#[Package('core')]
#[Route(defaults: ['_routeScope' => ['api']])]
class FeatureValidationController extends AbstractController
{
    /**
     * Prüft ob Theme-Template existiert
     */
    #[Route(
        path: '/api/_action/hero-blocks/check-template/{templateName}',
        name: 'api.action.hero-blocks.check-template',
        methods: ['GET'],
        defaults: ['auth_required' => true]
    )]
    public function checkTemplate(string $templateName, Context $context): JsonResponse
    {
        // Prüfe ob Template existiert (relativ zum Shopware-Root)
        $shopwareRoot = $this->getParameter('kernel.project_dir');
        $templatePath = sprintf(
            '%s/custom/plugins/HorexShopTheme/src/Resources/views/storefront/layout/header/actions/%s.html.twig',
            $shopwareRoot,
            $templateName
        );
        
        $exists = file_exists($templatePath);
        
        return new JsonResponse([
            'success' => true,
            'exists' => $exists,
            'templatePath' => str_replace($shopwareRoot . '/', '', $templatePath),
            'message' => $exists 
                ? 'Template gefunden' 
                : 'Template nicht gefunden (kann normal sein wenn Standard-Template verwendet wird)',
        ]);
    }

    /**
     * Prüft Frontend-Rendering
     */
    #[Route(
        path: '/api/_action/hero-blocks/check-frontend/{componentName}',
        name: 'api.action.hero-blocks.check-frontend',
        methods: ['GET'],
        defaults: ['auth_required' => true]
    )]
    public function checkFrontend(string $componentName, Context $context): JsonResponse
    {
        // Prüfe ob Component im Frontend verfügbar ist
        // TODO: Implementiere echte Frontend-Prüfung (z.B. via Storefront-API)
        
        return new JsonResponse([
            'success' => true,
            'rendered' => true,
            'componentName' => $componentName,
            'message' => 'Frontend-Rendering-Prüfung abgeschlossen (Mock)',
        ]);
    }

    /**
     * Prüft JavaScript-Plugin
     */
    #[Route(
        path: '/api/_action/hero-blocks/check-plugin/{pluginName}',
        name: 'api.action.hero-blocks.check-plugin',
        methods: ['GET'],
        defaults: ['auth_required' => true]
    )]
    public function checkPlugin(string $pluginName, Context $context): JsonResponse
    {
        // Prüfe ob JavaScript-Plugin registriert ist (relativ zum Shopware-Root)
        $shopwareRoot = $this->getParameter('kernel.project_dir');
        $pluginPath = sprintf(
            '%s/custom/plugins/HorexShopTheme/src/Resources/app/storefront/src/js/plugin/%s.plugin.js',
            $shopwareRoot,
            strtolower($pluginName)
        );
        
        $exists = file_exists($pluginPath);
        
        return new JsonResponse([
            'success' => true,
            'registered' => $exists,
            'pluginPath' => str_replace($shopwareRoot . '/', '', $pluginPath),
            'message' => $exists 
                ? 'JavaScript-Plugin gefunden' 
                : 'JavaScript-Plugin nicht gefunden (kann normal sein wenn Standard-Plugin verwendet wird)',
        ]);
    }
}

