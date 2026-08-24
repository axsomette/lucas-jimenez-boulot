---
title: "Drupal + Claude AI : Automatiser la gestion de contenu avec les LLMs"
date: 2025-09-04
excerpt: "Intégrer l'API Claude dans Drupal pour automatiser la saisie de contenu : cas d'usage, architecture du module et code."
tags: ["Drupal", "PHP", "Intelligence Artificielle", "Claude API", "Automation"]
draft: false
---

Drupal stocke du contenu, les LLMs en produisent et en analysent. Les brancher ensemble ouvre des usages concrets pour une équipe éditoriale. Je détaille ici l'intégration de l'API Claude dans un projet Drupal et ce qu'elle a changé au quotidien des rédacteurs.

## Pourquoi brancher un LLM sur Drupal

Les CMS comme Drupal ont un problème récurrent : la saisie de contenu est fastidieuse. Un rédacteur qui publie 20 articles par semaine passe un temps considérable sur des tâches répétitives : rédiger des meta descriptions, créer des résumés, standardiser des formats, traduire des bribes de texte.

Un LLM absorbe cette part mécanique et rend au rédacteur le temps qu'il mettra dans son angle éditorial et ses sources. Il ne le remplace nulle part ailleurs.

## Cas d'usage réalistes

Cinq tâches justifient l'effort d'intégration dans un contexte Drupal.

**Génération de meta description**
À partir du body d'un article, produire une meta description SEO de 155 caractères, avec une qualité qui ne dépend plus de la fatigue du rédacteur.

**Résumé automatique**
Produire un excerpt de 2 à 3 phrases pour le listing d'articles, que l'éditeur n'a plus à rédiger.

**Suggestion de tags**
Analyser le contenu et proposer des termes de taxonomy pertinents parmi les termes existants dans Drupal.

**Détection de langue**
Sur un site multilingue, identifier la langue du contenu soumis et le router vers la bonne traduction.

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
Un lecteur doit pouvoir savoir qu'un contenu a été enrichi par un modèle. Le module ajoute un champ booléen `field_ai_assisted` qui marque les contenus concernés.

**Contrôle éditorial**
Le module ne publie jamais de lui-même. Il dépose ses suggestions dans des champs que l'éditeur relit, modifie ou vide avant publication.

**Coût et volume**
Claude Haiku coûte quelques centimes pour des milliers d'appels, mais le volume se surveille. Un `hook_node_presave` qui part à chaque sauvegarde facture 50 appels si l'éditeur enregistre 50 fois le même article.

Solution : ajout d'un flag "déjà généré" et limitation au `isNew()` ou à une action explicite de l'éditeur via un bouton custom.

**Hallucinations**
Un LLM invente. Sur une meta description ou un résumé le risque reste faible, puisque le modèle part du texte réel. Sur une vérification de faits ou une génération de contenu à partir de rien, un humain doit relire.

## Futur

Les APIs de LLMs évoluent vite. Quelques directions qui me semblent prometteuses pour Drupal :

**Embeddings pour la recherche**
Remplacer ou augmenter la recherche full-text native avec une recherche sémantique basée sur des embeddings vectoriels. L'utilisateur cherche "facture impayée" et trouve des articles sur "recouvrement" même si le mot n'y est pas.

**Génération d'images alt text**
Via une API multimodale, Claude accepte des images en entrée et peut décrire les visuels uploadés dans Drupal pour en tirer un texte alternatif.

**Classification automatique de contenu**
Étiqueter les contenus entrants dans un workflow de publication multi-auteurs, ce qui allège la file des modérateurs.

Ces outils rendent du temps aux équipes éditoriales sur la part répétitive du travail. Sur les projets où je les ai testés, le temps récupéré sur la seule saisie des métadonnées paie déjà l'intégration.

Écrivez-moi sur LinkedIn si vous voulez le détail de l'architecture.
