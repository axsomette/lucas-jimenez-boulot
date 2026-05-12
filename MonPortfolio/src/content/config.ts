import { defineCollection, z } from 'astro:content';

/**
 * Collection : projets
 * Schéma Zod typé — respecte la convention /new-project
 */
const projectsCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    tags: z.array(z.string()),
    date: z.date(),
    featured: z.boolean().default(false),
    /** 'perso' = projet personnel, 'pro' = réalisé en mission/agence */
    type: z.enum(['perso', 'pro']).default('perso'),
    /** Nom du client ou de l'agence (optionnel, pour les projets pro) */
    client: z.string().optional(),
    image: z.string().optional(),
    /** 'wip' = en cours, 'offline' = hors ligne, 'active' = en ligne (défaut) */
    status: z.enum(['active', 'wip', 'offline']).optional().default('active'),
    url: z.string().url().optional(),
    github: z.string().url().optional(),
  }),
});

const experiencesCollection = defineCollection({
  type: 'content',
  schema: z.object({
    role: z.string(),
    company: z.string(),
    type: z.enum(['CDI', 'CDD', 'Alternance', 'Formation']),
    location: z.string(),
    startDate: z.date(),
    endDate: z.date().optional(),
    current: z.boolean().default(false),
    skills: z.array(z.string()),
    order: z.number(),
  }),
});

/**
 * Collection : blog
 * Articles techniques — frontmatter typé
 */
const blogCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title:    z.string(),
    date:     z.date(),
    excerpt:  z.string(),
    tags:     z.array(z.string()),
    draft:    z.boolean().default(false),
    ogImage:  z.string().optional(),
  }),
});

export const collections = {
  projects:    projectsCollection,
  experiences: experiencesCollection,
  blog:        blogCollection,
};
