/* globals Docute */

// if ('serviceWorker' in navigator) {
//     navigator.serviceWorker.register('/sw.js')
// }

new Docute({
    target: '#docute',
    layout: 'narrow',
    title: 'Beta Protection',
    theme: 'dark',
    sourcePath: './',
    nav: [
      {
        title: 'Home',
        link: '/'
      },
      {
        title: 'GitHub',
        link: 'https://github.com/silveredgold/beta-protection'
      }
    ],
    sidebar: [
      {
        title: 'Guide',
        links: [
          {
            title: 'Introduction',
            link: '/guide/introduction'
          },
          {
            title: 'Installation',
            link: '/guide/installation'
          },
          {
            title: 'Usage',
            link: '/guide/usage'
          },
          {
            title: 'Android',
            link: '/guide/mobile'
          }
        ]
      }
    ]
  })
  