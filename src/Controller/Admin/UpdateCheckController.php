<?php declare(strict_types=1);

namespace HeroBlocks\Controller\Admin;

use HeroBlocks\Service\UpdateCheckService;
use Shopware\Core\Framework\Context;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

/**
 * Update Check Controller
 * 
 * API-Endpunkt für Plugin-Update-Checks
 * Gemäß Shopware Best Practices für Admin-Controllers
 */
class UpdateCheckController extends AbstractController
{
    private UpdateCheckService $updateCheckService;

    public function __construct(UpdateCheckService $updateCheckService)
    {
        $this->updateCheckService = $updateCheckService;
    }

    /**
     * Prüft auf verfügbare Updates
     * 
     * GET /api/_action/hero-blocks/update-check
     */
    #[Route(
        path: '/api/_action/hero-blocks/update-check',
        name: 'api.action.hero-blocks.update-check',
        defaults: ['_routeScope' => ['api']],
        methods: ['GET']
    )]
    public function checkForUpdates(Request $request, Context $context): JsonResponse
    {
        try {
            $result = $this->updateCheckService->checkForUpdates();
            
            return new JsonResponse([
                'success' => true,
                'data' => $result,
            ]);
        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}

