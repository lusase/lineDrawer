// @ts-check
import {defineConfig} from 'rollup'
import esbuild from 'rollup-plugin-esbuild'
import dts from 'rollup-plugin-dts'
export default defineConfig([{
  input: 'src/index.ts',
  external: ['fabric', 'tinycolor2'],
  plugins: [
    esbuild({
      tsconfig: './tsconfig.json',
      sourceMap: true,
      minify: true,
      target: 'es2015'
    })
  ],
  output: [{
    name: 'LineDrawer',
    file: 'dist/linedrawer.js',
    format: 'umd',
    globals: {
      fabric:  'fabric',
      tinycolor2: 'tinycolor'
    }
  }, {
    name: 'LineDrawer',
    file: 'dist/linedrawer.esm.js',
    format: 'esm'
  }]
}, {
  input: 'src/index.ts',
  plugins: [dts()],
  output: {
    format: 'esm',
    file: 'dist/linedrawer.d.ts'
  }
}])
