# Ajouter un projet au portfolio

Crée une nouvelle entrée de projet dans les Content Collections.

## Usage
/new-project [nom-du-projet]

## Instructions
1. Créer `src/content/projects/[nom-du-projet].mdx`
2. Remplir le frontmatter avec : title, description, tags, date, featured, image, url, github
3. Rédiger la description du projet en MDX
4. Vérifier que le schéma Zod dans `src/content/config.ts` est respecté
