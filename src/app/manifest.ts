import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Crpapo | The Interactive Pattern Library',
    short_name: 'Crpapo',
    description:
      'The interactive crochet pattern library where crafters never lose their place, and designers share their work beautifully.',
    start_url: '/',
    display: 'standalone',
    background_color: '#FAFAF9',
    theme_color: '#D97757',
    icons: [
      {
        src: '/icon.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}