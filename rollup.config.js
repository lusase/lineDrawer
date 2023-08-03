// @ts-check
import esbuild from 'rollup-plugin-esbuild'
import nodePloyfills from 'rollup-plugin-polyfill-node'
export default {
  input: 'src/index.ts',
  external: ['fabric'],
  plugins: [
    nodePloyfills(),
    esbuild({
      tsconfig: './tsconfig.json',
      sourceMap: false,
      minify: false,
      target: 'es2015'
    })
  ],
  output: {
    name: 'Sketchpad',
    dir: 'dist',
    format: 'umd'
  }
}
