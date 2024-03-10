export default function getData({ oldData }) {
  const autoImportPlugin = {
    name: 'autoImport',
    importer: 'import autoImport from 'unplugin-auto-import/vite'',
    initializer: `autoImport({ 
      resolvers: [elementPlusResolver()] 
    })`
  }

  const componentsPlugin = {
    name: 'components',
    importer: `import components from 'unplugin-vue-components/vite' \n import { elementPlusResolver } from 'unplugin-vue-components/resolvers'`,
    initializer: `components({ 
      resolvers: [elementPlusResolver()]
    })`
  }

  return {
    ...oldData,
    plugins: [
      ...oldData.plugins,
      autoImportPlugin,
      componentsPlugin
    ]
  }
}
