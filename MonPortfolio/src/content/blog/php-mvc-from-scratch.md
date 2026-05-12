---
title: "PHP MVC from scratch : ce que ça apprend qu'un framework ne montre pas"
date: 2026-01-20
excerpt: "Pour le jeu Tir au But de Planet Boissons, j'ai construit un routeur MVC PHP sans framework. Router, controllers, sessions, API REST : voici ce que ce choix m'a appris sur ce que Laravel fait pour vous sans que vous le sachiez."
tags: ["PHP", "MVC", "Architecture", "MySQL", "API REST", "Sécurité"]
draft: false
---

Pour le développement du jeu Tir au But — une simulation de penalty en ligne avec leaderboard pour une opération marketing Planet Boissons — j'ai fait le choix de ne pas utiliser de framework PHP. Pas par dogmatisme anti-framework : Laravel et Symfony sont d'excellents outils. Mais le contexte s'y prêtait : hébergement mutualisé Apache, durée de vie limitée, complexité métier modérée. Un framework complet aurait été surdimensionné.

Voici ce que j'ai construit, et ce que ça m'a appris.

## Le routeur

Le point d'entrée est un `index.php` qui reçoit toutes les requêtes via une règle `.htaccess` :

```apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ index.php [QSA,L]
```

Le routeur extrait le segment de chemin et dispatche vers le controller approprié :

```php
$path = trim(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH), '/');
$segments = explode('/', $path);
$page = $segments[0] ?: 'home';

match($page) {
    'game'          => (new GameController())->game(),
    'results'       => (new GameController())->results(),
    'leaderboard'   => (new GameController())->leaderboard(),
    'form-lead'     => (new UserController())->formLead(),
    'confirmation'  => (new UserController())->confirmation(),
    'already-played'=> (new UserController())->alreadyPlayed(),
    default         => (new GameController())->home(),
};
```

Simple, lisible, maintenable. Aucune magie.

## Les controllers

`GameController` gère la logique de jeu : affichage de la page principale, réception des scores, génération du leaderboard. `UserController` gère le formulaire de lead (collecte des données joueur) et les états post-jeu.

Chaque méthode de controller suit le même pattern : vérification des préconditions (session valide, utilisateur autorisé à jouer), traitement de la logique métier, rendu d'une vue.

```php
class GameController {
    public function results(): void {
        $this->requireSession();
        $session = $_SESSION['game'] ?? null;

        if (!$session || !isset($session['completed'])) {
            header('Location: /');
            exit;
        }

        $score = $session['score'];
        $view = new View('results');
        $view->render(['score' => $score]);
    }
}
```

## Le système de scoring

Le jeu est une simulation de tir au but : 30 secondes, des cibles qui apparaissent, des points selon la zone touchée. Centro (centre du but) = 1 point, côtés = 2 points, lucarne (coin supérieur) = 3 points.

La validation du score côté serveur est critique sur un jeu avec un classement public. Si le score venait uniquement du client JavaScript, n'importe qui pourrait envoyer `score=99999` via une requête HTTP. La solution : le serveur calcule le score maximum théorique selon la durée et le cadence des cibles, et refuse tout score supérieur.

```php
function validateScore(int $score, int $duration, int $targetCount): bool {
    $maxPossibleScore = $targetCount * 3; // score max si toutes lucarnes
    return $score >= 0 && $score <= $maxPossibleScore;
}
```

Les actions individuelles (chaque clic sur une cible) sont envoyées en temps réel via des requêtes POST à une API dédiée, qui les enregistre et les valide avant d'incrémenter le score en session. Le score final n'est que la somme de ces actions individuelles, jamais une valeur envoyée directement par le client.

## L'API REST maison

Les endpoints de jeu sont des routes qui retournent du JSON :

```php
// /public/api/save-game
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$token = $data['token'] ?? null;

if (!$token || $token !== $_SESSION['csrf_token']) {
    http_response_code(403);
    echo json_encode(['error' => 'Invalid token']);
    exit;
}

// Traitement et sauvegarde
```

Le token CSRF est généré à l'initialisation de la session et inclus dans le HTML de la page de jeu. Chaque requête API le renvoie dans le corps de la requête. Sans ce token, la requête est rejetée.

## Ce qu'on apprend en ne faisant pas appel à un framework

**La gestion des sessions PHP est moins transparente qu'il y paraît.** `session_start()` tout au début de chaque script, `session_regenerate_id(true)` après une authentification pour prévenir la fixation de session, `session_destroy()` pour une déconnexion propre. Ce sont des détails que Laravel gère pour vous sans que vous y pensiez. Quand vous les faites vous-même, vous comprenez pourquoi ils sont là.

**Les headers HTTP doivent être envoyés avant tout output.** Une erreur de débutant que tout le monde fait : un `echo` ou un `var_dump` avant un `header('Location: ...')` génère une erreur "headers already sent". Sans framework, ça arrive régulièrement. Avec un framework, le système de templates et les réponses encapsulées empêchent ça structurellement.

**La protection CSRF n'est pas automatique.** Sur un formulaire, n'importe quel site peut faire soumettre votre formulaire par un utilisateur connecté via une requête cross-origin. Le token CSRF brise cette attaque : sans le token, la requête est rejetée. Laravel le gère avec le middleware VerifyCsrfToken. Sans framework, vous devez y penser vous-même.

**La connexion à la base de données est une ressource partagée.** En PHP, chaque requête HTTP est un processus distinct qui ouvre sa propre connexion MySQL. Pas de pool de connexions natif comme en Node.js ou dans un serveur Java. PDO `new PDO(...)` à chaque requête : c'est correct, mais il faut comprendre pourquoi et ne pas oublier de fermer les connexions.

## Verdict

Construire un MVC PHP from scratch sur un projet réel est un exercice formateur. On comprend ce que font les frameworks, pourquoi ils font ces choix, et ce qu'ils protègent. Ce n'est pas une raison de le faire systématiquement : Laravel est plus productif, plus sécurisé par défaut, et mieux maintenu que n'importe quelle solution maison.

Mais sur un hébergement mutualisé, pour une opération de quelques semaines, avec des contraintes d'environnement qui excluent Composer et les dépendances lourdes, PHP vanilla bien structuré reste une option viable. À condition de ne pas se raconter d'histoires sur la maintenance long terme.
