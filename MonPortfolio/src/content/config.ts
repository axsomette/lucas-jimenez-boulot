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

export const collections = {
  projects: projectsCollection,
  experiences: experiencesCollection,
};
