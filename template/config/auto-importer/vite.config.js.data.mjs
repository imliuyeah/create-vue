export default function getData({ oldData, result }) {
  const importer = [
    "import AutoImport from 'unplugin-auto-import/vite'",
    "import { VueRouterAutoImports } from 'unplugin-vue-router'"
  ]

  const imports = [
    '"vue"',
    'VueRouterAutoImports',
    result.needsPinia ? '"pinia"' : ''
  ].filter(Boolean).map((importItem, index) => index === 0 ? importItem : `        ${importItem}`); // 添加缩进

  const resolvers = [
    result.needsUI ? `ElementPlusResolver()` : ''
  ]

  const autoImportPlugin = {
    name: "autoImport",
    importer: importer.join('\n'),
    initializer: `AutoImport({
      dts: 'types/auto-imports.d.ts',
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
