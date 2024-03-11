export default function getData({ oldData, result }) {
  const importer = [
    "import Components from 'unplugin-vue-components/vite'",
    result.needsUI ? `
import {
  ElementPlusComponentsResolver,
  VueUseComponentsResolver
} from 'unplugin-vue-components/resolvers'
    ` : "import { VueUseComponentsResolver } from 'unplugin-vue-components/resolvers'"
  ]

  const resolvers = [
    'VueUseComponentsResolver()',
    result.needsUI ?  'ElementPlusComponentsResolver()' : null
  ].filter(Boolean).map((importItem, index) => index === 0 ? importItem : `        ${importItem}`); // 添加缩进


  const autoRegistryComponentsPlugin = {
    name: "autoRegistryComponents",
    importer: importer.join('\n'),
    initializer: `Components({
      dts: 'types/components.d.ts',
      dirs: ['src/components'],
      extensions: ['vue', 'md'],
      deep: true,
      directoryAsNamespace: false,
      globalNamespaces: [],
      directives: true,
      include: [/\.vue$/],
      exclude: [/[\\/]node_modules[\\/]/, /[\\/]\.git[\\/]/],
      resolvers: [
        ${resolvers.join(',\n')}
      ]
    })`
  }

  return {
    ...oldData,
    plugins: [
      ...oldData.plugins,
      autoRegistryComponentsPlugin
    ]
  }
}
