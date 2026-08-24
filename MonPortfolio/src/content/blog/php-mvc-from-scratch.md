---
title: "PHP MVC from scratch : ce que ça apprend qu'un framework ne montre pas"
date: 2026-01-20
excerpt: "Pour le jeu Tir au But de Planet Boissons, j'ai construit un MVC PHP sans framework. Routeur, controllers, sessions et API REST : ce que Laravel prend en charge à votre place, et qu'on ne voit qu'en s'en passant."
tags: ["PHP", "MVC", "Architecture", "MySQL", "API REST", "Sécurité"]
draft: false
---

Tir au But est une simulation de penalty en ligne avec leaderboard, développée pour une opération marketing Planet Boissons. J'ai écarté les frameworks PHP sur ce projet, alors que Laravel et Symfony restent d'excellents outils : l'hébergement était un mutualisé Apache, la durée de vie du jeu limitée et la complexité métier modérée. Un framework complet aurait pesé plus lourd que le jeu lui-même.

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

Le dispatch se relit d'un bloc, sans documentation ni couche d'indirection.

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

Sur un jeu à classement public, le serveur doit valider le score. Si le client JavaScript en était seul juge, n'importe qui enverrait `score=99999` par une requête HTTP. Le serveur calcule donc le score maximum théorique d'après la durée et la cadence des cibles, et rejette tout ce qui dépasse.

```php
function validateScore(int $score, int $duration, int $targetCount): bool {
    $maxPossibleScore = $targetCount * 3; // score max si toutes lucarnes
    return $score >= 0 && $score <= $maxPossibleScore;
}
```

Chaque clic sur une cible part en temps réel vers une API dédiée par une requête POST. L'API l'enregistre, le valide, puis incrémente le score en session. Le score final n'est que la somme de ces actions, et jamais une valeur transmise telle quelle par le client.

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

## Ce que le framework prend en charge à votre place

**La gestion des sessions PHP est moins transparente qu'il y paraît.** `session_start()` tout au début de chaque script, `session_regenerate_id(true)` après une authentification pour prévenir la fixation de session, `session_destroy()` pour une déconnexion propre. Ce sont des détails que Laravel gère pour vous sans que vous y pensiez. Quand vous les faites vous-même, vous comprenez pourquoi ils sont là.

**Les headers HTTP partent avant tout output.** Un `echo` ou un `var_dump` glissé avant un `header('Location: ...')` déclenche le fameux « headers already sent ». Sans framework, je me suis fait piéger plusieurs fois. Avec un framework, le système de templates et les réponses encapsulées rendent l'erreur impossible.

**La protection CSRF n'est pas automatique.** Sur un formulaire, n'importe quel site peut faire soumettre votre formulaire par un utilisateur connecté via une requête cross-origin. Le token CSRF brise cette attaque : sans le token, la requête est rejetée. Laravel le gère avec le middleware VerifyCsrfToken. Sans framework, vous devez y penser vous-même.

**La connexion à la base de données est une ressource partagée.** En PHP, chaque requête HTTP est un processus distinct qui ouvre sa propre connexion MySQL. Pas de pool de connexions natif comme en Node.js ou dans un serveur Java. Un `new PDO(...)` à chaque requête reste correct, à condition de savoir pourquoi et de fermer les connexions derrière soi.

## Verdict

Écrire un MVC PHP de zéro sur un projet réel apprend ce que les frameworks font, et surtout ce qu'ils protègent. Ça ne justifie pas de recommencer à chaque fois : Laravel reste plus productif et mieux sécurisé par défaut qu'une solution maison, et une équipe le maintient à ma place.

Sur un hébergement mutualisé, pour une opération de quelques semaines, avec un environnement qui exclut Composer et les dépendances lourdes, du PHP vanilla bien structuré fait le travail. Je ne le proposerais pas pour une application qu'il faudra maintenir cinq ans.
