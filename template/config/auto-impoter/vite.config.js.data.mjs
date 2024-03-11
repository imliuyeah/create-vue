export default function getData({ oldData, result }) {
  const importer = [
    "import AutoImport from 'unplugin-auto-import/vite'",
    "import { VueRouterAutoImports } from 'unplugin-vue-router'",
    result.needsUI ? "import { elementPlusResolver } from 'unplugin-auto-import/resolvers'" : ''
  ]

  const imports = [
    '"vue"',
    'VueRouterAutoImports',
    result.needsPinia ? '"pinia"' : ''
  ]

  const resolvers = [
    result.needsUI ? `elementPlusResolver()` : ''
  ]

  const autoImportPlugin = {
    name: "autoImport",
    importer: importer.join('\n'),
    initializer: `AutoImport({
      imports: [
        ${imports.join(',\n')}
      ],
      resolvers: [
        ${resolvers.join(',\n')}
      ]
    })`
  }

  return {
    ...oldData,
    plugins: [
      ...oldData.plugins,
      autoImportPlugin
    ]
  }
}
