import { defineUserConfig } from 'vuepress'
import type { DefaultThemeOptions } from 'vuepress'

export default defineUserConfig<DefaultThemeOptions>({
    // site config
    lang: 'en-US',
    title: 'Beta Protection',
    description: 'On-demand censoring of NSFW images just for betas',
    base: '/beta-protection/',
    // theme and its config
    theme: '@vuepress/theme-default',
    themeConfig: {
        logo: 'icon.png',
        repo: 'silveredgold/beta-protection',
        docsDir: 'docs',
        navbar: [
            // NavbarItem
            {
                text: 'Introduction',
                link: '/',
            },
            {
                text: 'Getting Started',
                link: '/getting-started',
            },
            // NavbarGroup
            {
                text: 'User Guide',
                children: ['/guide/installation.md', '/guide/usage', '/guide/overrides', '/guide/mobile', '/guide/beta-safety', '/guide/beta-suite'],
            },
            // string - page file path
            {
                text: 'Developers',
                link: '/developers'
            },
            // {
            //     text: 'GitHub',
            //     link: 'https://github.com/silveredgold/beta-censoring/'
            // }
        ],
    },
})