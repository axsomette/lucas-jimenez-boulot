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
    image: z.string().optional(),
    url: z.string().url().optional(),
    github: z.string().url().optional(),
  }),
});

export const collections = {
  projects: projectsCollection,
};
