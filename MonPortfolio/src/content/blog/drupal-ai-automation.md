---
title: "Drupal + Claude AI : Automatiser la gestion de contenu avec les LLMs"
date: 2026-05-26
excerpt: "Intégrer Claude API dans Drupal pour l'automation de contenu. Cas d'usage, architecture, et code example."
tags: ["Drupal", "PHP", "Intelligence Artificielle", "Claude API", "Automation"]
draft: false
---

Drupal gère du contenu. Les LLMs génèrent, analysent, et enrichissent du contenu. Leur combinaison ouvre des cas d'usage concrets pour les équipes éditoriales et les agences web. Voici comment j'ai intégré Claude API dans un projet Drupal, et ce que ça change vraiment dans la pratique.

## Contexte : pourquoi l'AI pour Drupal

Les CMS comme Drupal ont un problème récurrent : la saisie de contenu est fastidieuse. Un rédacteur qui publie 20 articles par semaine passe un temps considérable sur des tâches répétitives : rédiger des meta descriptions, créer des résumés, standardiser des formats, traduire des bribes de texte.

Les LLMs ne remplacent pas le rédacteur. Mais ils peuvent absorber la partie mécanique et laisser le rédacteur se concentrer sur la valeur ajoutée : l'expertise, l'angle éditorial, les sources.

## Cas d'usage réalistes

Avant de coder quoi que ce soit, voici ce qui vaut vraiment la peine d'automatiser dans un contexte Drupal :

**Génération de meta description**
À partir du body d'un article, générer une meta description SEO-optimisée de 155 caractères. Gain de temps réel, qualité constante.

**Résumé automatique**
Produire un excerpt de 2-3 phrases pour le listing d'articles, sans que l'éditeur ait à le rédiger manuellement.

**Suggestion de tags**
Analyser le contenu et proposer des termes de taxonomy pertinents parmi les termes existants dans Drupal.

**Détection de langue**
Pour les sites multilingues, identifier automatiquement la langue du contenu soumis et router vers la traduction adéquate.

**Validation de contenu**
Vérifier la conformité d'un article à une charte éditoriale : longueur minimale, présence de liens internes, ton approprié.

## Intégration Claude API dans Drupal

L'intégration se fait via un module custom Drupal qui wrappe les appels HTTP à l'API Claude d'Anthropic.

### Structure du module

```
web/modules/custom/ai_content_helper/
├── ai_content_helper.info.yml
├── ai_content_helper.module
├── ai_content_helper.services.yml
└── src/
    ├── Service/
    │   └── ClaudeService.php
    └── Plugin/
        └── Action/
            └── GenerateMetaDescription.php
```

### Le service ClaudeService

```php
<?php

namespace Drupal\ai_content_helper\Service;

use GuzzleHttp\ClientInterface;
use Drupal\Core\Config\ConfigFactoryInterface;

/**
 * Service d'appel à l'API Claude d'Anthropic.
 */
class ClaudeService {

  const API_URL = 'https://api.anthropic.com/v1/messages';
  const MODEL   = 'claude-haiku-4-5-20251001'; // Rapide et économique pour des tâches simples

  public function __construct(
    private ClientInterface $httpClient,
    private ConfigFactoryInterface $configFactory,
  ) {}

  /**
   * Envoie un prompt à Claude et retourne la réponse texte.
   */
  public function complete(string $prompt, int $maxTokens = 300): string {
    $apiKey = $this->configFactory
      ->get('ai_content_helper.settings')
      ->get('claude_api_key');

    if (!$apiKey) {
      throw new \RuntimeException('Clé API Claude non configurée.');
    }

    $response = $this->httpClient->post(self::API_URL, [
      'headers' => [
        'x-api-key'         => $apiKey,
        'anthropic-version' => '2023-06-01',
        'content-type'      => 'application/json',
      ],
      'json' => [
        'model'      => self::MODEL,
        'max_tokens' => $maxTokens,
        'messages'   => [
          ['role' => 'user', 'content' => $prompt],
        ],
      ],
    ]);

    $data = json_decode($response->getBody()->getContents(), TRUE);
    return trim($data['content'][0]['text'] ?? '');
  }

  /**
   * Génère une meta description SEO à partir d'un texte.
   */
  public function generateMetaDescription(string $bodyText): string {
    $truncated = mb_substr(strip_tags($bodyText), 0, 2000);

    $prompt = <<<PROMPT
Tu es un expert SEO. Génère une meta description pour l'article suivant.
Contraintes strictes :
- Maximum 155 caractères
- En français
- Inclut les mots-clés principaux du texte
- Donne envie de lire l'article
- Ne commence pas par "Découvrez" ou "Apprenez"

Texte de l'article :
{$truncated}

Réponds uniquement avec la meta description, sans guillemets, sans explication.
PROMPT;

    return $this->complete($prompt, 100);
  }

}
```

