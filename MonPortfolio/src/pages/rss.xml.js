import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
  const posts = await getCollection('blog', ({ data }) => !data.draft);

  // Sort by date descending
  posts.sort((a, b) => new Date(b.data.date) - new Date(a.data.date));

  const base = import.meta.env.BASE_URL.replace(/\/$/, '');

  return rss({
    title: 'Lucas Jimenez Boulot · Blog',
    description: "Retours d'expérience et articles techniques de Lucas Jimenez Boulot, développeur Full-Stack à Montpellier.",
    site: context.site,
    items: posts.map(post => ({
      title:       post.data.title,
      pubDate:     post.data.date,
      description: post.data.excerpt,
      link:        `${base}/blog/${post.slug}/`,
      categories:  post.data.tags,
    })),
    customData: `<language>fr-FR</language>`,
  });
}
