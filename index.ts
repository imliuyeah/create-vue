#!/usr/bin/env node

import * as fs from 'node:fs'
import * as path from 'node:path'

import { parseArgs } from 'node:util'

import prompts from 'prompts'
import { red, green, bold } from 'kolorist'

import ejs from 'ejs'

import * as banners from './utils/banners'

import renderTemplate from './utils/renderTemplate'
import { postOrderDirectoryTraverse, preOrderDirectoryTraverse } from './utils/directoryTraverse'
import generateReadme from './utils/generateReadme'
import getCommand from './utils/getCommand'
import getLanguage from './utils/getLanguage'
import renderEslint from './utils/renderEslint'

function isValidPackageName(projectName) {
  return /^(?:@[a-z0-9-*~][a-z0-9-*._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/.test(projectName)
}

function toValidPackageName(projectName) {
  return projectName
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/^[._]/, '')
    .replace(/[^a-z0-9-~]+/g, '-')
}

function canSkipEmptying(dir: string) {
  if (!fs.existsSync(dir)) {
    return true
  }

  const files = fs.readdirSync(dir)
  if (files.length === 0) {
    return true
  }
  if (files.length === 1 && files[0] === '.git') {
    return true
  }

  return false
}

function emptyDir(dir) {
  if (!fs.existsSync(dir)) {
    return
  }

  postOrderDirectoryTraverse(
    dir,
    (dir) => fs.rmdirSync(dir),
    (file) => fs.unlinkSync(file)
  )
}

async function init() {
  console.log()
  console.log(
    process.stdout.isTTY && process.stdout.getColorDepth() > 8
      ? banners.gradientBanner
      : banners.defaultBanner
  )
  console.log()

  const cwd = process.cwd()
  // possible options:
  // --default
  // --typescript / --ts
  // --jsx
  // --router / --vue-router
  // --pinia
  // --with-tests / --tests (equals to `--vitest --cypress`)
  // --vitest
  // --cypress
  // --nightwatch
  // --playwright
  // --eslint
  // --eslint-with-prettier (only support prettier through eslint for simplicity)
  // --force (for force overwriting)

  const args = process.argv.slice(2)
  // alias is not supported by parseArgs
  // 这一步是为了支持别名，比如 --typescript 和 --ts 都是一样的
  const options = {
    typescript: { type: 'boolean' },
    ts: { type: 'boolean' },
    'with-tests': { type: 'boolean' },
    tests: { type: 'boolean' },
    'vue-router': { type: 'boolean' },
    router: { type: 'boolean' }
  } as const

  // parseArgs 会返回一个对象，包含 values 和 errors 两个属性
  // 假设 args 是 ['vue-ts']，那么 values 就是 { _: ['vue-ts'] }
  const { values: argv } = parseArgs({
    args,
    options,
    strict: false
  })

  // if any of the feature flags is set, we would skip the feature prompts
  // 如果有任何一个特性标志使用命令行参数的方式被设置了，后续就会跳过特性的提示
  const isFeatureFlagsUsed =
    typeof (
      argv.default ??
      (argv.ts || argv.typescript) ??
      argv.jsx ??
      (argv.router || argv['vue-router']) ??
      argv.pinia ??
      (argv.tests || argv['with-tests']) ??
      argv.vitest ??
      argv.cypress ??
      argv.nightwatch ??
      argv.playwright ??
      argv.eslint ??
      (argv.elementPlus || argv['element-plus'])
    ) === 'boolean'

  let targetDir = args[0]
  const defaultProjectName = !targetDir ? 'vue-project' : targetDir

  const forceOverwrite = argv.force

  const language = getLanguage()

  let result: {
    projectName?: string
    shouldOverwrite?: boolean
    packageName?: string
    needsTypeScript?: boolean
    needsJsx?: boolean
    needsRouter?: boolean
    needsPinia?: boolean
    needsVitest?: boolean
    needsE2eTesting?: false | 'cypress' | 'nightwatch' | 'playwright'
    needsEslint?: boolean
    needsPrettier?: boolean
    needsUI?: boolean
  } = {}

  try {
    // Prompts:
    // - Project name:
    //   - whether to overwrite the existing directory or not?
    //   - enter a valid package name for package.json
    // - Project language: JavaScript / TypeScript
    // - Add JSX Support?
    // - Install Vue Router for SPA development?
    // - Install Pinia for state management?
    // - Add Cypress for testing?
    // - Add Nightwatch for testing?
    // - Add Playwright for end-to-end testing?
    // - Add ESLint for code quality?
    // - Add Prettier for code formatting?
    result = await prompts(
      [
        {
          name: 'projectName',
          type: targetDir ? null : 'text',
          message: language.projectName.message,
          initial: defaultProjectName,
          onState: (state) => (targetDir = String(state.value).trim() || defaultProjectName)
        },
        {
          name: 'shouldOverwrite',
          type: () => (canSkipEmptying(targetDir) || forceOverwrite ? null : 'toggle'),
          message: () => {
            const dirForPrompt =
              targetDir === '.'
                ? language.shouldOverwrite.dirForPrompts.current
                : `${language.shouldOverwrite.dirForPrompts.target} "${targetDir}"`

            return `${dirForPrompt} ${language.shouldOverwrite.message}`
          },
          initial: true,
          active: language.defaultToggleOptions.active,
          inactive: language.defaultToggleOptions.inactive
        },
        {
          name: 'overwriteChecker',
          type: (prev, values) => {
            if (values.shouldOverwrite === false) {
              throw new Error(red('✖') + ` ${language.errors.operationCancelled}`)
            }
            return null
          }
        },
        {
          name: 'packageName',
          type: () => (isValidPackageName(targetDir) ? null : 'text'),
          message: language.packageName.message,
          initial: () => toValidPackageName(targetDir),
          validate: (dir) => isValidPackageName(dir) || language.packageName.invalidMessage
        },
        // {
        //   name: 'needsTypeScript',
        //   type: () => (isFeatureFlagsUsed ? null : 'toggle'),
        //   message: language.needsTypeScript.message,
        //   initial: true,
        //   active: language.defaultToggleOptions.active,
        //   inactive: language.defaultToggleOptions.inactive
        // },
        {
          name: 'needsJsx',
          type: () => (isFeatureFlagsUsed ? null : 'toggle'),
          message: language.needsJsx.message,
          initial: false,
          active: language.defaultToggleOptions.active,
          inactive: language.defaultToggleOptions.inactive
        },
        // {
        //   name: 'needsRouter',
        //   type: () => (isFeatureFlagsUsed ? null : 'toggle'),
        //   message: language.needsRouter.message,
        //   initial: true,
        //   active: language.defaultToggleOptions.active,
        //   inactive: language.defaultToggleOptions.inactive
        // },
        {
          name: 'needsPinia',
          type: () => (isFeatureFlagsUsed ? null : 'toggle'),
          message: language.needsPinia.message,
          initial: false,
          active: language.defaultToggleOptions.active,
          inactive: language.defaultToggleOptions.inactive
        },
        // {
        //   name: 'needsVitest',
        //   type: () => (isFeatureFlagsUsed ? null : 'toggle'),
        //   message: language.needsVitest.message,
        //   initial: false,
        //   active: language.defaultToggleOptions.active,
        //   inactive: language.defaultToggleOptions.inactive
        // },
        // {
        //   name: 'needsE2eTesting',
        //   type: () => (isFeatureFlagsUsed ? null : 'select'),
        //   hint: language.needsE2eTesting.hint,
        //   message: language.needsE2eTesting.message,
        //   initial: 0,
        //   choices: (prev, answers) => [
        //     {
        //       title: language.needsE2eTesting.selectOptions.negative.title,
        //       value: false
        //     },
        //     {
        //       title: language.needsE2eTesting.selectOptions.cypress.title,
        //       description: answers.needsVitest
        //         ? undefined
        //         : language.needsE2eTesting.selectOptions.cypress.desc,
        //       value: 'cypress'
        //     },
        //     {
        //       title: language.needsE2eTesting.selectOptions.nightwatch.title,
        //       description: answers.needsVitest
        //         ? undefined
        //         : language.needsE2eTesting.selectOptions.nightwatch.desc,
        //       value: 'nightwatch'
        //     },
        //     {
        //       title: language.needsE2eTesting.selectOptions.playwright.title,
        //       value: 'playwright'
        //     }
        //   ]
        // },
        {
          name: 'needsEslint',
          type: () => (isFeatureFlagsUsed ? null : 'toggle'),
          message: language.needsEslint.message,
          initial: false,
          active: language.defaultToggleOptions.active,
          inactive: language.defaultToggleOptions.inactive
        },
        {
          name: 'needsPrettier',
          type: (prev, values) => {
            if (isFeatureFlagsUsed || !values.needsEslint) {
              return null
            }
            return 'toggle'
          },
          message: language.needsPrettier.message,
          initial: false,
          active: language.defaultToggleOptions.active,
          inactive: language.defaultToggleOptions.inactive
        },
        {
          name: 'needsUI',
          type: () => (isFeatureFlagsUsed ? null : 'toggle'),
          message: language.needsUI.message,
          initial: true,
          active: language.defaultToggleOptions.active,
          inactive: language.defaultToggleOptions.inactive
        }
      ],
      {
        onCancel: () => {
          throw new Error(red('✖') + ` ${language.errors.operationCancelled}`)
        }
      }
    )
    // console.log('result', result)
  } catch (cancelled) {
    console.log(cancelled.message)
    process.exit(1)
  }

  // `initial` won't take effect if the prompt type is null
  // so we still have to assign the default values here
  const {
    projectName,
    packageName = projectName ?? defaultProjectName,
    shouldOverwrite = argv.force,
    needsJsx = argv.jsx,
    // needsTypeScript = argv.typescript,
    needsTypeScript = true,
    needsRouter = true, // 默认安装 vue-router 不允许用户选择
    needsPinia = argv.pinia,
    // needsVitest = argv.vitest || argv.tests,
    needsVitest = false,
    needsEslint = argv.eslint || argv['eslint-with-prettier'],
    needsPrettier = argv['eslint-with-prettier'],
    needsUI = argv['element-plus'] || argv.elementPlus
  } = result

  // const { needsE2eTesting } = result
  // const needsCypress = argv.cypress || argv.tests || needsE2eTesting === 'cypress'
  // const needsCypressCT = needsCypress && !needsVitest
  // const needsNightwatch = argv.nightwatch || needsE2eTesting === 'nightwatch'
  // const needsNightwatchCT = needsNightwatch && !needsVitest
  // const needsPlaywright = argv.playwright || needsE2eTesting === 'playwright'
  const needsCypress = false
  const needsCypressCT = false
  const needsNightwatch = false
  const needsNightwatchCT = false
  const needsPlaywright = false

  const root = path.join(cwd, targetDir)

  if (fs.existsSync(root) && shouldOverwrite) {
    emptyDir(root)
  } else if (!fs.existsSync(root)) {
    fs.mkdirSync(root)
  }

  console.log(`\n${language.infos.scaffolding} ${root}...`)

  const pkg = { name: packageName, version: '0.0.0' }
  fs.writeFileSync(path.resolve(root, 'package.json'), JSON.stringify(pkg, null, 2))

  // todo:
  // work around the esbuild issue that `import.meta.url` cannot be correctly transpiled
  // when bundling for node and the format is cjs
  // const templateRoot = new URL('./template', import.meta.url).pathname
  const templateRoot = path.resolve(__dirname, 'template')
  // 在调用 renderTemplate 时，如果文件以 .data.mjs 结尾，就会往 callbacks 数组中添加一个回调函数
  const callbacks = []
  const render = function render(templateName) {
    const templateDir = path.resolve(templateRoot, templateName)
    renderTemplate(templateDir, root, callbacks)
  }
  // Render base template
  render('base')

  // Add configs.
  // 渲染 config 文件夹下的所有文件
  render('config/auto-importer')
  render('config/auto-registry-component')
  if (needsJsx) {
    render('config/jsx')
  }
  if (needsRouter) {
    render('config/router')
  }
  if (needsPinia) {
    render('config/pinia')
  }
  if (needsVitest) {
    render('config/vitest')
  }
  // 新增 element-plus 配置
  if (needsUI) {
    render('config/element-plus')
  }
  if (needsCypress) {
    render('config/cypress')
  }
  if (needsCypressCT) {
    render('config/cypress-ct')
  }
  if (needsNightwatch) {
    render('config/nightwatch')
  }
  if (needsNightwatchCT) {
    render('config/nightwatch-ct')
  }
  if (needsPlaywright) {
    render('config/playwright')
  }
  if (needsTypeScript) {
    render('config/typescript')

    // Render tsconfigs
    render('tsconfig/base')
    // The content of the root `tsconfig.json` is a bit complicated,
    // So here we are programmatically generating it.
    // 这一步是为了生成根目录下的 tsconfig.json 文件
    const rootTsConfig = {
      // It doesn't target any specific files because they are all configured in the referenced ones.
      files: [],
      // All templates contain at least a `.node` and a `.app` tsconfig.
      references: [
        {
          path: './tsconfig.node.json'
        },
        {
          path: './tsconfig.app.json'
        }
      ]
    }
    // 判断需不需要 Cypress，如果需要的话，就渲染 cypress 的 tsconfig，并且需要给根目录的 tsconfig 添加引用
    if (needsCypress) {
      render('tsconfig/cypress')
      // Cypress uses `ts-node` internally, which doesn't support solution-style tsconfig.
      // So we have to set a dummy `compilerOptions` in the root tsconfig to make it work.
      // I use `NodeNext` here instead of `ES2015` because that's what the actual environment is.
      // (Cypress uses the ts-node/esm loader when `type: module` is specified in package.json.)
      // @ts-ignore
      // Cypress 在内部使用 ts-node，而 ts-node 不支持解决方案式的 tsconfig
      // 所以我们需要在根目录的 tsconfig 中设置一个虚拟的 `compilerOptions` 来让它工作
      // 这里使用 `NodeNext` 而不是 `ES2015`，因为这才是实际的环境
      // （Cypress 在 package.json 中指定了 `type: module` 时，使用 ts-node/esm 加载器）
      rootTsConfig.compilerOptions = {
        module: 'NodeNext'
      }
    }
    if (needsCypressCT) {
      render('tsconfig/cypress-ct')
      // Cypress Component Testing needs a standalone tsconfig.
      // rootTsConfig.references 表示 tsconfig 的引用关系
      rootTsConfig.references.push({
        path: './tsconfig.cypress-ct.json'
      })
    }
    if (needsPlaywright) {
      render('tsconfig/playwright')
    }
    if (needsVitest) {
      render('tsconfig/vitest')
      // Vitest needs a standalone tsconfig.
      rootTsConfig.references.push({
        path: './tsconfig.vitest.json'
      })
    }
    if (needsNightwatch) {
      render('tsconfig/nightwatch')
      // Nightwatch needs a standalone tsconfig, but in a different folder.
      rootTsConfig.references.push({
        path: './nightwatch/tsconfig.json'
      })
    }
    if (needsNightwatchCT) {
      render('tsconfig/nightwatch-ct')
    }
    if (needsUI) {
      render('tsconfig/element-plus')
      rootTsConfig.references.push({
        path: './tsconfig.element-plus.json'
      })
    }
    // 将 tsconfig.json 写入到根目录
    // JSON.stringify 的三个参数分别是：要序列化的对象，用于控制结果的可读性的选项，用于控制结果的缩进、空白和换行的选项
    // 这里的意思是：将 rootTsConfig 序列化为 JSON 字符串，缩进为 2 个空格
    fs.writeFileSync(
      path.resolve(root, 'tsconfig.json'),
      JSON.stringify(rootTsConfig, null, 2) + '\n',
      'utf-8'
    )
  }

  // Render ESLint config
  if (needsEslint) {
    renderEslint(root, {
      needsTypeScript,
      needsCypress,
      needsCypressCT,
      needsPrettier,
      needsPlaywright
    })
  }

  if (needsPrettier) {
    render('config/prettier')
  }

  // Render code template.
  // prettier-ignore
  // 渲染 code 文件夹下的文件
  // 这里的 codeTemplate 是一个字符串，它的值是 'typescript-router' 或者 'default'
  const codeTemplate =
    (needsTypeScript ? 'typescript' : '') +
    (needsRouter ? '-router' : '-default') + 
    (needsUI ? '-element' : '')
  render(`code/${codeTemplate}`)

  // Render entry file (main.js/ts).
  // 渲染 entry 文件夹下的文件
  if (needsPinia && needsRouter) {
    render('entry/router-and-pinia')
  } else if (needsPinia) {
    render('entry/pinia')
  } else if (needsRouter) {
    render('entry/router')
  } else {
    render('entry/default')
  }

  // An external data store for callbacks to share data
  // 调用 callbacks 数组中的每一个回调函数
  // 在回调函数中，会调用 getData 函数，然后将返回的数据存储到 dataStore 中
  const dataStore = {}
  // Process callbacks
  for (const cb of callbacks) {
    await cb(dataStore, result)
  }

  // EJS template rendering
  // 前序遍历文件夹，对每一个文件进行处理，如果文件以 .ejs 结尾，就渲染模板
  preOrderDirectoryTraverse(
    root,
    () => {},
    (filepath) => {
      if (filepath.endsWith('.ejs')) {
        const template = fs.readFileSync(filepath, 'utf-8')
        const dest = filepath.replace(/\.ejs$/, '')
        if (dataStore[dest]) dataStore[dest].result = result
        // console.log('dataStore[dest]:', dataStore[dest])
        const content = ejs.render(template, dataStore[dest])
        fs.writeFileSync(dest, content)
        fs.unlinkSync(filepath)
      }
    }
  )

  // Cleanup.

  // We try to share as many files between TypeScript and JavaScript as possible.
  // If that's not possible, we put `.ts` version alongside the `.js` one in the templates.
  // So after all the templates are rendered, we need to clean up the redundant files.
  // (Currently it's only `cypress/plugin/index.ts`, but we might add more in the future.)
  // (Or, we might completely get rid of the plugins folder as Cypress 10 supports `cypress.config.ts`)
  // 我们尽可能地在 TypeScript 和 JavaScript 之间共享尽可能多的文件
  // 如果不可能的话，我们会在模板中将 `.ts` 版本和 `.js` 版本放在一起
  // 所以在所有模板都渲染完之后，我们需要清理多余的文件
  // （目前只有 `cypress/plugin/index.ts`，但是以后我们可能会添加更多的文件）
  // （或者，我们可能会完全摆脱 plugins 文件夹，因为 Cypress 10 支持 `cypress.config.ts`）
  if (needsTypeScript) {
    // Convert the JavaScript template to the TypeScript
    // Check all the remaining `.js` files:
    //   - If the corresponding TypeScript version already exists, remove the `.js` version.
    //   - Otherwise, rename the `.js` file to `.ts`
    // Remove `jsconfig.json`, because we already have tsconfig.json
    // `jsconfig.json` is not reused, because we use solution-style `tsconfig`s, which are much more complicated.
    // 将 JavaScript 模板转换为 TypeScript 模板
    // 检查所有剩余的 `.js` 文件：
    //   - 如果相应的 TypeScript 版本已经存在，删除 `.js` 版本
    //   - 否则，将 `.js` 文件重命名为 `.ts`
    // 删除 `jsconfig.json`，因为我们已经有了 tsconfig.json
    // `jsconfig.json` 没有被重用，因为我们使用了解决方案式的 `tsconfig`，它们要复杂得多
    preOrderDirectoryTraverse(
      root,
      () => {},
      (filepath) => {
        if (filepath.endsWith('.js')) {
          const tsFilePath = filepath.replace(/\.js$/, '.ts')
          if (fs.existsSync(tsFilePath)) {
            fs.unlinkSync(filepath)
          } else {
            fs.renameSync(filepath, tsFilePath)
          }
        } else if (path.basename(filepath) === 'jsconfig.json') {
          // fs.unlinkSync 的作用是删除指定的文件
          fs.unlinkSync(filepath)
        }
      }
    )

    // Rename entry in `index.html`
    const indexHtmlPath = path.resolve(root, 'index.html')
    const indexHtmlContent = fs.readFileSync(indexHtmlPath, 'utf8')
    fs.writeFileSync(indexHtmlPath, indexHtmlContent.replace('src/main.js', 'src/main.ts'))
  } else {
    // Remove all the remaining `.ts` files
    preOrderDirectoryTraverse(
      root,
      () => {},
      (filepath) => {
        if (filepath.endsWith('.ts')) {
          fs.unlinkSync(filepath)
        }
      }
    )
  }

  // Instructions:
  // Supported package managers: pnpm > yarn > npm
  const userAgent = process.env.npm_config_user_agent ?? ''
  const packageManager = /pnpm/.test(userAgent) ? 'pnpm' : /yarn/.test(userAgent) ? 'yarn' : 'npm'

  // README generation
  fs.writeFileSync(
    path.resolve(root, 'README.md'),
    generateReadme({
      projectName: result.projectName ?? result.packageName ?? defaultProjectName,
      packageManager,
      needsTypeScript,
      needsVitest,
      needsCypress,
      needsNightwatch,
      needsPlaywright,
      needsNightwatchCT,
      needsCypressCT,
      needsEslint
    })
  )

  console.log(`\n${language.infos.done}\n`)
  if (root !== cwd) {
    const cdProjectName = path.relative(cwd, root)
    console.log(
      `  ${bold(green(`cd ${cdProjectName.includes(' ') ? `"${cdProjectName}"` : cdProjectName}`))}`
    )
  }
  console.log(`  ${bold(green(getCommand(packageManager, 'install')))}`)
  if (needsPrettier) {
    console.log(`  ${bold(green(getCommand(packageManager, 'format')))}`)
  }
  console.log(`  ${bold(green(getCommand(packageManager, 'dev')))}`)
  console.log()
}

init().catch((e) => {
  console.error(e)
})