### Hook sur la sauvegarde d'un nœud

```php
<?php
// ai_content_helper.module

use Drupal\node\NodeInterface;

/**
 * Implements hook_node_presave().
 */
function ai_content_helper_node_presave(NodeInterface $node): void {
  // Uniquement sur les articles, à la création
  if ($node->bundle() !== 'article' || !$node->isNew()) {
    return;
  }

  // Uniquement si la meta description est vide
  if ($node->hasField('field_meta_description')
    && $node->get('field_meta_description')->isEmpty()
    && $node->hasField('body')
    && !$node->get('body')->isEmpty()
  ) {
    try {
      /** @var \Drupal\ai_content_helper\Service\ClaudeService $claude */
      $claude = \Drupal::service('ai_content_helper.claude');
      $body   = $node->get('body')->value;
      $meta   = $claude->generateMetaDescription($body);
      $node->set('field_meta_description', $meta);
    }
    catch (\Throwable $e) {
      // On log l'erreur mais on ne bloque pas la sauvegarde
      \Drupal::logger('ai_content_helper')->error(
        'Erreur génération meta : @msg',
        ['@msg' => $e->getMessage()]
      );
    }
  }
}
```

## Éthique et limitations

Intégrer un LLM dans un CMS soulève des questions légitimes :

**Transparence**
Les contenus générés ou enrichis par AI doivent être identifiables. Dans le module, on ajoute un champ booléen `field_ai_assisted` pour tracker quels contenus ont été touchés par le modèle.

**Contrôle éditorial**
L'AI génère, l'humain valide. Le module n'auto-publie jamais. Les suggestions vont dans des champs que l'éditeur peut modifier ou effacer avant publication.

**Coût et volume**
Claude Haiku est économique (quelques centimes pour des milliers d'appels), mais il faut monitorer le volume. Un hook `hook_node_presave` qui tire pour chaque sauvegarde peut générer des coûts inattendus si l'éditeur sauvegarde 50 fois un même article.

Solution : ajout d'un flag "déjà généré" et limitation au `isNew()` ou à une action explicite de l'éditeur via un bouton custom.

**Hallucinations**
Les LLMs inventent parfois. Pour une meta description ou un résumé, le risque est limité (on part du vrai texte). Pour une vérification de faits ou une génération de contenu brut, le contrôle humain est indispensable.

## Futur

Les APIs de LLMs évoluent vite. Quelques directions qui me semblent prometteuses pour Drupal :

**Embeddings pour la recherche**
Remplacer ou augmenter la recherche full-text native avec une recherche sémantique basée sur des embeddings vectoriels. L'utilisateur cherche "facture impayée" et trouve des articles sur "recouvrement" même si le mot n'y est pas.

**Génération d'images alt text**
Via une API multimodale (Claude prend des images en entrée), générer automatiquement des textes alternatifs descriptifs pour les images uploadées dans Drupal.

**Classification automatique de contenu**
Tagger automatiquement les contenus entrants dans un workflow de publication multi-auteurs, réduisant la charge des modérateurs.

L'idée n'est pas de remplacer les équipes éditoriales, mais de leur donner des outils qui absorbent la charge répétitive. Sur les projets où je l'ai testé, le gain de temps sur la saisie de métadonnées seul justifie l'intégration.

Des questions sur l'architecture ou l'implémentation ? N'hésitez pas à me contacter sur LinkedIn.
