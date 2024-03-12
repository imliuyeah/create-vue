#!/usr/bin/env zx
// 用于发布前的一些准备工作，比如构建、生成快照、更新 playground 等
// playground 是一个用于演示的项目，会在发布时更新它的依赖并提交一个新的快照
import 'zx/globals'

await $`pnpm build`
await $`pnpm snapshot`

// let { version } = JSON.parse(await fs.readFile('./package.json'))

// const playgroundDir = path.resolve(__dirname, '../playground/')
// cd(playgroundDir)

// await $`pnpm install`
// await $`git add -A .`
// try {
//   await $`git commit -m "version ${version} snapshot"`
// } catch (e) {
//   if (!e.stdout.includes('nothing to commit')) {
//     throw e
//   }
// }

// await $`git tag -m "v${version}" v${version}`
// await $`git push --follow-tags`

// const projectRoot = path.resolve(__dirname, '../')
// cd(projectRoot)
// await $`git add playground`
// await $`git commit -m 'chore: update snapshot' --allow-empty`
// await $`git push --follow-tags`
